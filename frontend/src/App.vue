<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import AppTitle from '@/components/AppTitle.vue'
import DialogContainer from '@/components/dialog/DialogContainer.vue'
import SettingsPanel from '@/components/settings/SettingsPanel.vue'
import type { SettingsTheme } from '@/components/settings/types'
import { Xmark } from '@iconoir/vue'
import { useAppearanceStore } from '@/stores/appearance'
import { useThemeStore } from '@/stores/theme'
import { useProviderStore } from '@/stores/provider'
import { useSettingsDialog } from '@/composables/useSettingsDialog'
import { useDialog } from '@/composables/useDialog'
import type { DialogGridSchema, DynamicGridDataOutput } from '@/components/dialog/types'
import type { ThemeSchema } from '@/stores/theme'
import type { ProviderDto } from '@/services/provider'

const appearanceStore = useAppearanceStore()
const themeStore = useThemeStore()
const providerStore = useProviderStore()
const settingsDialog = useSettingsDialog()
const dialog = useDialog()

const providerFormSchema: DialogGridSchema = {
    row: {
        columns: {
            name: {
                type: 'text-short',
                label: 'Name',
                placeholder: 'e.g. OpenAI',
                span: 6,
                metadata: { require: true },
            },
            type: {
                type: 'select',
                label: 'Type',
                span: 6,
                metadata: {
                    require: true,
                    options: [
                        { label: 'OpenAI', value: 'openai' },
                        { label: 'OpenAI Compatible', value: 'openai-compatible' },
                    ],
                },
            },
            apiKey: { type: 'text-short', label: 'API key', placeholder: 'sk-...', span: 12 },
            baseURL: {
                type: 'text-short',
                label: 'Base URL',
                placeholder: 'https://api.example.com/v1',
                span: 12,
            },
        },
    },
}

const modelFormSchema: DialogGridSchema = {
    row: {
        columns: {
            modelId: {
                type: 'text-short',
                label: 'Model ID',
                placeholder: 'e.g. gpt-4o',
                span: 6,
                metadata: { require: true },
            },
            displayName: {
                type: 'text-short',
                label: 'Display name',
                placeholder: 'e.g. GPT-4o',
                span: 6,
            },
        },
    },
}

const themeFormSchema: DialogGridSchema = {
    row: {
        columns: {
            name: {
                type: 'text-short',
                label: 'Theme Name',
                span: 12,
                metadata: { require: true },
            },
            description: {
                type: 'text-short',
                label: 'Description',
                span: 12,
            },
            bgPrimary: {
                type: 'text-short',
                label: 'Background (R, G, B)',
                span: 6,
                placeholder: '255, 250, 243',
                metadata: { require: true, pattern: '^\\d{1,3},\\s*\\d{1,3},\\s*\\d{1,3}$' },
            },
            bgSecondary: {
                type: 'text-short',
                label: 'Surface (R, G, B)',
                span: 6,
                placeholder: '255, 242, 219',
                metadata: { require: true, pattern: '^\\d{1,3},\\s*\\d{1,3},\\s*\\d{1,3}$' },
            },
            border: {
                type: 'text-short',
                label: 'Border (R, G, B)',
                span: 6,
                placeholder: '255, 229, 191',
                metadata: { require: true, pattern: '^\\d{1,3},\\s*\\d{1,3},\\s*\\d{1,3}$' },
            },
            textPrimary: {
                type: 'text-short',
                label: 'Text (R, G, B)',
                span: 6,
                placeholder: '19, 16, 16',
                metadata: { require: true, pattern: '^\\d{1,3},\\s*\\d{1,3},\\s*\\d{1,3}$' },
            },
            success: {
                type: 'text-short',
                label: 'Success (R, G, B)',
                span: 6,
                placeholder: '34, 197, 93',
                metadata: { require: true, pattern: '^\\d{1,3},\\s*\\d{1,3},\\s*\\d{1,3}$' },
            },
            danger: {
                type: 'text-short',
                label: 'Danger (R, G, B)',
                span: 6,
                placeholder: '246, 36, 64',
                metadata: { require: true, pattern: '^\\d{1,3},\\s*\\d{1,3},\\s*\\d{1,3}$' },
            },
            shadow: {
                type: 'text-short',
                label: 'Shadow (R, G, B)',
                span: 6,
                placeholder: '200, 180, 150',
                metadata: { require: true, pattern: '^\\d{1,3},\\s*\\d{1,3},\\s*\\d{1,3}$' },
            },
        },
    },
}

const fileInputRef = ref<HTMLInputElement | null>(null)

const settingsThemes = computed<SettingsTheme[]>(() =>
    themeStore.availableThemes.map((t) => ({
        ...t,
        swatches: themePreviewColors(t.id),
    })),
)

function themePreviewColors(id: string): string[] {
    const colors = themeStore.getThemePreview(id)
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
    appearanceStore.load()
    await themeStore.load()
    await providerStore.fetchProviders()
    await providerStore.fetchDefaultProvider()
})

async function handleAddProvider() {
    await dialog.spawn({
        title: 'Add provider',
        schema: providerFormSchema,
        confirmLabel: 'Create',
        submit: async (data: DynamicGridDataOutput) => {
            const row = data.row!
            await providerStore.createProvider({
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
            await providerStore.updateProvider(provider.id, {
                name: String(row.name ?? ''),
                type: String(row.type ?? 'openai') as ProviderDto['type'],
                apiKey: row.apiKey ? String(row.apiKey) : undefined,
                baseURL: row.baseURL ? String(row.baseURL) : undefined,
            })
        },
    })
}

async function handleDeleteProvider(id: string) {
    await providerStore.deleteProvider(id)
}

async function handleAddModel(providerId: string) {
    await dialog.spawn({
        title: 'New model',
        schema: modelFormSchema,
        confirmLabel: 'Create',
        submit: async (data: DynamicGridDataOutput) => {
            const row = data.row!
            await providerStore.createModel(providerId, {
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
    await providerStore.updateModel(providerId, modelId, {
        modelId: data.modelId,
        displayName: data.displayName,
    })
}

async function handleDeleteModel(providerId: string, modelId: string) {
    await providerStore.deleteModel(providerId, modelId)
}

async function handleSetDefault(providerId: string, modelId: string) {
    await providerStore.setDefaultProvider(providerId, modelId)
}

function handleUpdatePreset(preset: string) {
    appearanceStore.setPreset(preset)
}

function handleUpdateFontSize(size: number) {
    appearanceStore.fontSize = size
}

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
            themeStore.addCustomTheme(theme)
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
            const schema = themeStore.importTheme(parsed)
            themeStore.addCustomTheme(schema)
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Invalid theme file')
        }
    }
    reader.readAsText(file)
    input.value = ''
}

function handleExportTheme(id: string) {
    const schema = themeStore.exportTheme(id)
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
    await themeStore.removeCustomTheme(id)
}

function handleSetActiveTheme(id: string) {
    themeStore.setTheme(id)
}
</script>

<template>
    <div class="app-shell">
        <AppTitle />
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
                            :providers="providerStore.providers"
                            :loading="providerStore.loading"
                            :error="providerStore.error"
                            :default-provider-id="providerStore.defaultProviderId"
                            :default-model-id="providerStore.defaultModelId"
                            :preset="appearanceStore.preset"
                            :font-size="appearanceStore.fontSize"
                            :themes="settingsThemes"
                            :active-theme-id="themeStore.activeThemeId"
                            :presets="appearanceStore.PRESETS"
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
