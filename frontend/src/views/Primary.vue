<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue'
import { useRouter } from 'vue-router'
import { Album, EditPencil, Plus, Settings, Trash, ChatBubble } from '@iconoir/vue'
import { pButton } from '@/components/button'
import { Header } from '@/components/header'
import type { HeaderSchema } from '@/components/header'
import { ContainerGrid, type ContainerSchema } from '@/components/container'
import DialogGrid from '@/components/dialog/GridDialog.vue'
import type { DialogGridSchema, DynamicGridDataOutput } from '@/components/dialog/types'
import { AppList } from '@/components/list'
import type { ListSchema } from '@/components/list'
import { useWorkspaceStore } from '@/stores/workspace'
import { useChatStore } from '@/stores/chat'
import type { Workspace, WorkspaceDto } from '@/services/workspace'
import type { Chat } from '@/services/chat'

const EditIcon = () => h(EditPencil, { width: 14, height: 14 })
const TrashIcon = () => h(Trash, { width: 14, height: 14 })
const wsStore = useWorkspaceStore()
const chatStore = useChatStore()
const router = useRouter()

function goToSettings() {
    router.push({ name: 'settings' })
}

// --- Header schemas ---
const wsHeaderSchema = computed<HeaderSchema>(() => ({
    title: 'Workspaces',
    height: 'sm',
    padding: 'md',
    actions: [
        { icon: Settings, ariaLabel: 'Settings', onClick: goToSettings },
        { icon: Plus, ariaLabel: 'New workspace', onClick: openWsCreate },
    ],
}))

const chatHeaderSchema = computed<HeaderSchema | null>(() => {
    if (!wsStore.selectedWorkspace) return null
    return {
        title: wsStore.selectedWorkspace.name,
        subtitle: `${chatStore.chats.length} chat${chatStore.chats.length !== 1 ? 's' : ''}`,
        height: 'md',
        padding: 'md',
        border: true,
        actions: [{ icon: ChatBubble, ariaLabel: 'Open', label: 'Open', onClick: openWorkspace }],
    }
})

const containerPrimary = ref<ContainerSchema[]>([
    {
        id: 'row-1',
        height: '1fr',
        columns: [
            {
                id: 'cell-1-1',
                width: 200,
                resizable: true,
                minWidth: 150,
                maxWidth: 400,
                cell: {
                    padding: 0,
                    background: 'rgb(var(--bg-secondary))',
                    borderColor: 'rgba(var(--border-color), 0.25)',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    radius: 0,
                },
            },
            {
                id: 'cell-1-2',
                width: '1fr',
                cell: {
                    padding: 0,
                    background: 'rgb(var(--bg-primary))',
                    borderColor: 'rgba(var(--border-color), 0.15)',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    radius: 0,
                },
            },
        ],
    },
])

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

// --- List schemas ---
const wsListSchema = computed<ListSchema<Workspace>>(() => ({
    variant: 'sidebar',
    size: 'sm',
    activeKey: 'id',
    activeId: wsStore.selectedWorkspaceId,
    fields: [
        { key: 'name', class: 'title' },
        { key: 'description', class: 'subtitle', visible: (ws) => !!ws.description },
        { key: 'projectPath', class: 'meta' },
    ],
    actions: [
        { icon: EditIcon, ariaLabel: 'Edit', variant: 'ghost', size: 'xs', onClick: openWsEdit },
        {
            icon: TrashIcon,
            ariaLabel: 'Delete',
            variant: 'danger',
            size: 'xs',
            onClick: confirmDeleteWs,
        },
    ],
    emptyMessage: 'No workspaces yet',
    emptyAction: { label: 'Create your first workspace', onClick: openWsCreate },
    onSelect: (ws) => wsStore.selectWorkspace(ws.id),
}))

const chatListSchema = computed<ListSchema<Chat>>(() => ({
    variant: 'content',
    size: 'md',
    fields: [
        { key: 'title', class: 'title' },
        { key: 'createdAt', class: 'date', format: fmtDate },
    ],
    emptyMessage: 'No chats yet',
}))

// --- Workspace form ---
const showWsDialog = ref(false)
const editingWs = ref<Workspace | null>(null)
const wsFormLoading = ref(false)

const wsInitialData = computed<DynamicGridDataOutput | undefined>(() => {
    if (!editingWs.value) return undefined
    const w = editingWs.value
    return {
        ws: {
            name: w.name,
            description: w.description ?? '',
            projectPath: w.projectPath,
        },
    }
})

function openWsCreate() {
    editingWs.value = null
    showWsDialog.value = true
}

function openWsEdit(ws: Workspace) {
    editingWs.value = ws
    showWsDialog.value = true
}

function cancelWsForm() {
    showWsDialog.value = false
    editingWs.value = null
}

