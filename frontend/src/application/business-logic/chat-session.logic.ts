import type { FeedStreamPort, MessageRepository, RunRepository } from '@/core/repositories'
import type { ChatSessionStatus, FeedEvent, FeedMessage } from '@/core/entities'
import { applyFeedEvent } from './feed.reducer'
import { FeedCancelledError } from '@/data/stream'

export interface ChatSessionStatePatch {
    messages?: FeedMessage[]
    status?: ChatSessionStatus
    error?: Error | undefined
    isLoading?: boolean
    activeRunId?: string | undefined
}

export interface ChatSessionDeps {
    messagesRepo: MessageRepository
    runsRepo: RunRepository
    stream: FeedStreamPort
    onState: (chatId: string, patch: ChatSessionStatePatch) => void
}

export interface ChatSessionEngine {
    loadHistory(workspaceId: string, chatId: string): Promise<void>
    sendMessage(workspaceId: string, chatId: string, text: string): Promise<void>
    stop(chatId: string): Promise<void>
    dispose(chatId: string): void
    clear(): void
}

interface ActiveWatch {
    workspaceId: string
    runId: string
    detach: () => void
}

export function createChatSessionEngine(deps: ChatSessionDeps): ChatSessionEngine {
    const cache = new Map<string, FeedMessage[]>()
    const watches = new Map<string, ActiveWatch>()
    const loaded = new Set<string>()

    function patchMessages(chatId: string, messages: FeedMessage[]): void {
        cache.set(chatId, messages)
        deps.onState(chatId, { messages: [...messages] })
    }

    function applyEvent(chatId: string, event: FeedEvent): void {
        const next = applyFeedEvent(cache.get(chatId) ?? [], event)
        patchMessages(chatId, next)
        if (event.type === 'oops') {
            const detail = typeof event.message === 'string' ? event.message : 'Run failed'
            deps.onState(chatId, {
                error: new Error(detail),
                status: 'error',
                isLoading: false,
                activeRunId: undefined,
            })
            watches.delete(chatId)
        }
        if (event.type === 'run-close') {
            finishWatch(chatId, event.status, typeof event.message === 'string' ? event.message : undefined)
        }
    }

    function finishWatch(chatId: string, status: unknown, message?: string): void {
        const watch = watches.get(chatId)
        if (watch) {
            watch.detach()
            watches.delete(chatId)
        }
        if (status === 'failed') {
            deps.onState(chatId, {
                error: new Error(message || 'Run failed'),
                status: 'error',
                isLoading: false,
                activeRunId: undefined,
            })
        } else {
            // done + cancelled both settle cleanly; stop() already patched
            // its own state, so only fill in when still loading.
            deps.onState(chatId, { status: 'ready', isLoading: false, activeRunId: undefined })
        }
    }

    function attach(
        workspaceId: string,
        chatId: string,
        runId: string,
        afterSeq: number,
    ): void {
        const prev = watches.get(chatId)
        if (prev) {
            prev.detach()
            watches.delete(chatId)
        }
        deps.onState(chatId, { status: 'streaming', isLoading: true, activeRunId: runId, error: undefined })
        const detach = deps.stream.openStream(workspaceId, chatId, runId, afterSeq, {
            onEvent: (event) => applyEvent(chatId, event),
            onSeq: () => {},
            onDone: () => finishWatch(chatId, 'done'),
            onError: (err) => {
                if (err instanceof FeedCancelledError) {
                    finishWatch(chatId, 'cancelled')
                    return
                }
                const watch = watches.get(chatId)
                if (watch) {
                    watch.detach()
                    watches.delete(chatId)
                }
                deps.onState(chatId, {
                    error: err,
                    status: 'error',
                    isLoading: false,
                    activeRunId: undefined,
                })
            },
        })
        watches.set(chatId, { workspaceId, runId, detach })
    }

    async function loadHistory(workspaceId: string, chatId: string): Promise<void> {
        if (loaded.has(chatId)) return
        loaded.add(chatId)
        try {
            const history = await deps.messagesRepo.loadHistory(workspaceId, chatId)
            let messages: FeedMessage[] = []
            for (const event of history ?? []) {
                messages = applyFeedEvent(messages, event)
            }
            patchMessages(chatId, messages)
            deps.onState(chatId, { status: 'ready', isLoading: false })

            // Reattach to a still-running run: replay is final DB state,
            // the live tail rebuilds on top of it from seq 0.
            const runs = await deps.runsRepo.list(workspaceId, chatId).catch(() => [])
            const running = (runs ?? []).filter((r) => r.status === 'running')
            const target = running[0]
            if (target) {
                attach(workspaceId, chatId, target.runId, 0)
            }
        } catch (e: unknown) {
            deps.onState(chatId, {
                error: e instanceof Error ? e : new Error('Failed to load messages'),
            })
        }
    }

    async function sendMessage(workspaceId: string, chatId: string, text: string): Promise<void> {
        if (!text.trim()) return
        const userMessage: FeedMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            blocks: [{ kind: 'text', sliceId: crypto.randomUUID(), text, closed: true }],
        }
        patchMessages(chatId, [...(cache.get(chatId) ?? []), userMessage])
        deps.onState(chatId, { error: undefined, isLoading: true, status: 'submitted' })
        try {
            const started = await deps.runsRepo.start(workspaceId, chatId, {
                id: userMessage.id,
                role: 'user',
                parts: [{ type: 'text', text }],
            })
            attach(workspaceId, chatId, started.runId, 0)
        } catch (e: unknown) {
            deps.onState(chatId, {
                error: e instanceof Error ? e : new Error('Failed to send message'),
                status: 'error',
                isLoading: false,
            })
        }
    }

    async function stop(chatId: string): Promise<void> {
        const watch = watches.get(chatId)
        if (watch) {
            // Cancel server-side (kills the agent). The `run-close`
            // terminal frame settles the stream; detach only unwatches.
            try {
                await deps.runsRepo.cancel(watch.workspaceId, chatId, watch.runId)
            } catch (e: unknown) {
                deps.onState(chatId, {
                    error: e instanceof Error ? e : new Error('Failed to cancel run'),
                })
            }
        }
        const active = watches.get(chatId)
        if (active) {
            active.detach()
            watches.delete(chatId)
        }
        deps.onState(chatId, { status: 'ready', isLoading: false, activeRunId: undefined })
    }

    function detach(chatId: string): void {
        // Closing a tab only detaches the local watcher — the run keeps
        // going on the backend and can be resumed later.
        const watch = watches.get(chatId)
        if (watch) {
            watch.detach()
            watches.delete(chatId)
        }
        loaded.delete(chatId)
    }

    function dispose(chatId: string): void {
        detach(chatId)
    }

    function clear(): void {
        for (const chatId of watches.keys()) {
            detach(chatId)
        }
        cache.clear()
        loaded.clear()
    }

    return { loadHistory, sendMessage, stop, dispose, clear }
}
