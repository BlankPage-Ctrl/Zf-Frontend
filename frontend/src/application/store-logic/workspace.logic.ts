import type { WorkspaceRepository } from '@/core/repositories'
import type { WorkspaceDto } from '@/core/entities'
import { toMessage } from '@/shared/utils/error.utils'
import type { WorkspaceStorer } from '../stores/workspace.storer'

export interface WorkspaceStoreLogic {
    fetchWorkspaces(): Promise<void>
    createWorkspace(dto: WorkspaceDto): Promise<void>
    updateWorkspace(id: string, dto: Partial<WorkspaceDto>): Promise<void>
    deleteWorkspace(id: string): Promise<void>
    selectWorkspace(id: string | null): void
}

export function createWorkspaceLogic(
    getStorer: () => WorkspaceStorer,
    repo: WorkspaceRepository,
): WorkspaceStoreLogic {
    async function fetchWorkspaces(): Promise<void> {
        const storer = getStorer()
        storer.setLoading(true)
        storer.clearError()
        try {
            storer.setWorkspaces(await repo.list())
        } catch (e: unknown) {
            storer.setError(toMessage(e) || 'Failed to load workspaces')
        } finally {
            storer.setLoading(false)
        }
    }

    async function createWorkspace(dto: WorkspaceDto): Promise<void> {
        const storer = getStorer()
        storer.clearError()
        try {
            const ws = await repo.create(dto)
            storer.upsertWorkspace(ws)
            storer.setSelectedId(ws.id)
        } catch (e: unknown) {
            storer.setError(toMessage(e) || 'Failed to create workspace')
            throw e
        }
    }

    async function updateWorkspace(id: string, dto: Partial<WorkspaceDto>): Promise<void> {
        const storer = getStorer()
        storer.clearError()
        try {
            const updated = await repo.update(id, dto)
            storer.upsertWorkspace(updated)
        } catch (e: unknown) {
            storer.setError(toMessage(e) || 'Failed to update workspace')
            throw e
        }
    }

    async function deleteWorkspace(id: string): Promise<void> {
        const storer = getStorer()
        storer.clearError()
        try {
            await repo.remove(id)
            storer.removeWorkspace(id)
        } catch (e: unknown) {
            storer.setError(toMessage(e) || 'Failed to delete workspace')
            throw e
        }
    }

    function selectWorkspace(id: string | null): void {
        getStorer().setSelectedId(id)
    }

    return {
        fetchWorkspaces,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        selectWorkspace,
    }
}
