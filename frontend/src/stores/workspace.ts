import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { workspacesApi, type Workspace, type WorkspaceDto } from '@/services/workspace'

function toMessage(e: unknown): string {
    return e instanceof Error ? e.message : 'An error occurred'
}

export const useWorkspaceStore = defineStore('workspace', () => {
    const workspaces = ref<Workspace[]>([])
    const selectedWorkspaceId = ref<string | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    const selectedWorkspace = computed(
        () => workspaces.value.find((w) => w.id === selectedWorkspaceId.value) ?? null,
    )

    function clearError() {
        error.value = null
    }

    async function fetchWorkspaces() {
        loading.value = true
        error.value = null
        try {
            workspaces.value = await workspacesApi.list()
        } catch (e: unknown) {
            error.value = toMessage(e) || 'Failed to load workspaces'
        } finally {
            loading.value = false
        }
    }

    async function createWorkspace(dto: WorkspaceDto) {
        error.value = null
        try {
            const ws = await workspacesApi.create(dto)
            workspaces.value.push(ws)
            selectedWorkspaceId.value = ws.id
        } catch (e: unknown) {
            error.value = toMessage(e) || 'Failed to create workspace'
            throw e
        }
    }

    async function updateWorkspace(id: string, dto: Partial<WorkspaceDto>) {
        error.value = null
        try {
            const updated = await workspacesApi.update(id, dto)
            const idx = workspaces.value.findIndex((w) => w.id === id)
            if (idx !== -1) {
                workspaces.value[idx] = { ...workspaces.value[idx], ...updated }
            }
        } catch (e: unknown) {
            error.value = toMessage(e) || 'Failed to update workspace'
            throw e
        }
    }

    async function deleteWorkspace(id: string) {
        error.value = null
        try {
            await workspacesApi.remove(id)
            workspaces.value = workspaces.value.filter((w) => w.id !== id)
            if (selectedWorkspaceId.value === id) {
                selectedWorkspaceId.value = workspaces.value[0]?.id ?? null
            }
        } catch (e: unknown) {
            error.value = toMessage(e) || 'Failed to delete workspace'
            throw e
        }
    }

    function selectWorkspace(id: string) {
        selectedWorkspaceId.value = id
    }

    return {
        workspaces,
        selectedWorkspaceId,
        loading,
        error,
        selectedWorkspace,
        clearError,
        fetchWorkspaces,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        selectWorkspace,
    }
})
