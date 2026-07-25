<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { Download, EditPencil, Plus, Star, Trash } from '@iconoir/vue'
import { pButton } from '@/components/button'
import { Header } from '@/components/header'
import { useProviderStore } from '@/stores/provider'
import { useAppearanceStore } from '@/stores/appearance'
import { useThemeStore } from '@/stores/theme'
import type { ThemeSchema } from '@/stores/theme'
import type { Provider, ProviderDto, Model } from '@/services/provider'

const DownloadIcon = () => h(Download, { width: 14, height: 14 })
const PlusIcon = () => h(Plus, { width: 14, height: 14 })
const EditIcon = () => h(EditPencil, { width: 14, height: 14 })
const TrashIcon = () => h(Trash, { width: 14, height: 14 })
const StarIcon = () => h(Star, { width: 14, height: 14 })

const emit = defineEmits<{
    'add-provider': [data: { name: string; type: ProviderDto['type']; apiKey?: string; baseURL?: string }]
    'edit-provider': [id: string, data: { name: string; type: ProviderDto['type']; apiKey?: string; baseURL?: string }]
    'delete-provider': [id: string]
    'add-model': [providerId: string]
    'edit-model': [providerId: string, modelId: string, data: { modelId: string; displayName?: string }]
    'delete-model': [providerId: string, modelId: string]
    'set-default': [providerId: string, modelId: string]
    'update-preset': [preset: string]
    'update-font-size': [size: number]
    'add-theme': [data: ThemeSchema]
    'import-theme': []
    'export-theme': [id: string]
    'remove-theme': [id: string]
    'set-active-theme': [id: string]
    'close': []
}>()

const store = useProviderStore()
const appearance = useAppearanceStore()
const theme = useThemeStore()

const expandedProviderIds = ref<Set<string>>(new Set())

