import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { StartStream, CancelStream } from '../../../wailsjs/go/stream/ChatStreamService'
import { EventsOn, EventsOff } from '../../../wailsjs/runtime'
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

                    const onChunk = (sid: string, line: string) => {
                        if (sid !== streamId) return
                        controller.enqueue(encoder.encode(line + '\n'))
                    }
                    const onDone = (sid: string) => {
                        if (sid !== streamId) return
                        controller.close()
                    }
                    const onError = (sid: string, err: string) => {
                        if (sid !== streamId) return
                        controller.error(new Error(err))
                    }

                    cleanup = [
                        EventsOn('chat:stream-chunk', onChunk),
                        EventsOn('chat:stream-done', onDone),
                        EventsOn('chat:stream-error', onError),
                    ]

                    StartStream(workspaceId, chatId, messageBody)
                        .then((id) => {
                            streamId = id
                        })
                        .catch((err: Error) => {
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
