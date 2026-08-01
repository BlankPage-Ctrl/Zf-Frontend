<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, watch, onUnmounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Album, ChatBubbleEmpty, EditPencil, Folder, Plus, Trash } from '@iconoir/vue'
import type { DialogGridSchema } from '@/presentation/components/dialog/types'
import { useDialog } from '@/presentation/composables/useDialog'
import { AppList } from '@/presentation/components/list'
import type { ListSchema } from '@/presentation/components/list'
import { IconRails } from '@/presentation/components/icon-rails'
import type { IconRailsSchema } from '@/presentation/components/icon-rails'
import {
    useWorkspaceStorer,
    useChatStorer,
    useProviderStorer,
    useAppearanceStorer,
} from '@/application/stores'
import {
    workspaceActions,
    chatActions,
    providerActions,
    fileExplorerActions,
} from '@/application/actions'
import type { Chat } from '@/core/entities'
import ChatTab from '@/presentation/components/chat/ChatTab.vue'
import type { ChatTabSchema } from '@/presentation/components/chat/types/schema'
import { useSessionCache } from '@/presentation/composables/useSessionCache'
import { ContainerGrid } from '@/presentation/components/container'
import { useSidebarKeyboard } from '@/presentation/composables/useSidebarKeyboard'
import { FileExplorer } from '@/presentation/components/file-explorer'

const route = useRoute()
const router = useRouter()
const wsStorer = useWorkspaceStorer()
const chatStorer = useChatStorer()
const providerStorer = useProviderStorer()
const appearanceStorer = useAppearanceStorer()
const dialog = useDialog()
const { getSession, removeSession, clearSessions } = useSessionCache(() => workspaceId.value)

const routeWsId = computed(() => route.params.id as string | undefined)

const workspaceId = computed(() => {
    return routeWsId.value || wsStorer.selectedWorkspaceId || ''
})

const workspace = computed(() => {
    if (!workspaceId.value) return null
    return wsStorer.workspaces.find((w) => w.id === workspaceId.value) ?? null
})

const sidebarCollapsed = ref(false)
const sidebarPanelWidth = ref(240)
const showFileExplorer = ref(false)

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
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
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
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
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
                    background: 'var(--bg-primary)',
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
    if (newId) getSession(newId)
})

function buildChatTabSchema(chat: Chat): ChatTabSchema {
    const session = getSession(chat.id)
    return {
        title: chat.title,
        messages: session.messages.value,
        loading: session.isLoading.value,
        providers: providerStorer.providers,
        modelId: chat.modelId,
        providerId: chat.providerId,
        contentWidth: appearanceStorer.contentWidth,
        fontSize: appearanceStorer.fontSize,
        lineHeight: appearanceStorer.lineHeight,
        onSend: session.sendMessage,
        onStop: session.stop,
        onSelectModel: (modelId, providerId) => onUpdateChat(chat.id, { modelId, providerId }),
    }
}

const EditIcon = () => h(EditPencil, { width: 14, height: 14 })
const TrashIcon = () => h(Trash, { width: 14, height: 14 })

function getChatById(chatId: string): Chat | undefined {
    return chatStorer.chats.find((c) => c.id === chatId)
}

async function onUpdateChat(chatId: string, payload: { modelId?: string; providerId?: string }) {
    try {
        await chatActions.updateChat(workspaceId.value, chatId, payload)
    } catch {
        /* handled by logic */
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

async function openChatCreate() {
    await dialog.spawn({
        title: 'New chat',
        schema: chatFormSchema,
        confirmLabel: 'Create',
        submit: async (data) => {
            await chatActions.createChat(workspaceId.value, {
                title: String(data.chat!.title ?? ''),
            })
        },
    })
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
    fields: [{ key: 'title', class: 'title' }],
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

async function openChatEdit(chat: Chat) {
    await dialog.spawn({
        title: 'Edit chat',
        schema: editChatFormSchema,
        initialData: { chat: { title: chat.title } },
        confirmLabel: 'Save',
        submit: async (data) => {
            await chatActions.updateChat(workspaceId.value, chat.id, {
                title: String(data.chat!.title ?? ''),
            })
        },
    })
}

async function confirmDeleteChat(chat: Chat) {
    await dialog.spawn({
        title: 'Delete chat',
        message: `Delete "${chat.title}"?`,
        confirmLabel: 'Delete',
        confirmVariant: 'danger',
        submit: async () => {
            if (activeChatId.value === chat.id) {
                activeChatId.value = null
            }
            removeSession(chat.id)
            await chatActions.deleteChat(workspaceId.value, chat.id)
        },
    })
}

function onFileToggle(path: string) {
    fileExplorerActions.toggleExpand(path)
}

function onFileSelect(path: string | null) {
    fileExplorerActions.select(path)
}

function cleanupWorkspace() {
    clearSessions()
    fileExplorerActions.stopWatch()
}

watch(routeWsId, (id) => {
    if (id && id !== wsStorer.selectedWorkspaceId) {
        workspaceActions.selectWorkspace(id)
    }
})

watch(
    () => wsStorer.selectedWorkspaceId,
    (id) => {
        if (id && route.name === 'home' && !routeWsId.value) {
            router.replace({ name: 'workspace', params: { id } })
        }
    },
)

watch(
    workspaceId,
    async (newId, oldId) => {
        if (!newId) {
            cleanupWorkspace()
            return
        }

        if (newId === oldId) return

        cleanupWorkspace()
        activeChatId.value = null
        await chatActions.fetchChats(newId)
        providerActions.fetchProviders()

        const ws = wsStorer.workspaces.find((w) => w.id === newId)
        fileExplorerActions.loadRoot(
            newId,
            ws ? { workspaceRoot: ws.projectPath } : undefined,
        )
        fileExplorerActions.startWatch(newId)

        const chatId = route.query.chat as string | undefined
        if (chatId && chatStorer.chats.some((c) => c.id === chatId)) {
            activeChatId.value = chatId
        }
    },
    { immediate: true },
)

onUnmounted(() => {
    cleanupWorkspace()
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
                        <AppList
                            v-if="!showFileExplorer"
                            :schema="chatListSchema"
                            :items="chatStorer.chats"
                        />
                        <FileExplorer
                            v-else
                            @toggle="onFileToggle"
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

    <div v-else class="ws-layout ws-layout--empty">
        <div class="ws-empty-icon">
            <Album width="48" height="48" style="opacity: 0.3" />
        </div>
        <h2 class="ws-empty-title">
            {{ wsStorer.workspaces.length ? 'Select a workspace' : 'No workspaces yet' }}
        </h2>
        <p class="ws-empty-desc">
            {{
                wsStorer.workspaces.length
                    ? 'Choose a workspace from the top bar to get started.'
                    : 'Create a workspace from the top bar to get started.'
            }}
        </p>
    </div>
</template>

<style>
@import url('@/assets/workspace.css');
</style>
