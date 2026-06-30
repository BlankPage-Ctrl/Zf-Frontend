<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { pButton } from '@/components/button'
import ContainerGrid from '@/components/container/ContainerGrid.vue'
import type { ContainerRowConfig } from '@/components/container/types'
import DialogGrid from '@/components/dialog/GridDialog.vue'
import type { DialogGridSchema, DynamicGridDataOutput } from '@/components/dialog/types'
import { DynamicList } from '@/components/list'
import type { ListSchema } from '@/components/list'
import { useWorkspaceStore } from '@/stores/workspace'
import { useChatStore } from '@/stores/chat'
import type { Workspace, WorkspaceDto } from '@/services/workspace'
import type { Chat, ChatDto } from '@/services/chat'

const SettingsIcon = () => h(Icon, { icon: 'lucide:settings' })
const PlusIcon = () => h(Icon, { icon: 'lucide:plus' })
const EditIcon = () => h(Icon, { icon: 'lucide:pencil' })
const TrashIcon = () => h(Icon, { icon: 'lucide:trash-2' })
const FolderIcon = () => h(Icon, { icon: 'lucide:folder' })

const wsStore = useWorkspaceStore()
const chatStore = useChatStore()
const router = useRouter()

function goToSettings() {
    router.push({ name: 'settings' })
}

