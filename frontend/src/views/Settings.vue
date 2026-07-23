<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, onMounted, h, type Component } from 'vue'
import {
    Album,
    Download,
    EditPencil,
    NavArrowRight,
    Palette,
    Plus,
    Star,
    Trash,
} from '@iconoir/vue'
import { pButton } from '@/components/button'
import { Header } from '@/components/header'
import type { HeaderSchema } from '@/components/header'
import { AppList } from '@/components/list'
import type { ListSchema } from '@/components/list'
import { useProviderStore } from '@/stores/provider'
import { useAppearanceStore } from '@/stores/appearance'
import { useThemeStore } from '@/stores/theme'
import type { ThemeSchema } from '@/stores/theme'
import DialogGrid from '@/components/dialog/GridDialog.vue'
import type { DialogGridSchema, DynamicGridDataOutput } from '@/components/dialog/types'
import type { Provider, ProviderDto, Model, ModelDto } from '@/services/provider'

const DownloadIcon = () => h(Download, { width: 14, height: 14 })
const PlusIcon = () => h(Plus, { width: 14, height: 14 })
const EditIcon = () => h(EditPencil, { width: 14, height: 14 })
const TrashIcon = () => h(Trash, { width: 14, height: 14 })
const StarIcon = () => h(Star, { width: 14, height: 14 })
const ChevronIcon = () => h(NavArrowRight, { width: 14, height: 14 })

const store = useProviderStore()
const appearance = useAppearanceStore()
const theme = useThemeStore()

// --- Sidebar nav ---
const activeSection = ref('model-provider')

function scrollToSection(id: string) {
    activeSection.value = id
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

interface SidebarItem {
    [key: string]: unknown
    id: string
    label: string
}

const sidebarItems: SidebarItem[] = [
    { id: 'model-provider', label: 'Model and Provider' },
    { id: 'appearance', label: 'Appearance' },
]

const sidebarIconMap: Record<string, Component> = {
    'model-provider': () => h(Album, { width: 14, height: 14 }),
    appearance: () => h(Palette, { width: 14, height: 14 }),
}

const sidebarListSchema = computed<ListSchema<SidebarItem>>(() => ({
    variant: 'sidebar',
    size: 'xs',
    activeKey: 'id',
    activeId: activeSection.value,
    fields: [{ key: 'label', class: 'title' }],
    icon: (item) => sidebarIconMap[item.id]!,
    onSelect: (item) => scrollToSection(item.id),
}))

// --- Header schemas ---
const sidebarHeaderSchema = computed<HeaderSchema>(() => ({
    title: 'Settings',
    height: 'md',
    padding: 'md',
}))

const providerSectionHeaderSchema = computed<HeaderSchema>(() => ({
    title: 'Model and Provider',
    subtitle: 'Manage your AI providers and models. Set a default model for new chats.',
    height: 'auto',
    padding: 'none',
    actions: [
        {
            icon: Plus,
            ariaLabel: 'Add provider',
            label: 'Add provider',
            onClick: openProviderCreate,
        },
    ],
}))

const appearanceSectionHeaderSchema = computed<HeaderSchema>(() => ({
    title: 'Appearance & Theme',
    subtitle: 'Adjust markdown rendering, size, spacing, and manage themes.',
    height: 'auto',
    padding: 'none',
}))

// --- Theme form ---
const showThemeDialog = ref(false)
const themeFormLoading = ref(false)
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

const themeInitialData = ref<DynamicGridDataOutput | undefined>(undefined)

function openThemeCreate() {
    themeInitialData.value = undefined
    showThemeDialog.value = true
}

function cancelThemeForm() {
    showThemeDialog.value = false
    themeInitialData.value = undefined
}

async function submitThemeForm(data: DynamicGridDataOutput) {
    const row = data.row!
    const schema: ThemeSchema = {
        id: String(row.name ?? '')
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '_'),
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
    themeFormLoading.value = true
    try {
        theme.addCustomTheme(schema)
        showThemeDialog.value = false
    } catch (e) {
        alert(e instanceof Error ? e.message : 'Failed to save theme')
    } finally {
        themeFormLoading.value = false
    }
}

// --- Theme import ---
const fileInput = ref<HTMLInputElement | null>(null)

function triggerImport() {
    fileInput.value?.click()
}

function handleFileImport(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result as string)
            const schema = theme.importTheme(data)
            theme.addCustomTheme(schema)
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Invalid theme file')
        }
    }
    reader.readAsText(file)
    input.value = '' // reset so same file can be re-imported
}

