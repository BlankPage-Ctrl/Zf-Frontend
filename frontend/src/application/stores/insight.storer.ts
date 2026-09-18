import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const FORCE_STORAGE_PREFIX = 'insight:force:'

function loadForce(workspaceId: string): boolean {
    try {
        return localStorage.getItem(FORCE_STORAGE_PREFIX + workspaceId) === 'true'
    } catch {
        return false
    }
}

export const useInsightStorer = defineStore('insight', () => {
    const workspaceId = ref<string | null>(null)
    const running = ref(false)
    const enabled = ref(true)
    /** True while a sync/incremental pass is in flight — drives the AppTitle dot. */
    const syncing = ref(false)
    const force = ref(false)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const lastSyncAt = ref<string | null>(null)

    const active = computed(() => syncing.value)

    function selectWorkspace(id: string | null): void {
        workspaceId.value = id
        running.value = false
        syncing.value = false
        error.value = null
        force.value = id ? loadForce(id) : false
    }

    function setForce(v: boolean): void {
        force.value = v
        const id = workspaceId.value
        if (!id) return
        try {
            localStorage.setItem(FORCE_STORAGE_PREFIX + id, v ? 'true' : 'false')
        } catch {
            /* workers/private mode — keep in-memory only */
        }
    }

    return {
        workspaceId,
        running,
        enabled,
        syncing,
        active,
        force,
        loading,
        error,
        lastSyncAt,
        selectWorkspace,
        setForce,
    }
})

export type InsightStorer = ReturnType<typeof useInsightStorer>
