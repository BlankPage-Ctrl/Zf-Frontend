import { LoadHistory } from '../../wailsjs/go/messages/Service'
import type { UIMessage } from 'ai'

export const messagesApi = {
    loadHistory: (workspaceId: string, chatId: string) =>
        LoadHistory(workspaceId, chatId) as Promise<UIMessage[]>,
}
