import { Chat } from '@ai-sdk/vue'
import type { UIMessage } from 'ai'
import type { MessageRepository, ChatStreamPort } from '@/core/repositories'
import type { ChatSessionStatus } from '@/core/entities'

export interface ChatSessionStatePatch {
    messages?: UIMessage[]
    status?: ChatSessionStatus
    error?: Error | undefined
    isLoading?: boolean
}

export interface ChatSessionDeps {
    messagesRepo: MessageRepository
    stream: ChatStreamPort
    onState: (chatId: string, patch: ChatSessionStatePatch) => void
}

export interface ChatSessionEngine {
    loadHistory(workspaceId: string, chatId: string): Promise<void>
    sendMessage(workspaceId: string, chatId: string, text: string): Promise<void>
    stop(chatId: string): Promise<void>
    regenerate(chatId: string): Promise<void>
    dispose(chatId: string): void
    clear(): void
}

export function createChatSessionEngine(deps: ChatSessionDeps): ChatSessionEngine {
    const engines = new Map<string, Chat<UIMessage>>()
    const intervals = new Map<string, ReturnType<typeof setInterval>>()

    function ensureEngine(
        workspaceId: string,
        chatId: string,
        initialMessages?: UIMessage[],
    ): Chat<UIMessage> {
        let chat = engines.get(chatId)
        if (!chat) {
            const transport = deps.stream.createTransport(workspaceId, chatId)
            chat = new Chat({
                id: chatId,
                messages: initialMessages ?? [],
                transport,
                onFinish: () => {
                    deps.onState(chatId, { status: 'ready', isLoading: false })
                    stopPolling(chatId)
                },
                onError: (e: Error) => {
                    deps.onState(chatId, { error: e, status: 'error', isLoading: false })
                    stopPolling(chatId)
                },
            })
            engines.set(chatId, chat)
        }
        return chat
    }

    function syncChat(chatId: string): void {
        const chat = engines.get(chatId)
        if (!chat) return
        const patch: ChatSessionStatePatch = { status: chat.status }
        if (chat.messages) {
            patch.messages = [...chat.messages]
        }
        patch.isLoading = chat.status === 'submitted' || chat.status === 'streaming'
        deps.onState(chatId, patch)
    }

    function startPolling(chatId: string): void {
        if (intervals.has(chatId)) return
        syncChat(chatId)
        intervals.set(
            chatId,
            setInterval(() => {
                const chat = engines.get(chatId)
                if (!chat) {
                    stopPolling(chatId)
                    return
                }
                syncChat(chatId)
                if (chat.status !== 'submitted' && chat.status !== 'streaming') {
                    stopPolling(chatId)
                }
            }, 100),
        )
    }

    function stopPolling(chatId: string): void {
        const interval = intervals.get(chatId)
        if (interval) {
            clearInterval(interval)
            intervals.delete(chatId)
        }
    }

    async function loadHistory(workspaceId: string, chatId: string): Promise<void> {
        if (engines.has(chatId)) return
        try {
            const history = await deps.messagesRepo.loadHistory(workspaceId, chatId)
            ensureEngine(workspaceId, chatId, history ?? [])
            deps.onState(chatId, { messages: history ?? [], status: 'ready', isLoading: false })
        } catch (e: unknown) {
            deps.onState(chatId, {
                error: e instanceof Error ? e : new Error('Failed to load messages'),
            })
        }
    }

    async function sendMessage(workspaceId: string, chatId: string, text: string): Promise<void> {
        if (!text.trim()) return
        const chat = ensureEngine(workspaceId, chatId)
        deps.onState(chatId, { error: undefined, isLoading: true })
        startPolling(chatId)
        try {
            await chat.sendMessage({ text })
        } catch (e: unknown) {
            deps.onState(chatId, {
                error: e instanceof Error ? e : new Error('Failed to send message'),
                isLoading: false,
            })
            stopPolling(chatId)
        }
    }

    async function stop(chatId: string): Promise<void> {
        const chat = engines.get(chatId)
        if (!chat) return
        await chat.stop()
        stopPolling(chatId)
        deps.onState(chatId, { status: 'ready', isLoading: false })
    }

    async function regenerate(chatId: string): Promise<void> {
        const chat = engines.get(chatId)
        if (!chat) return
        deps.onState(chatId, { error: undefined, isLoading: true })
        startPolling(chatId)
        try {
            await chat.regenerate()
        } catch (e: unknown) {
            deps.onState(chatId, {
                error: e instanceof Error ? e : new Error('Failed to regenerate'),
                isLoading: false,
            })
            stopPolling(chatId)
        }
    }

    function dispose(chatId: string): void {
        stopPolling(chatId)
        engines.delete(chatId)
    }

    function clear(): void {
        intervals.forEach((interval) => clearInterval(interval))
        intervals.clear()
        engines.clear()
    }

    return {
        loadHistory,
        sendMessage,
        stop,
        regenerate,
        dispose,
        clear,
    }
}
