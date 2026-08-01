<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RouterView } from 'vue-router'
import AppTitle from '@/presentation/components/AppTitle.vue'
import DialogContainer from '@/presentation/components/dialog/DialogContainer.vue'
import SettingsPanel from '@/presentation/components/settings/SettingsPanel.vue'
import type { SettingsTheme } from '@/presentation/components/settings/types'
import { Xmark } from '@iconoir/vue'
import {
    useWorkspaceStorer,
    useAppearanceStorer,
    useThemeStorer,
    useProviderStorer,
} from '@/application/stores'
import {
    workspaceActions,
    appearanceActions,
    themeActions,
    providerActions,
} from '@/application/actions'
import { useSettingsDialog } from '@/presentation/composables/useSettingsDialog'
import { useDialog } from '@/presentation/composables/useDialog'
import type { DynamicGridDataOutput } from '@/presentation/components/dialog/types'
import {
    workspaceFormSchema,
    providerFormSchema,
    modelFormSchema,
    themeFormSchema,
} from '@/presentation/schemas'
import {
    APPEARANCE_PRESETS,
    type ThemeSchema,
    type ProviderDto,
} from '@/core/entities'

const router = useRouter()
const wsStorer = useWorkspaceStorer()
const appearanceStorer = useAppearanceStorer()
const themeStorer = useThemeStorer()
const providerStorer = useProviderStorer()
const settingsDialog = useSettingsDialog()
const dialog = useDialog()

const fileInputRef = ref<HTMLInputElement | null>(null)

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

onMounted(async () => {
    appearanceActions.load()
    await themeActions.load()
    await providerActions.fetchProviders()
    await providerActions.fetchDefaultProvider()
    workspaceActions.fetchWorkspaces()
})

// --- AppTitle (title bar) orchestration ---
function onSelectWorkspace(id: string) {
    workspaceActions.selectWorkspace(id)
    router.push({ name: 'workspace', params: { id } })
}

async function onCreateWorkspace() {
    await dialog.spawn({
        title: 'New workspace',
        schema: workspaceFormSchema,
        confirmLabel: 'Create',
        submit: async (data) => {
            const d = data.ws!
            await workspaceActions.createWorkspace({
                name: String(d.name ?? ''),
                description: String(d.description ?? ''),
                projectPath: String(d.projectPath ?? ''),
            })
            if (wsStorer.selectedWorkspaceId) {
                router.push({
                    name: 'workspace',
                    params: { id: wsStorer.selectedWorkspaceId },
                })
            }
        },
    })
}

async function onDeleteWorkspace(id: string) {
    const ws = wsStorer.workspaces.find((w) => w.id === id)
    if (!ws) return
    await dialog.spawn({
        title: 'Delete workspace',
        message: `Delete "${ws.name}"?`,
        confirmLabel: 'Delete',
        confirmVariant: 'danger',
        submit: async () => {
            await workspaceActions.deleteWorkspace(id)
            if (wsStorer.selectedWorkspaceId !== id) return
            const first = wsStorer.workspaces[0]
            if (first) {
                workspaceActions.selectWorkspace(first.id)
                router.push({ name: 'workspace', params: { id: first.id } })
            } else {
                workspaceActions.selectWorkspace(null)
                router.push({ name: 'home' })
            }
        },
    })
}

// --- Provider handlers ---
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

async function handleDeleteProvider(id: string) {
    await providerActions.deleteProvider(id)
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

async function handleDeleteModel(providerId: string, modelId: string) {
    await providerActions.deleteModel(providerId, modelId)
}

async function handleSetDefault(providerId: string, modelId: string) {
    await providerActions.setDefaultProvider(providerId, modelId)
}

// --- Appearance handlers ---
function handleUpdatePreset(preset: string) {
    appearanceActions.setPreset(preset)
}

function handleUpdateFontSize(size: number) {
    appearanceActions.setFontSize(size)
}

// --- Theme handlers ---
async function handleAddTheme() {
    await dialog.spawn({
        title: 'Create Theme',
        schema: themeFormSchema,
        confirmLabel: 'Create',
        submit: async (data: DynamicGridDataOutput) => {
            const row = data.row ?? {}
            const theme: ThemeSchema = {
                id: crypto.randomUUID(),
                name: String(row.name ?? ''),
                description: row.description ? String(row.description) : undefined,
                colors: {
                    bgPrimary: String(row.bgPrimary ?? ''),
                    bgSecondary: String(row.bgSecondary ?? ''),
                    border: String(row.border ?? ''),
                    textPrimary: String(row.textPrimary ?? ''),
                    success: String(row.success ?? ''),
                    danger: String(row.danger ?? ''),
                    shadow: String(row.shadow ?? ''),
                },
            }
            themeActions.addCustomTheme(theme)
        },
    })
}

function handleImportTheme() {
    fileInputRef.value?.click()
}

function handleFileImport(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
        try {
            const parsed = JSON.parse(reader.result as string)
            const schema = themeActions.importTheme(parsed)
            themeActions.addCustomTheme(schema)
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Invalid theme file')
        }
    }
    reader.readAsText(file)
    input.value = ''
}