function isProviderExpanded(providerId: string): boolean {
    return expandedProviderIds.value.has(providerId)
}
function toggleProviderExpand(providerId: string) {
    const next = new Set(expandedProviderIds.value)
    if (next.has(providerId)) {
        next.delete(providerId)
    } else {
        next.add(providerId)
    }
    expandedProviderIds.value = next
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

function handleProviderAdd(data: { name: string; type: ProviderDto['type']; apiKey?: string; baseURL?: string }) {
    emit('add-provider', data)
}
function handleProviderEdit(p: Provider) {
    emit('edit-provider', p.id, {
        name: p.name,
        type: p.type,
        apiKey: p.apiKey ?? '',
        baseURL: p.baseURL ?? '',
    })
}
function handleProviderDelete(p: Provider) {
    emit('delete-provider', p.id)
}
function handleModelAdd(providerId: string) {
    emit('add-model', providerId)
}
function handleModelEdit(providerId: string, m: Model) {
    emit('edit-model', providerId, m.id, {
        modelId: m.modelId,
        displayName: m.displayName ?? '',
    })
}
function handleModelDelete(providerId: string, m: Model) {
    emit('delete-model', providerId, m.id)
}
function handleSetDefault(provider: Provider, model: Model) {
    emit('set-default', provider.id, model.id)
}
function handlePresetSelect(preset: string) {
    emit('update-preset', preset)
}
function handleFontSizeChange(size: number) {
    emit('update-font-size', size)
}
function handleThemeAdd(data: ThemeSchema) {
    emit('add-theme', data)
}
function handleThemeImport() {
    emit('import-theme')
}
function handleThemeExport(id: string) {
    emit('export-theme', id)
}
function handleThemeRemove(id: string) {
    emit('remove-theme', id)
}
function handleThemeSetActive(id: string) {
    emit('set-active-theme', id)
}
function handleClose() {
    emit('close')
}

function isThemeActive(id: string): boolean {
    return theme.activeThemeId === id
}

function themePreviewColors(id: string): string[] {
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

function openThemeCreate() {
    emit('add-theme', {
        id: '',
        name: '',
        description: undefined,
        colors: {
            bgPrimary: '',
            bgSecondary: '',
            border: '',
            textPrimary: '',
            success: '',
            danger: '',
            shadow: '',
        },
    })
}
</script>

<template>
    <div class="settings-panel">
        <!-- Model & Provider Section -->
        <section class="settings-section">
            <Header :schema="{ title: 'Model and Provider', height: 'auto', padding: 'none', border: true }" />

            <!-- Loading -->
            <div v-if="store.loading && !store.providers.length" class="section-empty">
                <span class="text-muted">Loading...</span>
            </div>

            <!-- Error -->
            <div v-else-if="store.error && !store.providers.length" class="section-empty">
                <span class="text-muted">{{ store.error }}</span>
            </div>

            <!-- Empty state -->
            <div v-else-if="!store.providers.length" class="section-empty">
                <span class="empty-text">No providers yet</span>
            </div>

            <!-- Provider list -->
            <div v-else class="provider-list">
                <div v-for="provider in store.providers" :key="provider.id" class="provider-card">
                    <div class="provider-card-header">
                        <span class="provider-name">{{ provider.name }}</span>
                        <span class="provider-type-badge">{{ provider.type }}</span>
                        <span v-if="provider.apiKey" class="provider-key">{{ maskKey(provider.apiKey) }}</span>
                        <span v-if="provider.baseURL" class="provider-url">{{ provider.baseURL }}</span>
                        <div class="provider-actions">
                            <pButton
                                :schema="{ variant: 'ghost', size: 'xs', icon: PlusIcon, iconPosition: 'only', ariaLabel: 'Add model' }"
                                @click="handleModelAdd(provider.id)"
                            />
                            <pButton
                                :schema="{ variant: 'ghost', size: 'xs', icon: EditIcon, iconPosition: 'only', ariaLabel: 'Edit' }"
                                @click="handleProviderEdit(provider)"
                            />
                            <pButton
                                :schema="{ preset: 'danger', size: 'xs', icon: TrashIcon, overrides: { variant: 'ghost', iconPosition: 'only' }, ariaLabel: 'Delete' }"
                                @click="handleProviderDelete(provider)"
                            />
                        </div>
                    </div>

                    <div v-if="isProviderExpanded(provider.id)" class="provider-models">
                        <div v-if="!provider.models.length" class="model-empty">No models yet</div>
                        <div v-for="model in provider.models" :key="model.id" class="model-row">
                            <div class="model-info">
                                <span class="model-name">{{ model.displayName || model.modelId }}</span>
                                <span v-if="model.displayName" class="model-id">{{ model.modelId }}</span>
                                <span v-if="isDefault(provider, model)" class="default-badge">Default</span>
                            </div>
                            <div class="model-actions">
                                <pButton
                                    v-if="!isDefault(provider, model)"
                                    :schema="{ variant: 'ghost', size: 'xs', icon: StarIcon, iconPosition: 'only', ariaLabel: 'Set as default' }"
                                    @click="handleSetDefault(provider, model)"
                                />
                                <pButton
                                    :schema="{ variant: 'ghost', size: 'xs', icon: EditIcon, iconPosition: 'only', ariaLabel: 'Edit' }"
                                    @click="handleModelEdit(provider.id, model)"
                                />
                                <pButton
                                    :schema="{ preset: 'danger', size: 'xs', icon: TrashIcon, overrides: { variant: 'ghost', iconPosition: 'only' }, ariaLabel: 'Delete' }"
                                    @click="handleModelDelete(provider.id, model)"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="store.providers.length" class="section-footer">
                <pButton
                    :schema="{ variant: 'ghost', size: 'sm', icon: PlusIcon, label: 'Add provider' }"
                    @click="handleProviderAdd({ name: '', type: 'openai', apiKey: '', baseURL: '' })"
                />
            </div>
        </section>

        <!-- Appearance & Theme Section -->
        <section class="settings-section section-appearance">
            <Header :schema="{ title: 'Appearance & Theme', height: 'auto', padding: 'none', border: true }" />

            <div class="appearance-card">
                <div class="appearance-row">
                    <label class="appearance-label">Preset</label>
                    <div class="preset-group">
                        <pButton
                            v-for="p in appearance.PRESETS"
                            :key="p.label"
                            :schema="{ variant: 'ghost', size: 'sm', label: p.label, ariaPressed: appearance.preset === p.label }"
                            @click="handlePresetSelect(p.label)"
                        />
                        <span
                            class="preset-custom-tag"
                            :class="{ active: appearance.preset === 'Custom' }"
                        >Custom</span>
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
                        @input="handleFontSizeChange(Number(($event.target as HTMLInputElement).value))"
                    />
                </div>
            </div>

            <div class="theme-grid">
                <div
                    v-for="t in theme.availableThemes"
                    :key="t.id"
                    class="theme-card"
                    :class="{ active: isThemeActive(t.id) }"
                    @click="handleThemeSetActive(t.id)"
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
                    </div>
                    <div class="theme-card-actions">
                        <pButton
                            v-if="isThemeActive(t.id)"
                            :schema="{ preset: 'ghost', size: 'xs', label: 'Active', overrides: { variant: 'ghost' } }"
                        />
                        <pButton
                            :schema="{ variant: 'ghost', size: 'xs', icon: DownloadIcon, iconPosition: 'only', ariaLabel: 'Export theme' }"
                            @click.stop="handleThemeExport(t.id)"
                        />
                        <pButton
                            v-if="!t.builtIn"
                            :schema="{ preset: 'danger', size: 'xs', icon: TrashIcon, overrides: { variant: 'ghost', iconPosition: 'only' }, ariaLabel: 'Delete theme' }"
                            @click.stop="handleThemeRemove(t.id)"
                        />
                    </div>
                </div>
            </div>

            <div class="theme-actions-row">
                <pButton
                    :schema="{ variant: 'ghost', size: 'sm', icon: PlusIcon, label: 'Add Theme' }"
                    @click="openThemeCreate"
                />
                <pButton
                    :schema="{ variant: 'ghost', size: 'sm', icon: DownloadIcon, label: 'Import' }"
                    @click="handleThemeImport"
                />
            </div>
        </section>
    </div>
</template>

<style scoped>
.settings-panel {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-height: 75vh;
    overflow-y: auto;
    padding: 4px 8px;
}

.settings-section {
    max-width: 100%;
}

/* --- Provider list --- */
.provider-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.provider-card {
    border: 1px solid rgba(var(--border-color), 0.15);
    border-radius: 8px;
    overflow: hidden;
    background: rgb(var(--bg-secondary));
}

.provider-card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    flex-wrap: wrap;
}

.provider-name {
    font-family: var(--font-serif);
    font-size: 12px;
    font-weight: 600;
    color: rgb(var(--text-primary));
}

.provider-type-badge {
    font-size: 9px;
    font-weight: 500;
    padding: 1px 5px;
    border-radius: 9999px;
    background: rgba(var(--border-color), 0.15);
    color: rgb(var(--text-primary));
    opacity: 0.6;
    white-space: nowrap;
}

.provider-key {
    font-size: 10px;
    font-family: var(--font-serif);
    color: rgb(var(--text-primary));
    opacity: 0.35;
}

.provider-url {
    font-size: 10px;
    font-family: var(--font-serif);
    color: rgb(var(--text-primary));
    opacity: 0.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
}

.provider-actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
    margin-left: auto;
}

