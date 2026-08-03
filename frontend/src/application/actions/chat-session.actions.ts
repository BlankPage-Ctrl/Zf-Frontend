import { createChatSession, type ChatSession, type ChatSessionDeps } from '../business-logic'

export interface ChatSessionActions {
    create(workspaceId: string, chatId: string): ChatSession
}

export function createChatSessionActions(deps: ChatSessionDeps): ChatSessionActions {
    return {
        create: (workspaceId: string, chatId: string) =>
            createChatSession(workspaceId, chatId, deps),
    }
}
