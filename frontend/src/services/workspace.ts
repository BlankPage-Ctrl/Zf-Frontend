import { List, Get, Create, Update, Delete } from '../../wailsjs/go/workspaces/Service'

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
    createdAt: string
    updatedAt: string
}

export const workspacesApi = {
    list: () => List() as Promise<Workspace[]>,
    get: (id: string) => Get(id) as Promise<Workspace>,
    create: (dto: WorkspaceDto) => Create(dto) as Promise<Workspace>,
    update: (id: string, dto: Partial<WorkspaceDto>) => Update(id, dto) as Promise<Workspace>,
    remove: (id: string) => Delete(id) as Promise<void>,
}
