import { List, Get, Create, Update, Delete } from '../../wailsjs/go/chats/Service'

export interface ChatDto {
    title: string
    modelId?: string
    providerId?: string
    systemPrompt?: string
}

export interface Chat {
    id: string
    title: string
    providerId?: string
    modelId?: string
    systemPrompt?: string
    workspaceId: string
    createdAt: string
    updatedAt: string
}

export const chatsApi = {
    list: (workspaceId: string) => List(workspaceId) as Promise<Chat[]>,
    get: (workspaceId: string, chatId: string) => Get(workspaceId, chatId) as Promise<Chat>,
    create: (workspaceId: string, dto: ChatDto) => Create(workspaceId, dto) as Promise<Chat>,
    update: (workspaceId: string, chatId: string, dto: Partial<ChatDto>) =>
        Update(workspaceId, chatId, dto) as Promise<Chat>,
    remove: (workspaceId: string, chatId: string) => Delete(workspaceId, chatId) as Promise<void>,
}
