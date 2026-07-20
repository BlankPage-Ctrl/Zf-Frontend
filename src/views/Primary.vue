<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue'
import { useRouter } from 'vue-router'
import { Album, ChatBubbleEmpty, EditPencil, Plus, Settings, Trash, ChatBubble } from '@iconoir/vue'
import { pButton } from '@/components/button'
import { Header } from '@/components/header'
import type { HeaderSchema } from '@/components/header'
import ContainerGrid from '@/components/container/ContainerGrid.vue'
import type { ContainerSchema } from '@/components/container/types'
import DialogGrid from '@/components/dialog/GridDialog.vue'
import type { DialogGridSchema, DynamicGridDataOutput } from '@/components/dialog/types'
import { DynamicList } from '@/components/list'
import type { ListSchema } from '@/components/list'
import type { DropdownItemConfig } from '@/components/dropdown/types'
import { useWorkspaceStore } from '@/stores/workspace'
import { useChatStore } from '@/stores/chat'
import type { Workspace, WorkspaceDto } from '@/services/workspace'
import type { Chat, ChatDto } from '@/services/chat'
import { chatsApi } from '@/services/chat'

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

// --- Hover menu per workspace ---
const workspaceChatsCache = ref<Map<string, Chat[]>>(new Map())
const workspaceChatsLoading = ref<Set<string>>(new Set())

function ensureWorkspaceChats(wsId: string) {
    if (workspaceChatsCache.value.has(wsId) || workspaceChatsLoading.value.has(wsId)) return
    workspaceChatsLoading.value.add(wsId)
    chatsApi.list(wsId).then((chats) => {
        const map = new Map(workspaceChatsCache.value)
        map.set(wsId, chats)
        workspaceChatsCache.value = map
        workspaceChatsLoading.value.delete(wsId)
    }).catch(() => {
        workspaceChatsLoading.value.delete(wsId)
    })
}

function fmtChatDate(iso: unknown): string {
    if (!iso) return ''
    return new Date(String(iso)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getHoverMenuItems(ws: Workspace): DropdownItemConfig[] {
    ensureWorkspaceChats(ws.id)
    const chats = workspaceChatsCache.value.get(ws.id)
    if (!chats || chats.length === 0) {
        const loading = workspaceChatsLoading.value.has(ws.id)
        return loading
            ? [{ id: 'loading', label: 'Loading...', type: 'label' }]
            : [{ id: 'empty', label: 'No chats yet', type: 'label' }]
    }
    return chats.map((chat) => ({
        id: chat.id,
        label: chat.title,
        value: chat.id,
        icon: ChatBubbleEmpty as any,
    }))
}

function handleHoverChatSelect(chatId: string) {
    const wsId = wsStore.selectedWorkspaceId
    if (wsId) {
        router.push({ name: 'workspace', params: { id: wsId }, query: { chat: chatId } })
    }
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
    hoverMenu: {
        items: (ws) => getHoverMenuItems(ws),
        onSelect: (chatId) => handleHoverChatSelect(chatId),
    },
}))

function goToWorkspace(chat?: Chat) {
    if (wsStore.selectedWorkspaceId) {
        const query = chat ? { chat: chat.id } : undefined
        router.push({ name: 'workspace', params: { id: wsStore.selectedWorkspaceId }, query })
    }
}

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
    onSelect: (chat) => goToWorkspace(chat),
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
                    <DynamicList v-else :schema="wsListSchema" :items="wsStore.workspaces" />
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
