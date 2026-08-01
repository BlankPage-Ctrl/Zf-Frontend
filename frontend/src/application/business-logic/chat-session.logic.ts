import { ref, type Ref } from 'vue'
import { Chat } from '@ai-sdk/vue'
import type { UIMessage } from 'ai'
import type { MessageRepository, ChatStreamPort } from '@/core/repositories'

export type ChatSessionStatus = 'submitted' | 'streaming' | 'ready' | 'error'

export interface ChatSession {
    messages: Ref<UIMessage[]>
    status: Ref<ChatSessionStatus>
    error: Ref<Error | undefined>
    isLoading: Ref<boolean>
    loadHistory(): Promise<void>
    sendMessage(text: string): Promise<void>
    stop(): Promise<void>
    regenerate(): Promise<void>
    cleanup(): void
}

export interface ChatSessionDeps {
    messagesRepo: MessageRepository
    stream: ChatStreamPort
}

export function createChatSession(
    workspaceId: string,
    chatId: string,
    deps: ChatSessionDeps,
): ChatSession {
    const messages = ref<UIMessage[]>([]) as Ref<UIMessage[]>
    const status = ref<ChatSessionStatus>('ready')
    const error = ref<Error | undefined>()
    const isLoading = ref(false)

    let chat: Chat<UIMessage> | null = null
    let statusInterval: ReturnType<typeof setInterval> | null = null

    async function loadHistory(): Promise<void> {
        try {
            const history = await deps.messagesRepo.loadHistory(workspaceId, chatId)
            messages.value = history ?? []
            initChat(history ?? [])
        } catch (e: unknown) {
            error.value = e instanceof Error ? e : new Error('Failed to load messages')
        }
    }

    function initChat(initialMessages: UIMessage[]): void {
        const transport = deps.stream.createTransport(workspaceId, chatId)

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

    async function sendMessage(text: string): Promise<void> {
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

    async function stop(): Promise<void> {
        if (chat) {
            await chat.stop()
            isLoading.value = false
            status.value = 'ready'
        }
    }

    async function regenerate(): Promise<void> {
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

    function cleanup(): void {
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
