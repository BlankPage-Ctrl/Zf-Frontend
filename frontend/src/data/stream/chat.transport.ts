import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { StartStream, CancelStream } from '../../../wailsjs/go/stream/ChatStreamService'
import { EventsOn, LogInfo, LogError } from '../../../wailsjs/runtime'
import { createChatStreamDispatcher, type ChatStreamDispatcher } from './chat.dispatcher'
import type { ChatStreamPort } from '@/core/repositories'

const GLOBAL_KEY = '__wailsChatStreamDispatcher__'

export function createChatFetch(workspaceId: string, chatId: string) {
    return async (_url: RequestInfo | URL, options?: RequestInit) => {
        const optionsInit = options ?? {}
        const bodyRaw = JSON.parse((optionsInit.body as string) ?? '{}')
        const messages: UIMessage[] = bodyRaw.messages ?? []
        const last = messages[messages.length - 1]
        const messageBody = JSON.stringify({ message: last })

        let streamId: string | null = null
        let cancelled = false
        let unsubscribe: (() => void) | null = null

        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                const encoder = new TextEncoder()
                let eventCount = 0
                const dispatcher = getGlobalDispatcher()

                const removeSubscription = (): void => {
                    if (unsubscribe) {
                        unsubscribe()
                    } else if (streamId) {
                        dispatcher.discard(streamId)
                    }
                }

                const onChunk = (line: string): void => {
                    eventCount++
                    if (eventCount <= 3 || eventCount % 50 === 0) {
                        LogInfo(
                            `[chattransport] chunk#${eventCount} sid=${streamId} OK enqueue line=${line.slice(0, 100)}`,
                        )
                    }
                    controller.enqueue(encoder.encode(line + '\n'))
                }

                const onDone = (): void => {
                    if (!streamId) return
                    LogInfo(`[chattransport] onDone sid=${streamId} totalEvents=${eventCount}`)
                    removeSubscription()
                    controller.close()
                }

                const onError = (err: string): void => {
                    if (!streamId) return
                    LogError(`[chattransport] onError sid=${streamId} err=${err}`)
                    removeSubscription()
                    controller.error(new Error(err))
                }

                StartStream(workspaceId, chatId, messageBody)
                    .then((id: string) => {
                        if (cancelled) {
                            dispatcher.discard(id)
                            CancelStream(id)
                            return
                        }
                        streamId = id
                        LogInfo(`[chattransport] streamId set = ${id}`)
                        unsubscribe = dispatcher.subscribe(id, { onChunk, onDone, onError })
                    })
                    .catch((err: Error) => {
                        LogError(`[chattransport] StartStream rejected ${err}`)
                        controller.error(err)
                    })
            },
            cancel() {
                cancelled = true
                if (unsubscribe) {
                    unsubscribe()
                } else if (streamId) {
                    getGlobalDispatcher().discard(streamId)
                }
                if (streamId) CancelStream(streamId)
            },
        })

        return new Response(stream)
    }
}

export function createWailsChatTransport(workspaceId: string, chatId: string) {
    return new DefaultChatTransport({
        api: '',
        fetch: createChatFetch(workspaceId, chatId),
    })
}

function getGlobalDispatcher(): ChatStreamDispatcher {
    const g = globalThis as Record<string, unknown>
    let dispatcher = g[GLOBAL_KEY] as ChatStreamDispatcher | undefined
    if (!dispatcher) {
        dispatcher = createChatStreamDispatcher(EventsOn)
        g[GLOBAL_KEY] = dispatcher
    }
    return dispatcher
}

export function resetChatDispatcherGlobal(): void {
    const g = globalThis as Record<string, unknown>
    const dispatcher = g[GLOBAL_KEY] as ChatStreamDispatcher | undefined
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
        resetChatDispatcherGlobal()
    })
    import.meta.hot.accept()
}

export const chatStream: ChatStreamPort = {
    createTransport: createWailsChatTransport,
}
