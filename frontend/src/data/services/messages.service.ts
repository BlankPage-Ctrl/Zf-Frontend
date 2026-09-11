import { LoadHistory } from '../../../wailsjs/go/messages/Service'
import type { FeedEvent } from '@/core/entities'
import type { MessageRepository } from '@/core/repositories'

export const messagesRepository: MessageRepository = {
    loadHistory: (workspaceId: string, chatId: string) =>
        LoadHistory(workspaceId, chatId) as unknown as Promise<FeedEvent[]>,
}