/* --- Models --- */
.provider-models {
    padding: 0 10px 6px;
    border-top: 1px solid rgba(var(--border-color), 0.1);
}

.model-empty {
    padding: 6px 0 2px;
    font-size: 11px;
    color: rgb(var(--text-primary));
    opacity: 0.4;
}

.model-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 5px 0;
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
    gap: 6px;
    min-width: 0;
}

.model-name {
    font-size: 11px;
    font-weight: 500;
    color: rgb(var(--text-primary));
}

.model-id {
    font-size: 10px;
    font-family: var(--font-serif);
    color: rgb(var(--text-primary));
    opacity: 0.35;
}

.default-badge {
    font-size: 9px;
    font-weight: 500;
    padding: 1px 5px;
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

/* --- Appearance --- */
.section-appearance {
    margin-top: 0;
}

.appearance-card {
    border: 1px solid rgba(var(--border-color), 0.15);
    border-radius: 8px;
    background: rgb(var(--bg-secondary));
    padding: 14px 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.appearance-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.appearance-label {
    font-size: 11px;
    font-weight: 500;
    color: rgb(var(--text-primary));
    display: flex;
    align-items: center;
    gap: 6px;
}

.scale-value {
    font-family: var(--font-serif);
    font-size: 10px;
    opacity: 0.5;
    font-weight: 400;
}

.preset-group {
    display: flex;
    gap: 4px;
    align-items: center;
    flex-wrap: wrap;
}

.preset-group .btn--ghost {
    opacity: 0.5;
}

.preset-group .btn--ghost[aria-pressed='true'] {
    opacity: 1;
    background: rgba(var(--border-color), 0.15);
}

.preset-custom-tag {
    font-size: 10px;
    font-weight: 500;
    padding: 2px 8px;
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
    height: 3px;
    border-radius: 2px;
    background: rgba(var(--border-color), 0.2);
    outline: none;
    cursor: pointer;
}

.appearance-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
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
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: rgb(var(--border-color));
    cursor: pointer;
    border: 2px solid rgb(var(--bg-secondary));
}

/* --- Themes --- */
.theme-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 16px;
}

.theme-card {
    width: 160px;
    border: 1px solid rgba(var(--border-color), 0.2);
    border-radius: 10px;
    background: rgb(var(--bg-secondary));
    padding: 12px;
    cursor: pointer;
    transition:
        border-color 150ms ease,
        box-shadow 150ms ease;
    display: flex;
    flex-direction: column;
    gap: 8px;
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
    gap: 6px;
}

.theme-swatch {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid rgba(var(--border-color), 0.25);
}

.theme-card-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.theme-name {
    font-size: 13px;
    font-weight: 600;
    color: rgb(var(--text-primary));
}

.theme-card-actions {
    display: flex;
    gap: 4px;
    align-items: center;
    padding-top: 8px;
    border-top: 1px solid rgba(var(--border-color), 0.12);
}

.theme-actions-row {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    align-items: center;
}

/* --- Empty state --- */
.section-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 24px 8px;
}

.empty-text {
    font-size: 12px;
    color: rgb(var(--text-primary));
    opacity: 0.5;
}
</style>