function handleExportTheme(id: string) {
    const schema = themeActions.exportTheme(id)
    if (!schema) return
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${schema.id}-theme.json`
    a.click()
    URL.revokeObjectURL(url)
}

async function handleRemoveTheme(id: string) {
    themeActions.removeCustomTheme(id)
}

function handleSetActiveTheme(id: string) {
    themeActions.setTheme(id)
}
</script>

<template>
    <div class="app-shell">
        <AppTitle
            :workspaces="wsStorer.workspaces"
            :selected-workspace-id="wsStorer.selectedWorkspaceId"
            :loading="wsStorer.loading"
            @select-workspace="onSelectWorkspace"
            @create-workspace="onCreateWorkspace"
            @delete-workspace="onDeleteWorkspace"
            @open-settings="settingsDialog.show()"
        />
        <RouterView v-slot="{ Component }">
            <div class="router-view">
                <component :is="Component" />
            </div>
        </RouterView>
        <DialogContainer />

        <!-- Settings Dialog -->
        <transition name="dialog-fade">
            <div
                v-if="settingsDialog.visible"
                class="dialog-overlay"
                @click="settingsDialog.hide()"
            >
                <div class="dialog-panel width-xl" @click.stop>
                    <div class="dialog-header">
                        <h3 class="dialog-title">Settings</h3>
                        <button class="btn-close" @click="settingsDialog.hide()" title="Close">
                            <Xmark width="18" height="18" />
                        </button>
                    </div>
                    <div class="dialog-body">
                        <SettingsPanel
                            :providers="providerStorer.providers"
                            :loading="providerStorer.loading"
                            :error="providerStorer.error"
                            :default-provider-id="providerStorer.defaultProviderId"
                            :default-model-id="providerStorer.defaultModelId"
                            :preset="appearanceStorer.preset"
                            :font-size="appearanceStorer.fontSize"
                            :themes="settingsThemes"
                            :active-theme-id="themeStorer.activeThemeId"
                            :presets="APPEARANCE_PRESETS"
                            @add-provider="handleAddProvider"
                            @edit-provider="handleEditProvider"
                            @delete-provider="handleDeleteProvider"
                            @add-model="handleAddModel"
                            @edit-model="handleEditModel"
                            @delete-model="handleDeleteModel"
                            @set-default="handleSetDefault"
                            @update-preset="handleUpdatePreset"
                            @update-font-size="handleUpdateFontSize"
                            @add-theme="handleAddTheme"
                            @import-theme="handleImportTheme"
                            @export-theme="handleExportTheme"
                            @remove-theme="handleRemoveTheme"
                            @set-active-theme="handleSetActiveTheme"
                            @close="settingsDialog.hide()"
                        />
                    </div>
                </div>
            </div>
        </transition>

        <input
            ref="fileInputRef"
            type="file"
            accept=".json"
            style="display: none"
            @change="handleFileImport"
        />
    </div>
</template>

<style scoped>
.app-shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.router-view {
    flex: 1;
    min-height: 0;
}

.dialog-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background-color: rgba(15, 15, 20, 0.45);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

.dialog-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: 90vh;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    box-shadow:
        0 4px 8px rgba(15, 15, 20, 0.06),
        0 12px 24px rgba(15, 15, 20, 0.05);
    overflow: hidden;
}

.width-xl {
    max-width: 960px;
}

.dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px 8px;
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
}

.dialog-title {
    font-family: var(--font-serif);
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--text-primary);
    margin: 0;
}

.btn-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    color: var(--text-primary);
    cursor: pointer;
    transition:
        background-color 150ms ease,
        color 150ms ease;
    border: none;
    background: transparent;
}

.btn-close:hover:not(:disabled) {
    background-color: var(--border-color);
    color: var(--text-primary);
}

.dialog-body {
    padding: 14px 20px;
    overflow-y: auto;
    flex: 1;
}

.dialog-body::-webkit-scrollbar {
    width: 4px;
}
.dialog-body::-webkit-scrollbar-track {
    background: transparent;
}
.dialog-body::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
}
.dialog-body::-webkit-scrollbar-thumb:hover {
    background: var(--border-color);
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
    transition: opacity 200ms ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
    opacity: 0;
}
</style>
