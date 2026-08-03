import { LoadHistory } from '../../../wailsjs/go/messages/Service'
import type { UIMessage } from 'ai'
import type { MessageRepository } from '@/core/repositories'

export const messagesRepository: MessageRepository = {
    loadHistory: (workspaceId: string, chatId: string) =>
        LoadHistory(workspaceId, chatId) as Promise<UIMessage[]>,
}
