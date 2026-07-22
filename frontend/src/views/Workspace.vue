<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChatBubbleEmpty, EditPencil, Folder, NavArrowLeft, Plus, Trash } from '@iconoir/vue'
import DialogGrid from '@/components/dialog/GridDialog.vue'
import type { DialogGridSchema, DynamicGridDataOutput } from '@/components/dialog/types'
import { List } from '@/components/list'
import type { ListSchema } from '@/components/list'
import { IconRails } from '@/components/icon-rails'
import type { IconRailsSchema } from '@/components/icon-rails'
import { useWorkspaceStore } from '@/stores/workspace'
import { useChatStore } from '@/stores/chat'
import { useProviderStore } from '@/stores/provider'
import { useAppearanceStore } from '@/stores/appearance'
import type { Chat, ChatDto } from '@/services/chat'
import ChatTab from '@/components/chat/ChatTab.vue'
import type { ChatTabSchema } from '@/components/chat/types/schema'
import { useChatSession } from '@/composables/useChatSession'
import { ContainerGrid } from '@/components/container'
import { useSidebarKeyboard } from '@/composables/useSidebarKeyboard'
import { FileExplorer } from '@/components/file-explorer'
import type { FEListDirData, FEMeta } from '@/components/file-explorer'
import { filesApi } from '@/services/files'

const route = useRoute()
const router = useRouter()
const wsStore = useWorkspaceStore()
const chatStore = useChatStore()
const providerStore = useProviderStore()
const appearanceStore = useAppearanceStore()

function goBack() {
    router.push({ name: 'primary' })
}

const workspaceId = computed(() => route.params.id as string)
const workspace = computed(() => wsStore.workspaces.find((w) => w.id === workspaceId.value) ?? null)

const sidebarCollapsed = ref(false)
const sidebarPanelWidth = ref(240)
const showFileExplorer = ref(false)

const fileExplorerRef = ref<InstanceType<typeof FileExplorer> | null>(null)
const fileExplorerInitialData = ref<FEListDirData>({ requestedPath: '.', nodes: [] })
const fileExplorerMeta = computed<FEMeta | undefined>(() => {
    if (!workspace.value) return undefined
    return { workspaceRoot: workspace.value.projectPath }
})
const watchCleanup = ref<(() => void) | null>(null)

useSidebarKeyboard(() => {
    sidebarCollapsed.value = !sidebarCollapsed.value
})

function showPanel(view: 'chat' | 'files') {
    showFileExplorer.value = view === 'files'
    sidebarCollapsed.value = false
}

const iconRailsSchema = computed<IconRailsSchema>(() => ({
    items: [
        {
            id: 'chat',
            icon: ChatBubbleEmpty,
            ariaLabel: 'Chat',
            tooltip: 'Chat',
            active: !showFileExplorer.value,
            onClick: () => showPanel('chat'),
        },
        {
            id: 'files',
            icon: Folder,
            ariaLabel: 'File Explorer',
            tooltip: 'File Explorer',
            active: showFileExplorer.value,
            onClick: () => showPanel('files'),
        },
    ],
}))

const workspaceSchema = computed(() => [
    {
        id: 'workspace',
        columns: [
            {
                id: 'rail',
                width: 48,
                resizable: false,
                cell: {
                    background: 'rgb(var(--bg-secondary))',
                    borderColor: 'rgba(var(--border-color), 0.25)',
                    borderWidth: '0 1px 0 0',
                    borderStyle: 'solid' as const,
                    overflow: 'hidden' as const,
                },
            },
            {
                id: 'panel',
                width: sidebarPanelWidth.value,
                visible: !sidebarCollapsed.value,
                resizable: true,
                resizeMode: 'edge' as const,
                minWidth: 180,
                maxWidth: 480,
                cell: {
                    background: 'rgb(var(--bg-secondary))',
                    borderColor: 'rgba(var(--border-color), 0.25)',
                    borderWidth: '0 1px 0 0',
                    borderStyle: 'solid' as const,
                    overflow: 'hidden' as const,
                },
            },
            {
                id: 'content',
                width: '1fr',
                resizable: false,
                cell: {
                    background: 'rgb(var(--bg-primary))',
                    overflow: 'hidden' as const,
                },
            },
        ],
    },
])

const activeChatId = ref<string | null>(null)

const activeChat = computed(() => {
    if (!activeChatId.value) return null
    return getChatById(activeChatId.value)
})

type ContentView = { type: 'chat'; chatId: string } | { type: 'none' }

const contentView = computed<ContentView>(() => {
    if (activeChatId.value) return { type: 'chat', chatId: activeChatId.value }
    return { type: 'none' }
})

