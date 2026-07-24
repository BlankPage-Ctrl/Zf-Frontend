<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Folder, Plus, Trash, NavArrowDown } from '@iconoir/vue'
import DropdownRoot from '@/components/dropdown/DropdownRoot.vue'
import type { DropdownItemConfig } from '@/components/dropdown/types'
import DialogGrid from '@/components/dialog/GridDialog.vue'
import type { DialogGridSchema, DynamicGridDataOutput } from '@/components/dialog/types'
import { useWorkspaceStore } from '@/stores/workspace'
import type { Workspace, WorkspaceDto } from '@/services/workspace'

const router = useRouter()
const wsStore = useWorkspaceStore()

const showCreate = ref(false)
const createLoading = ref(false)

const showDelete = ref(false)
const deletingWs = ref<Workspace | null>(null)

const selectedWsName = computed(() => {
    if (!wsStore.selectedWorkspace) return 'Select workspace'
    return wsStore.selectedWorkspace.name
})

const wsFormSchema: DialogGridSchema = {
    ws: {
        columns: {
            name: {
                type: 'text-short',
                label: 'Name',
                placeholder: 'My workspace',
                metadata: { require: true },
            },
            description: {
                type: 'text-short',
                label: 'Description',
                placeholder: 'Optional description',
            },
            projectPath: {
                type: 'text-short',
                label: 'Project path',
                placeholder: '/path/to/project',
                metadata: { require: true },
            },
        },
    },
}

const wsDropdownItems = computed<DropdownItemConfig[]>(() => {
    const items: DropdownItemConfig[] = wsStore.workspaces.map((ws) => ({
        id: ws.id,
        label: ws.name,
        icon: Folder,
        value: ws.id,
        selected: ws.id === wsStore.selectedWorkspaceId,
        rightIcon: Trash,
        rightAction: { type: 'command', command: 'delete-workspace', args: { id: ws.id } },
    }))
    return items
})

function openCreate() {
    showCreate.value = true
}

function cancelCreate() {
    showCreate.value = false
}

async function submitCreate(data: DynamicGridDataOutput) {
    const d = data.ws!
    const payload: WorkspaceDto = {
        name: String(d.name ?? ''),
        description: String(d.description ?? ''),
        projectPath: String(d.projectPath ?? ''),
    }
    createLoading.value = true
    try {
        await wsStore.createWorkspace(payload)
        workspaceSelect(wsStore.selectedWorkspaceId!)
    } catch {
        /* handled by store */
    } finally {
        createLoading.value = false
    }
}

function workspaceSelect(id: string) {
    wsStore.selectWorkspace(id)
    router.push({ name: 'workspace', params: { id } })
}

function handleSelect(value: string) {
    workspaceSelect(value)
}

function handleAction(action: { type: 'command'; command: string; args?: Record<string, unknown> }) {
    if (action.command === 'add-workspace') {
        openCreate()
    } else if (action.command === 'delete-workspace') {
        const id = action.args?.id as string
        const ws = wsStore.workspaces.find((w) => w.id === id)
        if (ws) {
            deletingWs.value = ws
            showDelete.value = true
        }
    }
}

function cancelDelete() {
    showDelete.value = false
    deletingWs.value = null
}

async function executeDelete() {
    if (!deletingWs.value) return
    const id = deletingWs.value.id
    await wsStore.deleteWorkspace(id)
    showDelete.value = false
    deletingWs.value = null

    if (wsStore.selectedWorkspaceId !== id) return

    const first = wsStore.workspaces[0]
    if (first) {
        workspaceSelect(first.id)
    } else {
        wsStore.selectWorkspace('')
        router.push({ name: 'home' })
    }
}

onMounted(() => {
    wsStore.fetchWorkspaces()
})
</script>

<template>
    <div class="app-title">
        <span class="app-title-text">Zf</span>

        <DropdownRoot
            :items="wsDropdownItems"
            mode="menu"
            placement="bottom"
            :offset="6"
            :dense="true"
            @select="handleSelect"
            @action="handleAction"
        >
            <template #trigger="{ isOpen, toggle }">
                <div
                    class="ws-trigger"
                    :class="{ 'ws-trigger--open': isOpen }"
                    @click="toggle"
                    role="button"
                    tabindex="0"
                    aria-haspopup="true"
                    :aria-expanded="isOpen"
                >
                    <span class="ws-trigger__label">{{ selectedWsName }}</span>
                    <NavArrowDown
                        width="12"
                        height="12"
                        class="ws-trigger__chevron"
                        :class="{ 'ws-trigger__chevron--open': isOpen }"
                    />
                </div>
            </template>
        </DropdownRoot>

        <button
            class="ws-add-btn"
            @click="openCreate"
            title="New workspace"
            aria-label="New workspace"
        >
            <Plus width="14" height="14" />
        </button>

        <DialogGrid
            v-model="showCreate"
            :schema="wsFormSchema"
            title="New workspace"
            confirm-label="Create"
            :loading="createLoading"
            @submit="submitCreate"
            @cancel="cancelCreate"
        />

        <DialogGrid
            v-model="showDelete"
            title="Delete workspace"
            confirm-label="Delete"
            confirm-variant="danger"
            @submit="executeDelete"
            @cancel="cancelDelete"
        >
            <span class="confirm-message">Delete "{{ deletingWs?.name }}"?</span>
        </DialogGrid>
    </div>
</template>

<style scoped>
.app-title {
    height: 30px;
    display: flex;
    align-items: center;
    padding-left: 12px;
    gap: 6px;
    background: rgb(var(--bg-secondary));
    border-bottom: 1px solid rgba(var(--border-color), 0.12);
    flex-shrink: 0;
    -webkit-app-region: drag;
}

.app-title-text {
    font-family: var(--font-serif);
    font-size: 13px;
    font-weight: 700;
    color: rgb(var(--text-primary));
    opacity: 0.55;
    letter-spacing: -0.01em;
    user-select: none;
    -webkit-app-region: no-drag;
}

.ws-trigger {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    -webkit-app-region: no-drag;
    transition: background-color 80ms ease;
    width: 140px;
    flex-shrink: 0;
}

.ws-trigger:hover,
.ws-trigger--open {
    background: rgba(var(--border-color), 0.15);
}

.ws-trigger__label {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    font-weight: 500;
    color: rgb(var(--text-primary));
    opacity: 0.75;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ws-trigger__chevron {
    color: rgba(var(--text-primary), 0.4);
    transition: transform 120ms ease;
}

.ws-trigger__chevron--open {
    transform: rotate(180deg);
}

.ws-add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: rgba(var(--text-primary), 0.5);
    cursor: pointer;
    -webkit-app-region: no-drag;
    transition:
        background-color 80ms ease,
        color 80ms ease;
}

.ws-add-btn:hover {
    background: rgba(var(--border-color), 0.15);
    color: rgba(var(--text-primary), 0.8);
}
</style>
