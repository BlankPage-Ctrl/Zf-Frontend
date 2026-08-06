import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { StartStream, CancelStream } from '../../../wailsjs/go/stream/ChatStreamService'
import { EventsOn, EventsOff, LogInfo, LogError } from '../../../wailsjs/runtime'
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
            let cleanup: (() => void)[] = []

            const stream = new ReadableStream<Uint8Array>({
                start(controller) {
                    const encoder = new TextEncoder()
                    let eventCount = 0
                    let droppedBeforeId = 0

                    const onChunk = (sid: string, line: string) => {
                        eventCount++
                        if (sid !== streamId) {
                            droppedBeforeId++
                            if (droppedBeforeId <= 5 || droppedBeforeId % 50 === 0) {
                                LogInfo(
                                    `[chattransport] chunk DROPPED sid=${sid} streamId=${streamId} dropped=${droppedBeforeId} line=${line.slice(0, 80)}`,
                                )
                            }
                            return
                        }
                        if (eventCount <= 3 || eventCount % 50 === 0) {
                            LogInfo(
                                `[chattransport] chunk#${eventCount} sid=${sid} OK enqueue line=${line.slice(0, 100)}`,
                            )
                        }
                        controller.enqueue(encoder.encode(line + '\n'))
                    }
                    const onDone = (sid: string) => {
                        LogInfo(
                            `[chattransport] onDone sid=${sid} streamId=${streamId} totalEvents=${eventCount} dropped=${droppedBeforeId}`,
                        )
                        if (sid !== streamId) return
                        controller.close()
                    }
                    const onError = (sid: string, err: string) => {
                        LogError(`[chattransport] onError sid=${sid} streamId=${streamId} err=${err}`)
                        if (sid !== streamId) return
                        controller.error(new Error(err))
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
                            LogInfo(`[chattransport] streamId set = ${id}`)
                        })
                        .catch((err: Error) => {
                            LogError(`[chattransport] StartStream rejected ${err}`)
                            controller.error(err)
                        })
                },
                cancel() {
                    cleanup.forEach((fn) => fn())
                    EventsOff('chat:stream-chunk')
                    EventsOff('chat:stream-done')
                    EventsOff('chat:stream-error')
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
