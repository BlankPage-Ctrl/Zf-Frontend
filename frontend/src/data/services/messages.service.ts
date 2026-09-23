import { LoadHistory, RevertMessages } from '../../../wailsjs/go/messages/Service'
import type { FeedEvent, RevertResult } from '@/core/entities'
import type { MessageRepository } from '@/core/repositories'

export const messagesRepository: MessageRepository = {
    loadHistory: (workspaceId: string, chatId: string) =>
        LoadHistory(workspaceId, chatId) as unknown as Promise<FeedEvent[]>,
    revert: (workspaceId: string, chatId: string, messageId: string) =>
        RevertMessages(workspaceId, chatId, messageId) as unknown as Promise<RevertResult>,
}
