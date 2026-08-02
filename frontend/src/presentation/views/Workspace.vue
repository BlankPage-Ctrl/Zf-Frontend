<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Album, ChatBubbleEmpty, Plus, Settings as SettingsIcon } from '@iconoir/vue'
import { useDialog } from '@/presentation/composables/useDialog'
import { AppList } from '@/presentation/components/list'
import { IconRails } from '@/presentation/components/icon-rails'
import {
    useWorkspaceStorer,
    useChatStorer,
    useProviderStorer,
    useAppearanceStorer,
    useThemeStorer,
} from '@/application/stores'
import {
    workspaceActions,
    chatActions,
    providerActions,
    fileExplorerActions,
    appearanceActions,
    themeActions,
} from '@/application/actions'
import type { Chat } from '@/core/entities'
import { APPEARANCE_PRESETS, type ProviderDto } from '@/core/entities'
import ChatTab from '@/presentation/components/chat/ChatTab.vue'
import type { ChatTabSchema } from '@/presentation/components/chat/types/schema'
import SettingsTab from '@/presentation/components/settings/SettingsTab.vue'
import type {
    SettingsTabSchema,
    SettingsTheme,
} from '@/presentation/components/settings/types/schema'
import type { DynamicGridDataOutput } from '@/presentation/components/dialog/types'
import { useSessionCache } from '@/presentation/composables/useSessionCache'
import { useSettingsTab } from '@/presentation/composables/useSettingsTab'
import { ContainerGrid } from '@/presentation/components/container'
import { TabStrip } from '@/presentation/components/tabs'
import type { TabStripSchema as WsTabStripSchema } from '@/presentation/components/tabs'
import { useSidebarKeyboard } from '@/presentation/composables/useSidebarKeyboard'
import { useTabs } from '@/presentation/composables/useTabs'
import { FileExplorer } from '@/presentation/components/file-explorer'
import {
    chatFormSchema,
    providerFormSchema,
    modelFormSchema,
    createSidebarChatListSchema,
    createChatTabSchema,
    createChatRailsSchema,
    createWorkspaceLayout,
    createSettingsTabSchema,
} from '@/presentation/schemas'

const SETTINGS_TAB_ID = '__settings__'

type TabMeta = { kind: 'chat'; chatId: string } | { kind: 'settings' }

function chatTabMeta(chatId: string): TabMeta {
    return { kind: 'chat', chatId }
}

const route = useRoute()
const router = useRouter()
const wsStorer = useWorkspaceStorer()
const chatStorer = useChatStorer()
const providerStorer = useProviderStorer()
const appearanceStorer = useAppearanceStorer()
const themeStorer = useThemeStorer()
const dialog = useDialog()
const settingsTab = useSettingsTab()
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

const iconRailsSchema = computed(() =>
    createChatRailsSchema({
        showFiles: showFileExplorer.value,
        onChat: () => showPanel('chat'),
        onFiles: () => showPanel('files'),
    }),
)

const workspaceSchema = computed(() =>
    createWorkspaceLayout({
        panelWidth: sidebarPanelWidth.value,
        collapsed: sidebarCollapsed.value,
    }),
)

const { order: openChatIds, activeId: activeChatId, activeMeta, isOpen, open, close, reset } =
    useTabs<string, TabMeta>()

watch(() => settingsTab.requestCount, () => {
    if (workspace.value) open(SETTINGS_TAB_ID, { kind: 'settings' })
})

const activeChat = computed(() => {
    const meta = activeMeta.value
    if (!meta || meta.kind !== 'chat') return null
    return getChatById(meta.chatId)
})

type ContentView = { type: 'chat'; chatId: string } | { type: 'settings' } | { type: 'none' }

const contentView = computed<ContentView>(() => {
    const meta = activeMeta.value
    if (meta?.kind === 'settings') return { type: 'settings' }
    if (meta?.kind === 'chat') return { type: 'chat', chatId: meta.chatId }
    return { type: 'none' }
})

watch(activeChatId, (newId) => {
    if (newId && newId !== SETTINGS_TAB_ID) getSession(newId)
})

const WsTabStripSchema = computed<WsTabStripSchema<string>>(() => {
    const tabs = openChatIds.value
        .filter((id) => id !== SETTINGS_TAB_ID)
        .map((id) => ({
            id,
            title: getChatById(id)?.title ?? 'Untitled chat',
            icon: ChatBubbleEmpty,
            closable: true,
        }))

    if (isOpen(SETTINGS_TAB_ID)) {
        tabs.push({
            id: SETTINGS_TAB_ID,
            title: 'Settings',
            icon: SettingsIcon,
            closable: true,
        })
    }

    return {
        tabs,
        activeId: activeChatId.value,
        closable: true,
        onSelect: (id) => open(id),
        onClose: (id) => close(id),
    }
})

function buildChatTabSchema(chat: Chat): ChatTabSchema {
    return createChatTabSchema({
        chat,
        session: getSession(chat.id),
        providers: providerStorer.providers,
        contentWidth: appearanceStorer.contentWidth,
        fontSize: appearanceStorer.fontSize,
        lineHeight: appearanceStorer.lineHeight,
        onUpdateModel: (modelId, providerId) => onUpdateChat(chat.id, { modelId, providerId }),
    })
}

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

const chatListSchema = computed(() =>
    createSidebarChatListSchema({
        activeChatId: activeChatId.value ?? undefined,
        onSelect: (chat) => {
            open(chat.id, chatTabMeta(chat.id))
        },
        onEdit: openChatEdit,
        onDelete: confirmDeleteChat,
        onCreate: openChatCreate,
    }),
)

