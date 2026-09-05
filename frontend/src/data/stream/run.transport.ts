import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { WatchRun, UnwatchRun } from '../../../wailsjs/go/stream/RunStreamService'
import { EventsOn } from '../../../wailsjs/runtime'
import { createRunStreamDispatcher, type RunStreamDispatcher } from './run.dispatcher'
import type { ChatStreamPort, RunRepository } from '@/core/repositories'

const GLOBAL_KEY = '__wailsRunStreamDispatcher__'

export interface RunFetchHooks {
    onRunStarted(chatId: string, runId: string): void
    onSeq(chatId: string, seq: number): void
    getResumeTarget(chatId: string): { runId: string; afterSeq: number } | undefined
    clearResumeTarget(chatId: string): void
}

export interface RunFetchDeps {
    runs: RunRepository
    hooks: RunFetchHooks
}

function readSeq(line: string): number | undefined {
    try {
        const parsed = JSON.parse(line) as { seq?: unknown }
        return typeof parsed.seq === 'number' ? parsed.seq : undefined
    } catch {
        return undefined
    }
}

function isUserCancel(payload: string): boolean {
    try {
        const parsed = JSON.parse(payload) as { type?: unknown; status?: unknown }
        return parsed.type === 'run-status' && parsed.status === 'cancelled'
    } catch {
        return false
    }
}

function openWatchStream(
    dispatcher: RunStreamDispatcher,
    workspaceId: string,
    chatId: string,
    runId: string,
    afterSeq: number,
    deps: RunFetchDeps,
): { response: Response; cancel: () => void } {
    let watchId: string | null = null
    let unsubscribe: (() => void) | null = null

    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            const encoder = new TextEncoder()
            watchId = crypto.randomUUID()
            unsubscribe = dispatcher.subscribe(watchId, {
                onChunk: (line) => {
                    const seq = readSeq(line)
                    if (seq !== undefined) deps.hooks.onSeq(chatId, seq)
                    // The Go bridge strips SSE framing (ReadEvent returns the
                    // raw payload). DefaultChatTransport parses via
                    // EventSourceParserStream, so re-frame every payload as a
                    // proper SSE data event — bare JSON lines are ignored.
                    controller.enqueue(encoder.encode(`data: ${line}\n\n`))
                },
                onDone: () => controller.close(),
                onError: (err) => {
                    // User-initiated cancel surfaces as a terminal frame, not
                    // an error: close the stream so Chat finishes cleanly.
                    if (isUserCancel(err)) controller.close()
                    else controller.error(new Error(err))
                },
            })
            WatchRun(watchId, workspaceId, chatId, runId, afterSeq).catch((err: Error) => {
                controller.error(err)
            })
        },
        cancel() {
            unsubscribe?.()
            if (watchId) UnwatchRun(watchId).catch(() => {})
        },
    })

    return {
        response: new Response(stream),
        cancel: () => {
            unsubscribe?.()
            if (watchId) UnwatchRun(watchId).catch(() => {})
        },
    }
}

export function createRunFetch(workspaceId: string, chatId: string, deps: RunFetchDeps) {
    return async (_url: RequestInfo | URL, options?: RequestInit) => {
        const method = (options?.method ?? 'GET').toUpperCase()

        // Reconnect path used by Chat.resumeStream(): attach to an already
        // running run instead of starting a new one.
        if (method === 'GET') {
            const target = deps.hooks.getResumeTarget(chatId)
            if (!target) {
                return new Response(null, { status: 204 })
            }
            deps.hooks.clearResumeTarget(chatId)
            const { response } = openWatchStream(
                getGlobalDispatcher(),
                workspaceId,
                chatId,
                target.runId,
                target.afterSeq,
                deps,
            )
            return response
        }

        const bodyRaw = JSON.parse((options?.body as string) ?? '{}')
        const messages: UIMessage[] = bodyRaw.messages ?? []
        const lastUser = [...messages].reverse().find((m) => m.role === 'user')
        if (!lastUser) {
            throw new Error('run transport: no user message to send')
        }

        const started = await deps.runs.start(workspaceId, chatId, lastUser)
        deps.hooks.onRunStarted(chatId, started.runId)

        const { response } = openWatchStream(
            getGlobalDispatcher(),
            workspaceId,
            chatId,
            started.runId,
            0,
            deps,
        )
        return response
    }
}

export function createRunChatTransport(workspaceId: string, chatId: string, deps: RunFetchDeps) {
    return new DefaultChatTransport({
        api: '',
        fetch: createRunFetch(workspaceId, chatId, deps),
        prepareReconnectToStreamRequest: () => ({}),
    })
}

function getGlobalDispatcher(): RunStreamDispatcher {
    const g = globalThis as Record<string, unknown>
    let dispatcher = g[GLOBAL_KEY] as RunStreamDispatcher | undefined
    if (!dispatcher) {
        dispatcher = createRunStreamDispatcher(EventsOn)
        g[GLOBAL_KEY] = dispatcher
    }
    return dispatcher
}

export function resetRunDispatcherGlobal(): void {
    const g = globalThis as Record<string, unknown>
    const dispatcher = g[GLOBAL_KEY] as RunStreamDispatcher | undefined
    if (dispatcher) {
        dispatcher.destroy()
        delete g[GLOBAL_KEY]
    }
}

if (
    import.meta.hot &&
    typeof import.meta.hot.dispose === 'function' &&
    typeof import.meta.hot.accept === 'function'
) {
    import.meta.hot.dispose(() => {
        resetRunDispatcherGlobal()
    })
    import.meta.hot.accept()
}

export function createRunStreamPort(deps: RunFetchDeps): ChatStreamPort {
    return {
        createTransport: (workspaceId: string, chatId: string) =>
            createRunChatTransport(workspaceId, chatId, deps),
    }
}
