import { ref, type Ref } from 'vue'
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { messagesApi } from '@/services/messages'
import { StartStream, CancelStream } from '../../wailsjs/go/stream/ChatStreamService'
import { EventsOn, EventsOff } from '../../wailsjs/runtime'

function createWailsChatTransport(workspaceId: string, chatId: string) {
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

                    StartStream(workspaceId, chatId, messageBody).then((id) => {
                        streamId = id
                    }).catch((err: Error) => {
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

export function useChatSession(workspaceId: string, chatId: string) {
    const messages = ref<UIMessage[]>([]) as Ref<UIMessage[]>
    const status = ref<'submitted' | 'streaming' | 'ready' | 'error'>('ready')
    const error = ref<Error | undefined>()
    const isLoading = ref(false)

    let chat: Chat<UIMessage> | null = null
    let statusInterval: ReturnType<typeof setInterval> | null = null

    async function loadHistory() {
        try {
            const history = await messagesApi.loadHistory(workspaceId, chatId)
            messages.value = history ?? []
            initChat(history ?? [])
        } catch (e: unknown) {
            error.value = e instanceof Error ? e : new Error('Failed to load messages')
        }
    }

    function initChat(initialMessages: UIMessage[]) {
        const transport = createWailsChatTransport(workspaceId, chatId)

        chat = new Chat({
            id: chatId,
            messages: initialMessages,
            transport,
            onFinish: () => {
                status.value = 'ready'
                isLoading.value = false
            },
            onError: (e: Error) => {
                error.value = e
                status.value = 'error'
                isLoading.value = false
            },
        })

        statusInterval = setInterval(() => {
            if (chat) {
                status.value = chat.status
                messages.value = chat.messages ? [...chat.messages] : []
                isLoading.value = chat.status === 'submitted' || chat.status === 'streaming'
            }
        }, 100)
    }

    async function sendMessage(text: string) {
        if (!chat || !text.trim()) return
        error.value = undefined
        isLoading.value = true
        try {
            await chat.sendMessage({ text })
        } catch (e: unknown) {
            error.value = e instanceof Error ? e : new Error('Failed to send message')
            isLoading.value = false
        }
    }

    async function stop() {
        if (chat) {
            await chat.stop()
            isLoading.value = false
            status.value = 'ready'
        }
    }

    async function regenerate() {
        if (!chat) return
        error.value = undefined
        isLoading.value = true
        try {
            await chat.regenerate()
        } catch (e: unknown) {
            error.value = e instanceof Error ? e : new Error('Failed to regenerate')
            isLoading.value = false
        }
    }

    function cleanup() {
        if (statusInterval) clearInterval(statusInterval)
        chat = null
    }

    return {
        messages,
        status,
        error,
        isLoading,
        loadHistory,
        sendMessage,
        stop,
        regenerate,
        cleanup,
    }
}
