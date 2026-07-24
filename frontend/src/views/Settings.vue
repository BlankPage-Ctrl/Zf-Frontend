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
import { ContainerGrid, type ContainerSchema } from '@/components/container'
import { useProviderStore } from '@/stores/provider'
import { useAppearanceStore } from '@/stores/appearance'
import { useThemeStore } from '@/stores/theme'
import type { ThemeSchema } from '@/stores/theme'
import type { DialogGridSchema } from '@/components/dialog/types'
import { useDialog } from '@/composables/useDialog'
import type { Provider, ProviderDto, Model } from '@/services/provider'

const DownloadIcon = () => h(Download, { width: 14, height: 14 })
const PlusIcon = () => h(Plus, { width: 14, height: 14 })
const EditIcon = () => h(EditPencil, { width: 14, height: 14 })
const TrashIcon = () => h(Trash, { width: 14, height: 14 })
const StarIcon = () => h(Star, { width: 14, height: 14 })
const ChevronIcon = () => h(NavArrowRight, { width: 14, height: 14 })

const store = useProviderStore()
const appearance = useAppearanceStore()
const theme = useThemeStore()
const dialog = useDialog()

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

// --- Container schema ---
const settingsSchema = ref<ContainerSchema[]>([
    {
        id: 'row-1',
        height: '1fr',
        columns: [
            {
                id: 'sidebar',
                width: 200,
                cell: {
                    padding: 0,
                    background: 'rgb(var(--bg-secondary))',
                    borderColor: 'rgba(var(--border-color), 0.2)',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    radius: 0,
                },
            },
            {
                id: 'content',
                width: '1fr',
                cell: {
                    padding: '32px 40px 64px',
                    background: 'rgb(var(--bg-primary))',
                },
            },
        ],
    },
])

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

function openThemeCreate() {
    dialog.spawn({
        title: 'New Theme',
        schema: themeFormSchema,
        confirmLabel: 'Create',
        submit: async (data) => {
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
            theme.addCustomTheme(schema)
        },
    })
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

function openProviderCreate() {
    dialog.spawn({
        title: 'New provider',
        schema: providerFormSchema,
        confirmLabel: 'Create',
        submit: async (data) => {
            const row = data.row!
            const providerType: ProviderDto['type'] =
                row.type === 'openai' || row.type === 'openai-compatible' ? row.type : 'openai'
            await store.createProvider({
                name: String(row.name ?? ''),
                type: providerType,
                apiKey: row.apiKey ? String(row.apiKey) : undefined,
                baseURL: row.baseURL ? String(row.baseURL) : undefined,
            })
        },
    })
}

function openProviderEdit(p: Provider) {
    dialog.spawn({
        title: 'Edit provider',
        schema: providerFormSchema,
        initialData: {
            row: {
                name: p.name,
                type: p.type,
                apiKey: '',
                baseURL: p.baseURL ?? '',
            },
        },
        confirmLabel: 'Save',
        submit: async (data) => {
            const row = data.row!
            const providerType: ProviderDto['type'] =
                row.type === 'openai' || row.type === 'openai-compatible' ? row.type : 'openai'
            await store.updateProvider(p.id, {
                name: String(row.name ?? ''),
                type: providerType,
                apiKey: row.apiKey ? String(row.apiKey) : undefined,
                baseURL: row.baseURL ? String(row.baseURL) : undefined,
            })
        },
    })
}

// --- Provider delete ---
function confirmDeleteProvider(p: Provider) {
    dialog.spawn({
        title: 'Delete provider',
        message: `Delete "${p.name}" and all its models?`,
        confirmLabel: 'Delete',
        confirmVariant: 'danger',
        submit: async () => {
            await store.deleteProvider(p.id)
        },
    })
}

// --- Model form ---
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

function openModelCreate(providerId: string) {
    dialog.spawn({
        title: 'New model',
        schema: modelFormSchema,
        confirmLabel: 'Create',
        submit: async (data) => {
            const row = data.row!
            await store.createModel(providerId, {
                modelId: String(row.modelId ?? ''),
                displayName: row.displayName ? String(row.displayName) : undefined,
            })
        },
    })
}

function openModelEdit(providerId: string, m: Model) {
    dialog.spawn({
        title: 'Edit model',
        schema: modelFormSchema,
        initialData: {
            row: {
                modelId: m.modelId,
                displayName: m.displayName ?? '',
            },
        },
        confirmLabel: 'Save',
        submit: async (data) => {
            const row = data.row!
            await store.updateModel(providerId, m.id, {
                modelId: String(row.modelId ?? ''),
                displayName: row.displayName ? String(row.displayName) : undefined,
            })
        },
    })
}

// --- Model delete ---
function confirmDeleteModel(providerId: string, m: Model) {
    dialog.spawn({
        title: 'Delete model',
        message: `Delete "${m.displayName || m.modelId}"?`,
        confirmLabel: 'Delete',
        confirmVariant: 'danger',
        submit: async () => {
            await store.deleteModel(providerId, m.id)
        },
    })
}

// --- Set default provider ---
function openSetDefault(p: Provider, m: Model) {
    dialog.spawn({
        title: 'Set default model',
        message: `Set "${m.displayName || m.modelId}" from ${p.name} as the default model for new chats?`,
        confirmLabel: 'Set default',
        submit: async () => {
            await store.setDefaultProvider(p.id, m.id)
        },
    })
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
    <div style="height: 100%">
        <ContainerGrid :schema="settingsSchema">
            <!-- SIDEBAR NAV -->
            <template #sidebar>
                <nav class="settings-sidebar">
                    <Header :schema="sidebarHeaderSchema" />
                    <AppList :schema="sidebarListSchema" :items="sidebarItems" />
                </nav>
            </template>

            <!-- CONTENT -->
            <template #content>
                <div class="settings-content">
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
                </div>
            </template>
        </ContainerGrid>


    </div>
</template>

<style scoped>
/* --- Sidebar --- */
.settings-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.settings-sidebar .dl-item--active {
    background: rgba(var(--border-color), 0.15);
    box-shadow: inset 3px 0 0 rgb(var(--border-color));
}

/* --- Content --- */
.settings-content {
    max-width: 720px;
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
