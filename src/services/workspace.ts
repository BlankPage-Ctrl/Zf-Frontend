import { request } from './client.js'
import type { Chat } from './chat.js'

export interface WorkspaceDto {
    name: string
    description?: string
    projectPath: string
}

export interface Workspace {
    id: string
    name: string
    description?: string
    projectPath: string
    chats?: Chat[]
    createdAt: string
    updatedAt: string
}

export const workspacesApi = {
    list: () => request<Workspace[]>('/workspaces'),
    get: (id: string) => request<Workspace>(`/workspaces/${id}`),
    create: (dto: WorkspaceDto) =>
        request<Workspace>('/workspaces', { method: 'POST', body: JSON.stringify(dto) }),
    update: (id: string, dto: Partial<WorkspaceDto>) =>
        request<Workspace>(`/workspaces/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
    remove: (id: string) => request<void>(`/workspaces/${id}`, { method: 'DELETE' }),
}