// --- Theme export ---
function exportTheme(id: string) {
    const schema = theme.exportTheme(id)
    if (!schema) return
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${schema.id}-theme.json`
    a.click()
    URL.revokeObjectURL(url)
}

// --- Theme helpers ---
function isThemeActive(id: string): boolean {
    return theme.activeThemeId === id
}

function themePreviewColors(id: string) {
    const colors = theme.getThemePreview(id)
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

// --- Provider form ---
const showProviderDialog = ref(false)
const editingProvider = ref<Provider | null>(null)
const providerFormLoading = ref(false)

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

const providerInitialData = ref<DynamicGridDataOutput | undefined>(undefined)

function openProviderCreate() {
    editingProvider.value = null
    providerInitialData.value = undefined
    showProviderDialog.value = true
}

function openProviderEdit(p: Provider) {
    editingProvider.value = p
    providerInitialData.value = {
        row: {
            name: p.name,
            type: p.type,
            apiKey: '',
            baseURL: p.baseURL ?? '',
        },
    }
    showProviderDialog.value = true
}

function cancelProviderForm() {
    showProviderDialog.value = false
    editingProvider.value = null
    providerInitialData.value = undefined
}

async function submitProviderForm(data: DynamicGridDataOutput) {
    const row = data.row!
    const providerType: ProviderDto['type'] =
        row.type === 'openai' || row.type === 'openai-compatible' ? row.type : 'openai'
    const dto: ProviderDto = {
        name: String(row.name ?? ''),
        type: providerType,
        apiKey: row.apiKey ? String(row.apiKey) : undefined,
        baseURL: row.baseURL ? String(row.baseURL) : undefined,
    }
    providerFormLoading.value = true
    try {
        if (editingProvider.value) {
            await store.updateProvider(editingProvider.value.id, dto)
        } else {
            await store.createProvider(dto)
        }
        showProviderDialog.value = false
        editingProvider.value = null
        providerInitialData.value = undefined
    } catch {
        /* handled by store */
    } finally {
        providerFormLoading.value = false
    }
}

// --- Provider delete ---
const showProviderDeleteDialog = ref(false)
const deletingProvider = ref<Provider | null>(null)

function confirmDeleteProvider(p: Provider) {
    deletingProvider.value = p
    showProviderDeleteDialog.value = true
}

async function executeDeleteProvider() {
    if (!deletingProvider.value) return
    await store.deleteProvider(deletingProvider.value.id)
    showProviderDeleteDialog.value = false
    deletingProvider.value = null
}

function cancelProviderDelete() {
    showProviderDeleteDialog.value = false
    deletingProvider.value = null
}

// --- Model form ---
const showModelDialog = ref(false)
const editingModel = ref<Model | null>(null)
const modelFormLoading = ref(false)
const modelProviderId = ref('')

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

const modelInitialData = ref<DynamicGridDataOutput | undefined>(undefined)

function openModelCreate(providerId: string) {
    editingModel.value = null
    modelProviderId.value = providerId
    modelInitialData.value = undefined
    showModelDialog.value = true
}

function openModelEdit(providerId: string, m: Model) {
    editingModel.value = m
    modelProviderId.value = providerId
    modelInitialData.value = {
        row: {
            modelId: m.modelId,
            displayName: m.displayName ?? '',
        },
    }
    showModelDialog.value = true
}

function cancelModelForm() {
    showModelDialog.value = false
    editingModel.value = null
    modelProviderId.value = ''
    modelInitialData.value = undefined
}

async function submitModelForm(data: DynamicGridDataOutput) {
    const row = data.row!
    const dto: ModelDto = {
        modelId: String(row.modelId ?? ''),
        displayName: row.displayName ? String(row.displayName) : undefined,
    }
    modelFormLoading.value = true
    try {
        if (editingModel.value) {
            await store.updateModel(modelProviderId.value, editingModel.value.id, dto)
        } else {
            await store.createModel(modelProviderId.value, dto)
        }
        showModelDialog.value = false
        editingModel.value = null
        modelProviderId.value = ''
        modelInitialData.value = undefined
    } catch {
        /* handled by store */
    } finally {
        modelFormLoading.value = false
    }
}

// --- Model delete ---
const showModelDeleteDialog = ref(false)
const deletingModel = ref<Model | null>(null)
const deletingModelProviderId = ref('')

function confirmDeleteModel(providerId: string, m: Model) {
    deletingModel.value = m
    deletingModelProviderId.value = providerId
    showModelDeleteDialog.value = true
}

async function executeDeleteModel() {
    if (!deletingModel.value || !deletingModelProviderId.value) return
    await store.deleteModel(deletingModelProviderId.value, deletingModel.value.id)
    showModelDeleteDialog.value = false
    deletingModel.value = null
    deletingModelProviderId.value = ''
}

function cancelModelDelete() {
    showModelDeleteDialog.value = false
    deletingModel.value = null
    deletingModelProviderId.value = ''
}

// --- Set default provider ---
const showSetDefaultDialog = ref(false)
const settingDefaultProvider = ref<Provider | null>(null)
const settingDefaultModel = ref<Model | null>(null)

function openSetDefault(p: Provider, m: Model) {
    settingDefaultProvider.value = p
    settingDefaultModel.value = m
    showSetDefaultDialog.value = true
}

async function executeSetDefault() {
    if (!settingDefaultProvider.value || !settingDefaultModel.value) return
    await store.setDefaultProvider(settingDefaultProvider.value.id, settingDefaultModel.value.id)
    showSetDefaultDialog.value = false
    settingDefaultProvider.value = null
    settingDefaultModel.value = null
}

function cancelSetDefault() {
    showSetDefaultDialog.value = false
    settingDefaultProvider.value = null
    settingDefaultModel.value = null
}

// --- Helpers ---
const expandedProviderIds = ref<Set<string>>(new Set(store.providers.map((p) => p.id)))

function toggleProviderExpand(providerId: string) {
    const next = new Set(expandedProviderIds.value)
    if (next.has(providerId)) {
        next.delete(providerId)
    } else {
        next.add(providerId)
    }
    expandedProviderIds.value = next
}

function isProviderExpanded(providerId: string): boolean {
    return expandedProviderIds.value.has(providerId)
}

function isDefault(p: Provider, m: Model): boolean {
    return store.defaultProviderId === p.id && store.defaultModelId === m.id
}

function maskKey(key?: string): string {
    if (!key) return ''
    if (key.length <= 8) return '***'
    return '***' + key.slice(-4)
}

onMounted(() => {
    store.fetchProviders()
    store.fetchDefaultProvider()
    theme.load()
})
</script>

<template>
    <div class="settings-page">
        <!-- SIDEBAR NAV -->
        <nav class="settings-sidebar">
            <Header :schema="sidebarHeaderSchema" />
            <AppList :schema="sidebarListSchema" :items="sidebarItems" />
        </nav>

        <!-- CONTENT -->
        <main class="settings-content">
            <!-- Model & Provider Section -->
            <section id="model-provider" class="settings-section">
                <Header :schema="providerSectionHeaderSchema" class="section-header" />

                <!-- Loading -->
                <div v-if="store.loading && !store.providers.length" class="section-empty">
                    <span class="text-muted">Loading...</span>
                </div>

                <!-- Error -->
                <div v-else-if="store.error && !store.providers.length" class="section-empty">
                    <span class="text-muted">{{ store.error }}</span>
                    <pButton
                        :schema="{ preset: 'ghost', size: 'sm', label: 'Retry' }"
                        @click="store.fetchProviders()"
                    />
                </div>

                <!-- Empty state -->
                <div v-else-if="!store.providers.length" class="section-empty">
                    <div class="empty-icon">
                        <Album width="32" height="32" style="opacity: 0.3" />
                    </div>
                    <span class="empty-text">No providers yet</span>
                    <pButton
                        :schema="{ preset: 'ghost', size: 'sm', label: 'Add your first provider' }"
                        @click="openProviderCreate"
                    />
                </div>

                <!-- Provider list -->
                <div v-else class="provider-list">
                    <div
                        v-for="provider in store.providers"
                        :key="provider.id"
                        class="provider-card"
                    >
                        <div class="provider-card-header">
                            <pButton
                                :schema="{
                                    preset: 'icon-only',
                                    size: 'xs',
                                    icon: ChevronIcon,
                                    ariaExpanded: isProviderExpanded(provider.id),
                                    ariaLabel: 'Toggle expand',
                                }"
                                @click="toggleProviderExpand(provider.id)"
                            />

                            <div class="provider-info">
                                <span class="provider-name">{{ provider.name }}</span>
                                <span class="provider-type-badge">{{ provider.type }}</span>
                                <span v-if="provider.apiKey" class="provider-key">{{
                                    maskKey(provider.apiKey)
                                }}</span>
                                <span v-if="provider.baseURL" class="provider-url">{{
                                    provider.baseURL
                                }}</span>
                            </div>

                            <div class="provider-actions">
                                <pButton
                                    :schema="{
                                        variant: 'ghost',
                                        size: 'xs',
                                        icon: PlusIcon,
                                        iconPosition: 'only',
                                        ariaLabel: 'Add model',
                                    }"
                                    @click="openModelCreate(provider.id)"
                                />
                                <pButton
                                    :schema="{
                                        variant: 'ghost',
                                        size: 'xs',
                                        icon: EditIcon,
                                        iconPosition: 'only',
                                        ariaLabel: 'Edit',
                                    }"
                                    @click="openProviderEdit(provider)"
                                />
                                <pButton
                                    :schema="{
                                        preset: 'danger',
                                        size: 'xs',
                                        icon: TrashIcon,
                                        overrides: { variant: 'ghost', iconPosition: 'only' },
                                        ariaLabel: 'Delete',
                                    }"
                                    @click="confirmDeleteProvider(provider)"
                                />
                            </div>
                        </div>

                        <div v-if="isProviderExpanded(provider.id)" class="provider-models">
                            <div v-if="!provider.models.length" class="model-empty">
                                No models yet
                            </div>
                            <div v-for="model in provider.models" :key="model.id" class="model-row">
                                <div class="model-info">
                                    <span class="model-name">{{
                                        model.displayName || model.modelId
                                    }}</span>
                                    <span v-if="model.displayName" class="model-id">{{
                                        model.modelId
                                    }}</span>
                                    <span v-if="isDefault(provider, model)" class="default-badge"
                                        >Default</span
                                    >
                                </div>
                                <div class="model-actions">
                                    <pButton
                                        v-if="!isDefault(provider, model)"
                                        :schema="{
                                            variant: 'ghost',
                                            size: 'xs',
                                            icon: StarIcon,
                                            iconPosition: 'only',
                                            ariaLabel: 'Set as default',
                                        }"
                                        @click="openSetDefault(provider, model)"
                                    />
                                    <pButton
                                        :schema="{
                                            variant: 'ghost',
                                            size: 'xs',
                                            icon: EditIcon,
                                            iconPosition: 'only',
                                            ariaLabel: 'Edit',
                                        }"
                                        @click="openModelEdit(provider.id, model)"
                                    />
                                    <pButton
                                        :schema="{
                                            preset: 'danger',
                                            size: 'xs',
                                            icon: TrashIcon,
                                            overrides: { variant: 'ghost', iconPosition: 'only' },
                                            ariaLabel: 'Delete',
                                        }"
                                        @click="confirmDeleteModel(provider.id, model)"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Appearance & Theme Section -->
            <section id="appearance" class="settings-section section-appearance">
                <Header :schema="appearanceSectionHeaderSchema" class="section-header" />

                <div class="appearance-card">
                    <div class="appearance-row">
                        <label class="appearance-label">Preset</label>
                        <div class="preset-group">
                            <pButton
                                v-for="p in appearance.PRESETS"
                                :key="p.label"
                                :schema="{
                                    variant: 'ghost',
                                    size: 'sm',
                                    label: p.label,
                                    ariaPressed: appearance.preset === p.label,
                                }"
                                @click="appearance.setPreset(p.label)"
                            />
                            <span
                                class="preset-custom-tag"
                                :class="{ active: appearance.preset === 'Custom' }"
                                >Custom</span
                            >
                        </div>
                    </div>

                    <div class="appearance-row">
                        <label class="appearance-label">
                            Scale
                            <span class="scale-value">{{ appearance.fontSize }}px</span>
                        </label>
                        <input
                            type="range"
                            class="appearance-slider"
                            min="12"
                            max="20"
                            step="1"
                            :value="appearance.fontSize"
                            @input="
                                appearance.fontSize = Number(
                                    ($event.target as HTMLInputElement).value,
                                )
                            "
                        />
                        <div class="slider-labels">
                            <span>Smaller</span>
                            <span>Larger</span>
                        </div>
                    </div>

                    <div class="appearance-info">
                        <div class="info-item">
                            <span class="info-label">Font size</span>
                            <span class="info-value">{{ appearance.fontSize }}px</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Line height</span>
                            <span class="info-value">{{ appearance.lineHeight.toFixed(2) }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Content width</span>
                            <span class="info-value">{{ appearance.contentWidth }}px</span>
                        </div>
                    </div>
                </div>

                <div class="theme-grid">
                    <div
                        v-for="t in theme.availableThemes"
                        :key="t.id"
                        class="theme-card"
                        :class="{ active: isThemeActive(t.id) }"
                        @click="theme.setTheme(t.id)"
                    >
                        <div class="theme-swatches">
                            <span
                                v-for="(color, ci) in themePreviewColors(t.id)"
                                :key="ci"
                                class="theme-swatch"
                                :style="{ background: color }"
                            />
                        </div>
                        <div class="theme-card-body">
                            <span class="theme-name">{{ t.name }}</span>
                            <span class="theme-desc">{{ t.description }}</span>
                        </div>
                        <div class="theme-card-actions">
                            <pButton
                                v-if="isThemeActive(t.id)"
                                :schema="{
                                    preset: 'ghost',
                                    size: 'xs',
                                    label: 'Active',
                                    overrides: { variant: 'ghost' },
                                }"
                            />
                            <pButton
                                :schema="{
                                    variant: 'ghost',
                                    size: 'xs',
                                    icon: DownloadIcon,
                                    iconPosition: 'only',
                                    ariaLabel: 'Export theme',
                                }"
                                @click.stop="exportTheme(t.id)"
                            />
                            <pButton
                                v-if="!t.builtIn"
                                :schema="{
                                    preset: 'danger',
                                    size: 'xs',
                                    icon: TrashIcon,
                                    overrides: { variant: 'ghost', iconPosition: 'only' },
                                    ariaLabel: 'Delete theme',
                                }"
                                @click.stop="theme.removeCustomTheme(t.id)"
                            />
                        </div>
                    </div>
                </div>

                <div class="theme-actions-row">
                    <pButton
                        :schema="{
                            variant: 'ghost',
                            size: 'sm',
                            icon: PlusIcon,
                            label: 'Add Theme',
                        }"
                        @click="openThemeCreate"
                    />
                    <pButton
                        :schema="{
                            variant: 'ghost',
                            size: 'sm',
                            icon: DownloadIcon,
                            label: 'Import',
                        }"
                        @click="triggerImport"
                    />
                    <input
                        ref="fileInput"
                        type="file"
                        accept=".json"
                        style="display: none"
                        @change="handleFileImport"
                    />
                </div>
            </section>
        </main>

        <!-- Theme Form Dialog -->
        <DialogGrid
            v-model="showThemeDialog"
            :schema="themeFormSchema"
            title="New Theme"
            confirm-label="Create"
            :initial-data="themeInitialData"
            :loading="themeFormLoading"
            width="md"
            @submit="submitThemeForm"
            @cancel="cancelThemeForm"
        />

        <!-- Provider Form Dialog -->
        <DialogGrid
            v-model="showProviderDialog"
            :schema="providerFormSchema"
            :title="editingProvider ? 'Edit provider' : 'New provider'"
            :confirm-label="editingProvider ? 'Save' : 'Create'"
            :initial-data="providerInitialData"
            :loading="providerFormLoading"
            width="md"
            @submit="submitProviderForm"
            @cancel="cancelProviderForm"
        />

        <!-- Provider Delete Dialog -->
        <DialogGrid
            v-model="showProviderDeleteDialog"
            title="Delete provider"
            confirm-label="Delete"
            confirm-variant="danger"
            @submit="executeDeleteProvider"
            @cancel="cancelProviderDelete"
        >
            <span class="confirm-message">
                Delete "{{ deletingProvider?.name }}" and all its models?
            </span>
        </DialogGrid>

        <!-- Model Form Dialog -->
        <DialogGrid
            v-model="showModelDialog"
            :schema="modelFormSchema"
            :title="editingModel ? 'Edit model' : 'New model'"
            :confirm-label="editingModel ? 'Save' : 'Create'"
            :initial-data="modelInitialData"
            :loading="modelFormLoading"
            width="md"
            @submit="submitModelForm"
            @cancel="cancelModelForm"
        />

        <!-- Model Delete Dialog -->
        <DialogGrid
            v-model="showModelDeleteDialog"
            title="Delete model"
            confirm-label="Delete"
            confirm-variant="danger"
            @submit="executeDeleteModel"
            @cancel="cancelModelDelete"
        >
            <span class="confirm-message">
                Delete "{{ deletingModel?.displayName || deletingModel?.modelId }}"?
            </span>
        </DialogGrid>

        <!-- Set Default Dialog -->
        <DialogGrid
            v-model="showSetDefaultDialog"
            title="Set default model"
            confirm-label="Set default"
            @submit="executeSetDefault"
            @cancel="cancelSetDefault"
        >
            <span class="confirm-message">
                Set "{{ settingDefaultModel?.displayName || settingDefaultModel?.modelId }}" from
                {{ settingDefaultProvider?.name }} as the default model for new chats?
            </span>
        </DialogGrid>
    </div>
</template>

<style scoped>
.settings-page {
    display: flex;
    height: 100%;
    overflow: hidden;
    background: rgb(var(--bg-primary));
}

/* --- Sidebar --- */
.settings-sidebar {
    width: 200px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: rgb(var(--bg-secondary));
    border-right: 1px solid rgba(var(--border-color), 0.2);
    overflow-y: auto;
}

.settings-sidebar .dl-item--active {
    background: rgba(var(--border-color), 0.15);
    box-shadow: inset 3px 0 0 rgb(var(--border-color));
}

/* --- Content --- */
.settings-content {
    flex: 1;
    overflow-y: auto;
    padding: 32px 40px 64px;
}

.settings-section {
    max-width: 720px;
}

.section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 24px;
}

/* --- Empty state --- */
.section-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 48px 16px;
}

.empty-icon {
    margin-bottom: 4px;
    color: rgb(var(--text-primary));
}

.empty-text {
    font-size: 13px;
    color: rgb(var(--text-primary));
    opacity: 0.5;
}

/* --- Provider list --- */
.provider-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.provider-card {
    border: 1px solid rgba(var(--border-color), 0.15);
    border-radius: 10px;
    overflow: hidden;
    background: rgb(var(--bg-secondary));
}

.provider-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
}

.provider-card-header .btn--icon-only .btn__icon {
    transition: transform 120ms ease;
}

.provider-card-header .btn--icon-only[aria-expanded='true'] .btn__icon {
    transform: rotate(90deg);
}

.provider-info {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
    flex-wrap: wrap;
}

.provider-name {
    font-family: var(--font-serif);
    font-size: 13px;
    font-weight: 600;
    color: rgb(var(--text-primary));
}

.provider-type-badge {
    font-size: 10px;
    font-weight: 500;
    padding: 2px 7px;
    border-radius: 9999px;
    background: rgba(var(--border-color), 0.15);
    color: rgb(var(--text-primary));
    opacity: 0.6;
    white-space: nowrap;
}

.provider-key {
    font-size: 11px;
    font-family: var(--font-serif);
    color: rgb(var(--text-primary));
    opacity: 0.35;
}

.provider-url {
    font-size: 11px;
    font-family: var(--font-serif);
    color: rgb(var(--text-primary));
    opacity: 0.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 240px;
}

.provider-actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
}

/* --- Provider models --- */
.provider-models {
    padding: 0 12px 10px;
    border-top: 1px solid rgba(var(--border-color), 0.1);
}

.model-empty {
    padding: 10px 0 4px;
    font-size: 12px;
    color: rgb(var(--text-primary));
    opacity: 0.4;
}

.model-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0;
    position: relative;
}

.model-row:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    right: 0;
    height: 1px;
    background: rgba(var(--border-color), 0.08);
}

.model-info {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.model-name {
    font-size: 12px;
    font-weight: 500;
    color: rgb(var(--text-primary));
}

.model-id {
    font-size: 11px;
    font-family: var(--font-serif);
    color: rgb(var(--text-primary));
    opacity: 0.35;
}

.default-badge {
    font-size: 10px;
    font-weight: 500;
    padding: 1px 6px;
    border-radius: 9999px;
    background: rgba(var(--color-success), 0.12);
    color: rgb(var(--color-success));
    white-space: nowrap;
}

.model-actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 100ms ease;
}

.model-row:hover .model-actions {
    opacity: 1;
}

/* --- Sidebar nav active state --- */
/* --- Appearance --- */
.section-appearance {
    margin-top: 48px;
}

.appearance-card {
    border: 1px solid rgba(var(--border-color), 0.15);
    border-radius: 10px;
    background: rgb(var(--bg-secondary));
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.appearance-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.appearance-label {
    font-size: 12px;
    font-weight: 500;
    color: rgb(var(--text-primary));
    display: flex;
    align-items: center;
    gap: 8px;
}

.scale-value {
    font-family: var(--font-serif);
    font-size: 11px;
    opacity: 0.5;
    font-weight: 400;
}

.preset-group {
    display: flex;
    gap: 6px;
    align-items: center;
}

.preset-group .btn--ghost {
    opacity: 0.5;
}

.preset-group .btn--ghost[aria-pressed='true'] {
    opacity: 1;
    background: rgba(var(--border-color), 0.15);
}

.preset-custom-tag {
    font-size: 11px;
    font-weight: 500;
    padding: 3px 10px;
    border-radius: 9999px;
    background: rgba(var(--border-color), 0.08);
    color: rgb(var(--text-primary));
    opacity: 0.35;
    transition: opacity 100ms ease;
}

.preset-custom-tag.active {
    opacity: 0.8;
    background: rgba(var(--border-color), 0.15);
}

.appearance-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: rgba(var(--border-color), 0.2);
    outline: none;
    cursor: pointer;
}

.appearance-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgb(var(--border-color));
    cursor: pointer;
    border: 2px solid rgb(var(--bg-secondary));
    transition: transform 100ms ease;
}

.appearance-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
}

.appearance-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgb(var(--border-color));
    cursor: pointer;
    border: 2px solid rgb(var(--bg-secondary));
}

.slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: rgb(var(--text-primary));
    opacity: 0.3;
}

.appearance-info {
    display: flex;
    gap: 24px;
    padding-top: 12px;
    border-top: 1px solid rgba(var(--border-color), 0.1);
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.info-label {
    font-size: 10px;
    font-weight: 500;
    color: rgb(var(--text-primary));
    opacity: 0.4;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.info-value {
    font-family: var(--font-serif);
    font-size: 14px;
    font-weight: 600;
    color: rgb(var(--text-primary));
}

/* --- Theme --- */
.theme-grid {
    margin-top: 32px;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.theme-card {
    width: 220px;
    border: 1px solid rgba(var(--border-color), 0.2);
    border-radius: 12px;
    background: rgb(var(--bg-secondary));
    padding: 20px;
    cursor: pointer;
    transition:
        border-color 150ms ease,
        box-shadow 150ms ease;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.theme-card:hover {
    border-color: rgba(var(--border-color), 0.5);
}

.theme-card.active {
    border-color: rgb(var(--border-color));
    box-shadow: 0 0 0 1.5px rgb(var(--border-color));
}

.theme-swatches {
    display: flex;
    gap: 8px;
}

.theme-swatch {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid rgba(var(--border-color), 0.25);
}

.theme-card-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
}

.theme-name {
    font-size: 15px;
    font-weight: 600;
    color: rgb(var(--text-primary));
}

.theme-desc {
    font-size: 12px;
    color: rgb(var(--text-primary));
    opacity: 0.5;
    line-height: 1.4;
}

.theme-card-actions {
    display: flex;
    gap: 6px;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid rgba(var(--border-color), 0.12);
}

.theme-actions-row {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    align-items: center;
}
</style>
