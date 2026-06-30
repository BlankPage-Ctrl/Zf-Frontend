import { request } from './client.js'

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
    list: (workspaceId: string) => request<Chat[]>(`/workspaces/${workspaceId}/chats`),
    create: (workspaceId: string, dto: ChatDto) =>
        request<Chat>(`/workspaces/${workspaceId}/chats`, {
            method: 'POST',
            body: JSON.stringify(dto),
        }),
    update: (workspaceId: string, chatId: string, dto: Partial<ChatDto>) =>
        request<Chat>(`/workspaces/${workspaceId}/chats/${chatId}`, {
            method: 'PATCH',
            body: JSON.stringify(dto),
        }),
    remove: (workspaceId: string, chatId: string) =>
        request<void>(`/workspaces/${workspaceId}/chats/${chatId}`, { method: 'DELETE' }),
}
