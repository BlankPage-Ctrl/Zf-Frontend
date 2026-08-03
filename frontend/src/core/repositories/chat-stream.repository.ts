import type { DefaultChatTransport, UIMessage } from 'ai'

export interface ChatStreamPort {
    createTransport(workspaceId: string, chatId: string): DefaultChatTransport<UIMessage>
}
