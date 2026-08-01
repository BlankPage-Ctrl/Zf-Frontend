import type { WorkspaceStoreLogic } from '../store-logic/workspace.logic'
import type { WorkspaceDto } from '@/core/entities'

export interface WorkspaceActions {
    fetchWorkspaces(): Promise<void>
    createWorkspace(dto: WorkspaceDto): Promise<void>
    updateWorkspace(id: string, dto: Partial<WorkspaceDto>): Promise<void>
    deleteWorkspace(id: string): Promise<void>
    selectWorkspace(id: string | null): void
}

export function createWorkspaceActions(logic: WorkspaceStoreLogic): WorkspaceActions {
    return {
        fetchWorkspaces: logic.fetchWorkspaces,
        createWorkspace: logic.createWorkspace,
        updateWorkspace: logic.updateWorkspace,
        deleteWorkspace: logic.deleteWorkspace,
        selectWorkspace: logic.selectWorkspace,
    }
}