const rows = ref<ContainerRowConfig[]>([
    {
        id: 'row-1',
        height: '1fr',
        columns: [
            {
                id: 'cell-1-1',
                width: 200,
                cell: {
                    padding: 0,
                    background: 'rgb(var(--secondary-color))',
                    borderColor: 'rgba(var(--third-color), 0.25)',
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
                    background: 'rgb(var(--primary-color))',
                    borderColor: 'rgba(var(--third-color), 0.15)',
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

const chatFormSchema: DialogGridSchema = {
    chat: {
        columns: {
            title: {
                type: 'text-short',
                label: 'Title',
                placeholder: 'Chat title',
                metadata: { require: true },
            },
            model: {
                type: 'text-short',
                label: 'Model',
                placeholder: 'e.g. gpt-4o',
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
    actions: [
        {
            icon: TrashIcon,
            ariaLabel: 'Delete',
            variant: 'danger',
            size: 'xs',
            onClick: confirmDeleteChat,
        },
    ],
    emptyMessage: 'No chats yet',
    emptyAction: { label: 'Create your first chat', onClick: openChatCreate },
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

// --- Chat form ---
const showChatDialog = ref(false)
const chatFormLoading = ref(false)

function openChatCreate() {
    showChatDialog.value = true
}

function cancelChatForm() {
    showChatDialog.value = false
}

async function submitChatForm(data: DynamicGridDataOutput) {
    if (!wsStore.selectedWorkspaceId) return
    const chat = data.chat!
    const payload: ChatDto = {
        title: String(chat.title ?? ''),
        modelId: String(chat.model ?? ''),
    }
    chatFormLoading.value = true
    try {
        await chatStore.createChat(wsStore.selectedWorkspaceId, payload)
        showChatDialog.value = false
    } catch {
        /* error handled by store */
    } finally {
        chatFormLoading.value = false
    }
}

// --- Chat delete ---
const showChatDeleteDialog = ref(false)
const deletingChat = ref<Chat | null>(null)

function confirmDeleteChat(chat: Chat) {
    deletingChat.value = chat
    showChatDeleteDialog.value = true
}

async function executeDeleteChat() {
    if (!wsStore.selectedWorkspaceId || !deletingChat.value) return
    await chatStore.deleteChat(wsStore.selectedWorkspaceId, deletingChat.value.id)
    showChatDeleteDialog.value = false
    deletingChat.value = null
}

function cancelChatDelete() {
    showChatDeleteDialog.value = false
    deletingChat.value = null
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
        <ContainerGrid :rows="rows" :animate="true" :animation-ms="200">
            <!-- WORKSPACE SIDEBAR -->
            <template #cell-1-1>
                <div class="ws-sidebar">
                    <div class="ws-header">
                        <h2 class="ws-title">Workspaces</h2>
                        <div class="ws-header-actions">
                            <pButton
                                :schema="{
                                    preset: 'icon-only',
                                    size: 'sm',
                                    icon: SettingsIcon,
                                    ariaLabel: 'Settings',
                                }"
                                @click="goToSettings"
                            />
                            <pButton
                                :schema="{
                                    preset: 'icon-only',
                                    size: 'sm',
                                    icon: PlusIcon,
                                    ariaLabel: 'New workspace',
                                }"
                                @click="openWsCreate"
                            />
                        </div>
                    </div>

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
                    <DynamicList v-else :schema="wsListSchema" :items="wsStore.workspaces" />
                </div>
            </template>

            <!-- CHAT CONTENT -->
            <template #cell-1-2>
                <div class="chat-content">
                    <!-- No workspace selected: welcome -->
                    <div v-if="!wsStore.selectedWorkspace" class="welcome-state">
                        <div class="welcome-icon">
                            <svg
                                width="48"
                                height="48"
                                viewBox="0 0 48 48"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                opacity="0.3"
                            >
                                <rect x="6" y="10" width="36" height="28" rx="3" />
                                <line x1="6" y1="18" x2="42" y2="18" />
                                <line x1="14" y1="10" x2="14" y2="6" />
                                <line x1="24" y1="10" x2="24" y2="6" />
                                <line x1="34" y1="10" x2="34" y2="6" />
                            </svg>
                        </div>
                        <h2 class="welcome-title">Welcome</h2>
                        <p class="welcome-desc">
                            Select a workspace from the sidebar to view and manage its chats, or
                            create a new workspace to get started.
                        </p>
                    </div>

                    <!-- Workspace selected -->
                    <template v-else>
                        <div class="chat-header">
                            <div class="chat-header-info">
                                <h2 class="chat-header-title">
                                    {{ wsStore.selectedWorkspace.name }}
                                </h2>
                                <span class="chat-header-meta"
                                    >{{ chatStore.chats.length }} chat{{
                                        chatStore.chats.length !== 1 ? 's' : ''
                                    }}</span
                                >
                            </div>
                            <pButton
                                :schema="{
                                    preset: 'primary',
                                    size: 'sm',
                                    label: 'Open',
                                    icon: FolderIcon,
                                }"
                                @click="openWorkspace"
                            />
                        </div>

                        <!-- Chat list -->
                        <DynamicList :schema="chatListSchema" :items="chatStore.chats" />
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

        <!-- Chat Form Dialog -->
        <DialogGrid
            v-model="showChatDialog"
            :schema="chatFormSchema"
            title="New chat"
            confirm-label="Create"
            :loading="chatFormLoading"
            @submit="submitChatForm"
            @cancel="cancelChatForm"
        />

        <!-- Chat Delete Dialog -->
        <DialogGrid
            v-model="showChatDeleteDialog"
            title="Delete chat"
            confirm-label="Delete"
            confirm-variant="danger"
            @submit="executeDeleteChat"
            @cancel="cancelChatDelete"
        >
            <span class="confirm-message">Delete "{{ deletingChat?.title }}"?</span>
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

.ws-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 12px 8px;
    flex-shrink: 0;
}

.ws-header-actions {
    display: flex;
    gap: 2px;
}

.ws-title {
    font-family: var(--font-serif);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: rgb(var(--text-color));
    margin: 0;
}

/* --- Chat content --- */
.chat-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px 12px;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(var(--third-color), 0.12);
}

.chat-header-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.chat-header-title {
    font-family: var(--font-serif);
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: rgb(var(--text-color));
    margin: 0;
}

.chat-header-meta {
    font-size: 11px;
    color: rgb(var(--text-color));
    opacity: 0.45;
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
    color: rgb(var(--text-color));
}

.welcome-title {
    font-family: var(--font-serif);
    font-size: 18px;
    font-weight: 600;
    color: rgb(var(--text-color));
    margin: 0 0 6px;
}

.welcome-desc {
    font-size: 13px;
    color: rgb(var(--text-color));
    opacity: 0.5;
    max-width: 300px;
    line-height: 1.5;
    margin: 0;
}
</style>
