import type { UIMessage } from 'ai'

export interface MessageRepository {
    loadHistory(workspaceId: string, chatId: string): Promise<UIMessage[]>
}
