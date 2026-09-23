import type { FeedEvent, RevertResult } from '../entities'

export interface MessageRepository {
    loadHistory(workspaceId: string, chatId: string): Promise<FeedEvent[]>
    revert(workspaceId: string, chatId: string, messageId: string): Promise<RevertResult>
}