watch(activeChatId, (newId) => {
    if (newId) ensureSession(newId)
})

const chatSessions = new Map<string, ReturnType<typeof useChatSession>>()

function ensureSession(chatId: string) {
    if (!chatSessions.has(chatId)) {
        const session = useChatSession(workspaceId.value, chatId)
        chatSessions.set(chatId, session)
        session.loadHistory()
    }
    return chatSessions.get(chatId)!
}

function removeSession(chatId: string) {
    const session = chatSessions.get(chatId)
    if (session) {
        session.cleanup()
        chatSessions.delete(chatId)
    }
}

function buildChatTabSchema(chat: Chat): ChatTabSchema {
    const session = ensureSession(chat.id)
    return {
        title: chat.title,
        messages: session.messages.value,
        loading: session.isLoading.value,
        providers: providerStore.providers,
        modelId: chat.modelId,
        providerId: chat.providerId,
        contentWidth: appearanceStore.contentWidth,
        fontSize: appearanceStore.fontSize,
        lineHeight: appearanceStore.lineHeight,
        onSend: session.sendMessage,
        onStop: session.stop,
        onSelectModel: (modelId, providerId) => onUpdateChat(chat.id, { modelId, providerId }),
    }
}

const EditIcon = () => h(EditPencil, { width: 14, height: 14 })
const TrashIcon = () => h(Trash, { width: 14, height: 14 })

function getChatById(chatId: string): Chat | undefined {
    return chatStore.chats.find((c) => c.id === chatId)
}

async function onUpdateChat(chatId: string, payload: { modelId?: string; providerId?: string }) {
    try {
        await chatStore.updateChat(workspaceId.value, chatId, payload)
    } catch {
        /* handled by store */
    }
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
        },
    },
}

const showChatCreate = ref(false)
const chatCreateLoading = ref(false)

function openChatCreate() {
    showChatCreate.value = true
}

function cancelChatCreate() {
    showChatCreate.value = false
}

async function submitChatCreate(data: DynamicGridDataOutput) {
    const d = data.chat!
    const payload: ChatDto = { title: String(d.title ?? '') }
    chatCreateLoading.value = true
    try {
        await chatStore.createChat(workspaceId.value, payload)
        showChatCreate.value = false
    } catch {
        /* handled by store */
    } finally {
        chatCreateLoading.value = false
    }
}

const editChatFormSchema: DialogGridSchema = {
    chat: {
        columns: {
            title: {
                type: 'text-short',
                label: 'Title',
                placeholder: 'Chat title',
                metadata: { require: true },
            },
        },
    },
}

