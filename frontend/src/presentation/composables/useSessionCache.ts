import { useChatSession } from '@/presentation/composables/useChatSession'
import type { ChatSession } from '@/application/business-logic'

export function useSessionCache(getWorkspaceId: () => string) {
    const sessions = new Map<string, ChatSession>()

    function getSession(chatId: string): ChatSession {
        let session = sessions.get(chatId)
        if (!session) {
            session = useChatSession(getWorkspaceId(), chatId)
            session.loadHistory()
            sessions.set(chatId, session)
        }
        return session
    }

    function removeSession(chatId: string): void {
        sessions.get(chatId)?.cleanup()
        sessions.delete(chatId)
    }

    function clearSessions(): void {
        sessions.forEach((s) => s.cleanup())
        sessions.clear()
    }

    return { getSession, removeSession, clearSessions }
}
