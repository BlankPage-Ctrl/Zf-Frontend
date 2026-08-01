import { chatSessionActions } from '@/application/actions'
import type { ChatSession } from '@/application/business-logic'

export function useChatSession(workspaceId: string, chatId: string): ChatSession {
    return chatSessionActions.create(workspaceId, chatId)
}
