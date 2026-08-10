import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { StartStream, CancelStream } from '../../../wailsjs/go/stream/ChatStreamService'
import { EventsOn, LogInfo, LogError } from '../../../wailsjs/runtime'
import type { ChatStreamPort } from '@/core/repositories'

export function createWailsChatTransport(workspaceId: string, chatId: string) {
    return new DefaultChatTransport({
        api: '',
        fetch: async (_url: RequestInfo | URL, options?: RequestInit) => {
            const optionsInit = options ?? {}
            const bodyRaw = JSON.parse((optionsInit.body as string) ?? '{}')
            const messages: UIMessage[] = bodyRaw.messages ?? []
            const last = messages[messages.length - 1]
            const messageBody = JSON.stringify({ message: last })
            let streamId: string | null = null
            let cancelled = false
            let cleanup: (() => void)[] = []

            const stream = new ReadableStream<Uint8Array>({
                start(controller) {
                    const encoder = new TextEncoder()
                    let eventCount = 0
                    let droppedBeforeId = 0
                    let buffered: Array<
                        | { kind: 'chunk'; sid: string; line: string }
                        | { kind: 'done'; sid: string }
                        | { kind: 'error'; sid: string; err: string }
                    > = []

                    const enqueueChunk = (sid: string, line: string) => {
                        if (sid !== streamId) {
                            droppedBeforeId++
                            if (droppedBeforeId <= 5 || droppedBeforeId % 50 === 0) {
                                LogInfo(
                                    `[chattransport] chunk DROPPED sid=${sid} streamId=${streamId} dropped=${droppedBeforeId} line=${line.slice(0, 80)}`,
                                )
                            }
                            return
                        }
                        eventCount++
                        if (eventCount <= 3 || eventCount % 50 === 0) {
                            LogInfo(
                                `[chattransport] chunk#${eventCount} sid=${sid} OK enqueue line=${line.slice(0, 100)}`,
                            )
                        }
                        controller.enqueue(encoder.encode(line + '\n'))
                    }

                    const onChunk = (sid: string, line: string) => {
                        if (streamId === null) {
                            buffered.push({ kind: 'chunk', sid, line })
                            return
                        }
                        enqueueChunk(sid, line)
                    }
                    const onDone = (sid: string) => {
                        if (streamId === null) {
                            buffered.push({ kind: 'done', sid })
                            return
                        }
                        if (sid !== streamId) return
                        LogInfo(
                            `[chattransport] onDone sid=${sid} streamId=${streamId} totalEvents=${eventCount} dropped=${droppedBeforeId}`,
                        )
                        controller.close()
                    }
                    const onError = (sid: string, err: string) => {
                        if (streamId === null) {
                            buffered.push({ kind: 'error', sid, err })
                            return
                        }
                        if (sid !== streamId) return
                        LogError(
                            `[chattransport] onError sid=${sid} streamId=${streamId} err=${err}`,
                        )
                        controller.error(new Error(err))
                    }

                    const flushBuffered = () => {
                        const items = buffered
                        buffered = []
                        for (const item of items) {
                            if (item.kind === 'chunk') {
                                enqueueChunk(item.sid, item.line)
                            } else if (item.kind === 'done') {
                                if (item.sid !== streamId) continue
                                LogInfo(
                                    `[chattransport] onDone(flushed) sid=${item.sid} streamId=${streamId} totalEvents=${eventCount} dropped=${droppedBeforeId}`,
                                )
                                controller.close()
                            } else {
                                if (item.sid !== streamId) continue
                                LogError(
                                    `[chattransport] onError(flushed) sid=${item.sid} streamId=${streamId} err=${item.err}`,
                                )
                                controller.error(new Error(item.err))
                            }
                        }
                    }

                    cleanup = [
                        EventsOn('chat:stream-chunk', onChunk),
                        EventsOn('chat:stream-done', onDone),
                        EventsOn('chat:stream-error', onError),
                    ]

                    LogInfo(`[chattransport] calling StartStream body=${messageBody.slice(0, 120)}`)
                    StartStream(workspaceId, chatId, messageBody)
                        .then((id) => {
                            streamId = id
                            if (cancelled) {
                                CancelStream(id)
                                return
                            }
                            LogInfo(`[chattransport] streamId set = ${id}`)
                            flushBuffered()
                        })
                        .catch((err: Error) => {
                            LogError(`[chattransport] StartStream rejected ${err}`)
                            controller.error(err)
                        })
                },
                cancel() {
                    cancelled = true
                    cleanup.forEach((fn) => fn())
                    if (streamId) CancelStream(streamId)
                },
            })

            return new Response(stream)
        },
    })
}

export const chatStream: ChatStreamPort = {
    createTransport: createWailsChatTransport,
}
