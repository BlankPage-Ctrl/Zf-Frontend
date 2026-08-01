import type { ChatStoreLogic } from '../store-logic/chat.logic'
import type { ChatDto } from '@/core/entities'

export interface ChatActions {
    fetchChats(workspaceId: string): Promise<void>
    createChat(workspaceId: string, dto: ChatDto): Promise<void>
    updateChat(workspaceId: string, chatId: string, dto: Partial<ChatDto>): Promise<void>
    deleteChat(workspaceId: string, chatId: string): Promise<void>
}

export function createChatActions(logic: ChatStoreLogic): ChatActions {
    return {
        fetchChats: logic.fetchChats,
        createChat: logic.createChat,
        updateChat: logic.updateChat,
        deleteChat: logic.deleteChat,
    }
}
