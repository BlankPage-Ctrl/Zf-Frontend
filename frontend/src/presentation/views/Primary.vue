<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue'
import { useRouter } from 'vue-router'
import { Album, EditPencil, Plus, Settings, Trash, ChatBubble } from '@iconoir/vue'
import { pButton } from '@/presentation/components/button'
import { Header } from '@/presentation/components/header'
import type { HeaderSchema } from '@/presentation/components/header'
import { ContainerGrid, type ContainerSchema } from '@/presentation/components/container'
import type { DialogGridSchema } from '@/presentation/components/dialog/types'
import { useDialog } from '@/presentation/composables/useDialog'
import { useSettingsDialog } from '@/presentation/composables/useSettingsDialog'
import { AppList } from '@/presentation/components/list'
import type { ListSchema } from '@/presentation/components/list'
import { useWorkspaceStorer } from '@/application/stores'
import { useChatStorer } from '@/application/stores'
import { workspaceActions, chatActions } from '@/application/actions'
import type { Workspace } from '@/core/entities'
import type { Chat } from '@/core/entities'

const EditIcon = () => h(EditPencil, { width: 14, height: 14 })
const TrashIcon = () => h(Trash, { width: 14, height: 14 })
const wsStorer = useWorkspaceStorer()
const chatStorer = useChatStorer()
const router = useRouter()
const dialog = useDialog()
const settingsDialog = useSettingsDialog()

function goToSettings() {
    settingsDialog.show()
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
    if (!wsStorer.selectedWorkspace) return null
    return {
        title: wsStorer.selectedWorkspace.name,
        subtitle: `${chatStorer.chats.length} chat${chatStorer.chats.length !== 1 ? 's' : ''}`,
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
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
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
                    background: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
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
    activeId: wsStorer.selectedWorkspaceId,
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
    onSelect: (ws) => workspaceActions.selectWorkspace(ws.id),
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
            await workspaceActions.createWorkspace({
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
            await workspaceActions.updateWorkspace(ws.id, {
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
            await workspaceActions.deleteWorkspace(ws.id)
        },
    })
}

function openWorkspace() {
    if (wsStorer.selectedWorkspaceId) {
        router.push({ name: 'workspace', params: { id: wsStorer.selectedWorkspaceId } })
    }
}

// --- Date formatting ---
function fmtDate(iso: unknown): string {
    return new Date(String(iso)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

onMounted(() => {
    workspaceActions.fetchWorkspaces()
})

watch(
    () => wsStorer.selectedWorkspaceId,
    (id) => {
        if (id) {
            chatActions.fetchChats(id)
        } else {
            chatStorer.setChats([])
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
                    <div v-if="wsStorer.loading && !wsStorer.workspaces.length" class="ws-empty">
                        <span class="text-muted">Loading...</span>
                    </div>

                    <!-- Error -->
                    <div v-else-if="wsStorer.error && !wsStorer.workspaces.length" class="ws-empty">
                        <span class="text-muted">{{ wsStorer.error }}</span>
                        <pButton
                            :schema="{ preset: 'ghost', size: 'sm', label: 'Retry' }"
                            @click="workspaceActions.fetchWorkspaces()"
                        />
                    </div>

                    <!-- Workspace list -->
                    <AppList v-else :schema="wsListSchema" :items="wsStorer.workspaces" />
                </div>
            </template>

            <!-- CHAT CONTENT -->
            <template #cell-1-2>
                <div class="chat-content">
                    <!-- No workspace selected: welcome -->
                    <div v-if="!wsStorer.selectedWorkspace" class="welcome-state">
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
                        <AppList :schema="chatListSchema" :items="chatStorer.chats" />
                    </template>
                </div>
            </template>
        </ContainerGrid>
    </div>
</template>

<style scoped>
.ws-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.chat-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

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
    color: var(--text-primary);
}

.welcome-title {
    font-family: var(--font-serif);
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 6px;
}

.welcome-desc {
    font-size: 13px;
    color: var(--text-primary);
    opacity: 0.5;
    max-width: 300px;
    line-height: 1.5;
    margin: 0;
}
</style>