async function submitWsForm(data: DynamicGridDataOutput) {
    const ws = data.ws!
    const payload: WorkspaceDto = {
        name: String(ws.name ?? ''),
        description: String(ws.description ?? ''),
        projectPath: String(ws.projectPath ?? ''),
    }
    wsFormLoading.value = true
    try {
        if (editingWs.value) {
            await wsStore.updateWorkspace(editingWs.value.id, payload)
        } else {
            await wsStore.createWorkspace(payload)
        }
        showWsDialog.value = false
        editingWs.value = null
    } catch {
        /* error handled by store */
    } finally {
        wsFormLoading.value = false
    }
}

// --- Workspace delete ---
const showWsDeleteDialog = ref(false)
const deletingWs = ref<Workspace | null>(null)

function confirmDeleteWs(ws: Workspace) {
    deletingWs.value = ws
    showWsDeleteDialog.value = true
}

async function executeDeleteWs() {
    if (!deletingWs.value) return
    await wsStore.deleteWorkspace(deletingWs.value.id)
    showWsDeleteDialog.value = false
    deletingWs.value = null
}

function cancelWsDelete() {
    showWsDeleteDialog.value = false
    deletingWs.value = null
}

function openWorkspace() {
    if (wsStore.selectedWorkspaceId) {
        router.push({ name: 'workspace', params: { id: wsStore.selectedWorkspaceId } })
    }
}

// --- Date formatting ---
function fmtDate(iso: unknown): string {
    return new Date(String(iso)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

onMounted(() => {
    wsStore.fetchWorkspaces()
})

watch(
    () => wsStore.selectedWorkspaceId,
    (id) => {
        if (id) {
            chatStore.fetchChats(id)
        } else {
            chatStore.chats = []
        }
    },
)
</script>

<template>
    <div style="height: 100%">
        <ContainerGrid :schema="containerPrimary" :animate="true" :animation-ms="200">
            <!-- WORKSPACE SIDEBAR -->
            <template #cell-1-1>
                <div class="ws-sidebar">
                    <Header :schema="wsHeaderSchema" />

                    <!-- Loading -->
                    <div v-if="wsStore.loading && !wsStore.workspaces.length" class="ws-empty">
                        <span class="text-muted">Loading...</span>
                    </div>

                    <!-- Error -->
                    <div v-else-if="wsStore.error && !wsStore.workspaces.length" class="ws-empty">
                        <span class="text-muted">{{ wsStore.error }}</span>
                        <pButton
                            :schema="{ preset: 'ghost', size: 'sm', label: 'Retry' }"
                            @click="wsStore.fetchWorkspaces()"
                        />
                    </div>

                    <!-- Workspace list -->
                    <AppList v-else :schema="wsListSchema" :items="wsStore.workspaces" />
                </div>
            </template>

            <!-- CHAT CONTENT -->
            <template #cell-1-2>
                <div class="chat-content">
                    <!-- No workspace selected: welcome -->
                    <div v-if="!wsStore.selectedWorkspace" class="welcome-state">
                        <div class="welcome-icon">
                            <Album width="48" height="48" style="opacity: 0.3" />
                        </div>
                        <h2 class="welcome-title">Welcome</h2>
                        <p class="welcome-desc">
                            Select a workspace from the sidebar to view and manage its chats, or
                            create a new workspace to get started.
                        </p>
                    </div>

                    <!-- Workspace selected -->
                    <template v-else>
                        <Header v-if="chatHeaderSchema" :schema="chatHeaderSchema" />

                        <!-- Chat list -->
                        <AppList :schema="chatListSchema" :items="chatStore.chats" />
                    </template>
                </div>
            </template>
        </ContainerGrid>

        <!-- Workspace Form Dialog -->
        <DialogGrid
            v-model="showWsDialog"
            :schema="wsFormSchema"
            :title="editingWs ? 'Edit workspace' : 'New workspace'"
            :confirm-label="editingWs ? 'Save' : 'Create'"
            :initial-data="wsInitialData"
            :loading="wsFormLoading"
            @submit="submitWsForm"
            @cancel="cancelWsForm"
        />

        <!-- Workspace Delete Dialog -->
        <DialogGrid
            v-model="showWsDeleteDialog"
            title="Delete workspace"
            confirm-label="Delete"
            confirm-variant="danger"
            @submit="executeDeleteWs"
            @cancel="cancelWsDelete"
        >
            <span class="confirm-message">Delete "{{ deletingWs?.name }}"?</span>
        </DialogGrid>
    </div>
</template>

<style scoped>
/* --- Sidebar --- */
.ws-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

/* --- Chat content --- */
.chat-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

/* --- Empty / Welcome --- */
.ws-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 24px 12px;
}

.welcome-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 32px;
    text-align: center;
}

.welcome-icon {
    margin-bottom: 16px;
    color: rgb(var(--text-primary));
}

.welcome-title {
    font-family: var(--font-serif);
    font-size: 18px;
    font-weight: 600;
    color: rgb(var(--text-primary));
    margin: 0 0 6px;
}

.welcome-desc {
    font-size: 13px;
    color: rgb(var(--text-primary));
    opacity: 0.5;
    max-width: 300px;
    line-height: 1.5;
    margin: 0;
}
</style>
