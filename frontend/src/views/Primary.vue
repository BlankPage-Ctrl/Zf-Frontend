<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue'
import { useRouter } from 'vue-router'
import { Album, EditPencil, Plus, Settings, Trash, ChatBubble } from '@iconoir/vue'
import { pButton } from '@/components/button'
import { Header } from '@/components/header'
import type { HeaderSchema } from '@/components/header'
import { ContainerGrid, type ContainerSchema } from '@/components/container'
import type { DialogGridSchema } from '@/components/dialog/types'
import { useDialog } from '@/composables/useDialog'
import { AppList } from '@/components/list'
import type { ListSchema } from '@/components/list'
import { useWorkspaceStore } from '@/stores/workspace'
import { useChatStore } from '@/stores/chat'
import type { Workspace } from '@/services/workspace'
import type { Chat } from '@/services/chat'

const EditIcon = () => h(EditPencil, { width: 14, height: 14 })
const TrashIcon = () => h(Trash, { width: 14, height: 14 })
const wsStore = useWorkspaceStore()
const chatStore = useChatStore()
const router = useRouter()
const dialog = useDialog()

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
function openWsCreate() {
    dialog.spawn({
        title: 'New workspace',
        schema: wsFormSchema,
        confirmLabel: 'Create',
        submit: async (data) => {
            const ws = data.ws!
            await wsStore.createWorkspace({
                name: String(ws.name ?? ''),
                description: String(ws.description ?? ''),
                projectPath: String(ws.projectPath ?? ''),
            })
        },
    })
}

function openWsEdit(ws: Workspace) {
    dialog.spawn({
        title: 'Edit workspace',
        schema: wsFormSchema,
        initialData: {
            ws: {
                name: ws.name,
                description: ws.description ?? '',
                projectPath: ws.projectPath,
            },
        },
        confirmLabel: 'Save',
        submit: async (data) => {
            const w = data.ws!
            await wsStore.updateWorkspace(ws.id, {
                name: String(w.name ?? ''),
                description: String(w.description ?? ''),
                projectPath: String(w.projectPath ?? ''),
            })
        },
    })
}

// --- Workspace delete ---
function confirmDeleteWs(ws: Workspace) {
    dialog.spawn({
        title: 'Delete workspace',
        message: `Delete "${ws.name}"?`,
        confirmLabel: 'Delete',
        confirmVariant: 'danger',
        submit: async () => {
            await wsStore.deleteWorkspace(ws.id)
        },
    })
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
