import type { FeedEvent } from '../entities'

export interface MessageRepository {
    loadHistory(workspaceId: string, chatId: string): Promise<FeedEvent[]>
}
