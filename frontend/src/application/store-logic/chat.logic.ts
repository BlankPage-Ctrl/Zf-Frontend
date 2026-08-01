import type { ChatRepository } from '@/core/repositories'
import type { ChatDto } from '@/core/entities'
import { toMessage } from '@/shared/utils/error.utils'
import type { ChatStorer } from '../stores/chat.storer'

export interface ChatStoreLogic {
    fetchChats(workspaceId: string): Promise<void>
    createChat(workspaceId: string, dto: ChatDto): Promise<void>
    updateChat(workspaceId: string, chatId: string, dto: Partial<ChatDto>): Promise<void>
    deleteChat(workspaceId: string, chatId: string): Promise<void>
}

export function createChatLogic(getStorer: () => ChatStorer, repo: ChatRepository): ChatStoreLogic {
    async function fetchChats(workspaceId: string): Promise<void> {
        const storer = getStorer()
        storer.setLoading(true)
        storer.clearError()
        try {
            storer.setChats(await repo.list(workspaceId))
        } catch (e: unknown) {
            storer.setError(toMessage(e) || 'Failed to load chats')
        } finally {
            storer.setLoading(false)
        }
    }

    async function createChat(workspaceId: string, dto: ChatDto): Promise<void> {
        const storer = getStorer()
        storer.clearError()
        try {
            const chat = await repo.create(workspaceId, dto)
            storer.upsertChat(chat)
        } catch (e: unknown) {
            storer.setError(toMessage(e) || 'Failed to create chat')
            throw e
        }
    }

    async function updateChat(
        workspaceId: string,
        chatId: string,
        dto: Partial<ChatDto>,
    ): Promise<void> {
        const storer = getStorer()
        storer.clearError()
        try {
            const updated = await repo.update(workspaceId, chatId, dto)
            storer.upsertChat(updated)
        } catch (e: unknown) {
            storer.setError(toMessage(e) || 'Failed to update chat')
            throw e
        }
    }

    async function deleteChat(workspaceId: string, chatId: string): Promise<void> {
        const storer = getStorer()
        storer.clearError()
        try {
            await repo.remove(workspaceId, chatId)
            storer.removeChat(chatId)
        } catch (e: unknown) {
            storer.setError(toMessage(e) || 'Failed to delete chat')
            throw e
        }
    }

    return {
        fetchChats,
        createChat,
        updateChat,
        deleteChat,
    }
}