const chatListSchema = computed<ListSchema<Chat>>(() => ({
    variant: 'sidebar',
    size: 'sm',
    activeKey: 'id',
    activeId: activeChatId.value ?? undefined,
    fields: [
        { key: 'title', class: 'title' },
        // { key: 'createdAt', class: 'date', format: fmtDate },
    ],
    actions: [
        { icon: EditIcon, ariaLabel: 'Edit', variant: 'ghost', size: 'xs', onClick: openChatEdit },
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
    onSelect: (chat) => {
        activeChatId.value = chat.id
    },
}))

const showChatEdit = ref(false)
const editingChat = ref<Chat | null>(null)
const chatEditLoading = ref(false)

const editChatInitialData = computed<DynamicGridDataOutput | undefined>(() => {
    if (!editingChat.value) return undefined
    return { chat: { title: editingChat.value.title } }
})

function openChatEdit(chat: Chat) {
    editingChat.value = chat
    showChatEdit.value = true
}

function cancelChatEdit() {
    showChatEdit.value = false
    editingChat.value = null
}

async function submitChatEdit(data: DynamicGridDataOutput) {
    if (!editingChat.value) return
    const d = data.chat!
    const payload: Partial<ChatDto> = { title: String(d.title ?? '') }
    chatEditLoading.value = true
    try {
        await chatStore.updateChat(workspaceId.value, editingChat.value.id, payload)
        showChatEdit.value = false
        editingChat.value = null
    } catch {
        /* handled by store */
    } finally {
        chatEditLoading.value = false
    }
}

const showChatDelete = ref(false)
const deletingChat = ref<Chat | null>(null)

function confirmDeleteChat(chat: Chat) {
    deletingChat.value = chat
    showChatDelete.value = true
}

function cancelChatDelete() {
    showChatDelete.value = false
    deletingChat.value = null
}

async function executeChatDelete() {
    if (!deletingChat.value) return
    if (activeChatId.value === deletingChat.value.id) {
        activeChatId.value = null
    }
    removeSession(deletingChat.value.id)
    await chatStore.deleteChat(workspaceId.value, deletingChat.value.id)
    showChatDelete.value = false
    deletingChat.value = null
}

async function onRequestChildren(path: string) {
    try {
        const data = await filesApi.listDir(workspaceId.value, path)
        fileExplorerRef.value?.loadChildren(data)
    } catch (e) {
        console.error('[FileExplorer] failed to list dir:', path, e)
    }
}

function onFileSelect(path: string | null) {
    console.log('[FileExplorer] selected:', path)
}

async function setupFileExplorer() {
    if (!workspaceId.value) return
    try {
        const data = await filesApi.listDir(workspaceId.value, '.')
        fileExplorerInitialData.value = data
    } catch (e) {
        console.error('[FileExplorer] failed to load root:', e)
    }
}

function setupWatchEvents() {
    watchCleanup.value = filesApi.createWatchConnection(
        workspaceId.value,
        (event) => {
            fileExplorerRef.value?.applyWatchEvent(event)
        },
        () => {
            console.error('[FileExplorer] watch connection error')
        },
    )
}

onMounted(async () => {
    if (workspaceId.value) {
        wsStore.selectWorkspace(workspaceId.value)
        await chatStore.fetchChats(workspaceId.value)
        providerStore.fetchProviders()
        await setupFileExplorer()
        setupWatchEvents()
        const chatId = route.query.chat as string | undefined
        if (chatId && chatStore.chats.some((c) => c.id === chatId)) {
            activeChatId.value = chatId
        }
    }
})

onUnmounted(() => {
    watchCleanup.value?.()
})
</script>

<template>
    <div class="ws-layout" v-if="workspace">
        <ContainerGrid :schema="workspaceSchema" :animate="true">
            <template #rail>
                <IconRails :schema="iconRailsSchema" />
            </template>

            <template #panel>
                <div class="ws-sidebar__panel">
                    <div v-if="workspace && !showFileExplorer" class="ws-sidebar__header">
                        <button
                            class="ws-back-btn"
                            @click="goBack"
                            title="Back to workspaces"
                            aria-label="Back"
                        >
                            <NavArrowLeft width="16" height="16" />
                        </button>
                        <span class="ws-sidebar__title">{{ workspace.name }}</span>
                        <button
                            class="ws-sidebar__action"
                            @click="openChatCreate"
                            title="New chat"
                            aria-label="New chat"
                        >
                            <Plus width="14" height="14" />
                        </button>
                    </div>
                    <div class="ws-sidebar__body">
                        <List
                            v-if="!showFileExplorer"
                            :schema="chatListSchema"
                            :items="chatStore.chats"
                        />
                        <FileExplorer
                            v-else
                            ref="fileExplorerRef"
                            :initial-data="fileExplorerInitialData"
                            :meta="fileExplorerMeta"
                            @request-children="onRequestChildren"
                            @select="onFileSelect"
                        />
                    </div>
                </div>
            </template>

            <template #content>
                <ChatTab
                    v-if="contentView.type === 'chat' && activeChat"
                    :key="activeChat.id"
                    :schema="buildChatTabSchema(activeChat)"
                />
                <div v-else class="ws-content__empty">
                    <div class="ws-empty__icon">
                        <ChatBubbleEmpty width="48" height="48" style="opacity: 0.3" />
                    </div>
                    <h2 class="ws-empty__title">Just Select something on the sidebar, vro ✌🏻🥹</h2>
                    <p class="ws-empty__desc">What will you have after 500 years!?.</p>
                </div>
            </template>
        </ContainerGrid>
    </div>

    <div v-else class="ws-layout ws-layout--not-found">
        <span class="text-muted">Workspace not found</span>
    </div>

    <!-- Chat Create Dialog -->
    <DialogGrid
        v-model="showChatCreate"
        :schema="chatFormSchema"
        title="New chat"
        confirm-label="Create"
        :loading="chatCreateLoading"
        @submit="submitChatCreate"
        @cancel="cancelChatCreate"
    />

    <!-- Chat Edit Dialog -->
    <DialogGrid
        v-model="showChatEdit"
        :schema="editChatFormSchema"
        title="Edit chat"
        confirm-label="Save"
        :initial-data="editChatInitialData"
        :loading="chatEditLoading"
        @submit="submitChatEdit"
        @cancel="cancelChatEdit"
    />

    <!-- Chat Delete Dialog -->
    <DialogGrid
        v-model="showChatDelete"
        title="Delete chat"
        confirm-label="Delete"
        confirm-variant="danger"
        @submit="executeChatDelete"
        @cancel="cancelChatDelete"
    >
        <span class="confirm-message">Delete "{{ deletingChat?.title }}"?</span>
    </DialogGrid>
</template>

<style>
@import url('@/assets/workspace.css');
</style>
