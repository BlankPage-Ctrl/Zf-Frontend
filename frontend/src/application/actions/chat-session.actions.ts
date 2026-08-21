import type { ChatSessionStoreLogic } from '../store-logic/chat-session.logic'
import type { ChatSessionEngine } from '../business-logic/chat-session.logic'

export interface ChatSessionActions {
    loadHistory(workspaceId: string, chatId: string): Promise<void>
    sendMessage(workspaceId: string, chatId: string, text: string): Promise<void>
    stop(chatId: string): Promise<void>
    regenerate(chatId: string): Promise<void>
    dispose(chatId: string): void
    clear(): void
}

export function createChatSessionActions(
    storeLogic: ChatSessionStoreLogic,
    businessLogic: ChatSessionEngine,
): ChatSessionActions {
    async function loadHistory(workspaceId: string, chatId: string): Promise<void> {
        await businessLogic.loadHistory(workspaceId, chatId)
    }

    async function sendMessage(workspaceId: string, chatId: string, text: string): Promise<void> {
        await businessLogic.sendMessage(workspaceId, chatId, text)
    }

    async function stop(chatId: string): Promise<void> {
        await businessLogic.stop(chatId)
    }

    async function regenerate(chatId: string): Promise<void> {
        await businessLogic.regenerate(chatId)
    }

    function dispose(chatId: string): void {
        businessLogic.dispose(chatId)
        storeLogic.remove(chatId)
    }

    function clear(): void {
        businessLogic.clear()
        storeLogic.clear()
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