async function openChatEdit(chat: Chat) {
    await dialog.spawn({
        title: 'Edit chat',
        schema: chatFormSchema,
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
            if (isOpen(chat.id)) {
                close(chat.id)
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

const settingsThemes = computed<SettingsTheme[]>(() =>
    themeStorer.availableThemes.map((t) => ({
        ...t,
        swatches: themePreviewColors(t.id),
    })),
)

function themePreviewColors(id: string): string[] {
    const colors = themeActions.getThemePreview(id)
    if (!colors) return []
    return [
        normalizeRgb(colors.bgPrimary),
        normalizeRgb(colors.bgSecondary),
        normalizeRgb(colors.border),
        normalizeRgb(colors.textPrimary),
    ]
}

function normalizeRgb(rgb: string): string {
    const parts = rgb.split(',').map((s) => s.trim())
    return `rgb(${parts.join(',')})`
}

async function handleAddProvider() {
    await dialog.spawn({
        title: 'Add provider',
        schema: providerFormSchema,
        confirmLabel: 'Create',
        submit: async (data: DynamicGridDataOutput) => {
            const row = data.row!
            await providerActions.createProvider({
                name: String(row.name ?? ''),
                type: String(row.type ?? 'openai') as ProviderDto['type'],
                apiKey: row.apiKey ? String(row.apiKey) : undefined,
                baseURL: row.baseURL ? String(row.baseURL) : undefined,
            })
        },
    })
}

async function handleEditProvider(provider: {
    id: string
    name: string
    type: ProviderDto['type']
    apiKey?: string
    baseURL?: string
}) {
    await dialog.spawn({
        title: 'Edit provider',
        schema: providerFormSchema,
        initialData: {
            row: {
                name: provider.name,
                type: provider.type,
                apiKey: provider.apiKey ?? '',
                baseURL: provider.baseURL ?? '',
            },
        },
        confirmLabel: 'Save',
        submit: async (data: DynamicGridDataOutput) => {
            const row = data.row!
            await providerActions.updateProvider(provider.id, {
                name: String(row.name ?? ''),
                type: String(row.type ?? 'openai') as ProviderDto['type'],
                apiKey: row.apiKey ? String(row.apiKey) : undefined,
                baseURL: row.baseURL ? String(row.baseURL) : undefined,
            })
        },
    })
}

async function handleAddModel(providerId: string) {
    await dialog.spawn({
        title: 'New model',
        schema: modelFormSchema,
        confirmLabel: 'Create',
        submit: async (data: DynamicGridDataOutput) => {
            const row = data.row!
            await providerActions.createModel(providerId, {
                modelId: String(row.modelId ?? ''),
                displayName: row.displayName ? String(row.displayName) : undefined,
            })
        },
    })
}

async function handleEditModel(
    providerId: string,
    modelId: string,
    data: { modelId: string; displayName?: string },
) {
    await providerActions.updateModel(providerId, modelId, {
        modelId: data.modelId,
        displayName: data.displayName,
    })
}

function buildSettingsTabSchema(): SettingsTabSchema {
    return createSettingsTabSchema({
        providers: providerStorer.providers,
        loading: providerStorer.loading,
        error: providerStorer.error,
        defaultProviderId: providerStorer.defaultProviderId,
        defaultModelId: providerStorer.defaultModelId,
        preset: appearanceStorer.preset,
        fontSize: appearanceStorer.fontSize,
        themes: settingsThemes.value,
        activeThemeId: themeStorer.activeThemeId,
        presets: APPEARANCE_PRESETS,
        onAddProvider: handleAddProvider,
        onEditProvider: handleEditProvider,
        onDeleteProvider: handleDeleteProvider,
        onAddModel: handleAddModel,
        onEditModel: handleEditModel,
        onDeleteModel: handleDeleteModel,
        onSetDefault: handleSetDefault,
        onUpdatePreset: handleUpdatePreset,
        onUpdateFontSize: handleUpdateFontSize,
        onSetActiveTheme: handleSetActiveTheme,
    })
}

async function handleDeleteModel(providerId: string, modelId: string) {
    await providerActions.deleteModel(providerId, modelId)
}

async function handleSetDefault(providerId: string, modelId: string) {
    await providerActions.setDefaultProvider(providerId, modelId)
}

async function handleDeleteProvider(id: string) {
    await providerActions.deleteProvider(id)
}


function cleanupWorkspace() {
    clearSessions()
    fileExplorerActions.stopWatch()
}

function handleUpdatePreset(preset: string) {
    appearanceActions.setPreset(preset)
}

function handleUpdateFontSize(size: number) {
    appearanceActions.setFontSize(size)
}

function handleSetActiveTheme(id: string) {
    themeActions.setTheme(id)
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
        reset()
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
            open(chatId, chatTabMeta(chatId))
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
                <div class="ws-content">
                    <TabStrip v-if="openChatIds.length" :schema="WsTabStripSchema" />
                    <div class="ws-content__body">
                        <KeepAlive>
                            <ChatTab
                                v-if="contentView.type === 'chat' && activeChat"
                                :key="activeChat.id"
                                :schema="buildChatTabSchema(activeChat)"
                            />
                        </KeepAlive>
                        <SettingsTab
                            v-if="contentView.type === 'settings'"
                            :schema="buildSettingsTabSchema()"
                        />
                        <div v-if="!openChatIds.length" class="ws-content__empty">
                            <div class="ws-empty__icon">
                                <ChatBubbleEmpty width="48" height="48" style="opacity: 0.3" />
                            </div>
                            <h2 class="ws-empty__title">
                                Just Select something on the sidebar, vro ✌🏻🥹
                            </h2>
                            <p class="ws-empty__desc">What will you have after 500 years!?.</p>
                        </div>
                    </div>
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
