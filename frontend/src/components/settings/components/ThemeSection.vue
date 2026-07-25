<script setup lang="ts">
import { h } from 'vue'
import { Download, Plus, Trash } from '@iconoir/vue'
import { pButton } from '@/components/button'
import type { ThemeSectionProps } from '../types'

const props = defineProps<ThemeSectionProps>()

const emit = defineEmits<{
    'add-theme': []
    'import-theme': []
    'export-theme': [id: string]
    'remove-theme': [id: string]
    'set-active-theme': [id: string]
}>()

const DownloadIcon = () => h(Download, { width: 14, height: 14 })
const PlusIcon = () => h(Plus, { width: 14, height: 14 })
const TrashIcon = () => h(Trash, { width: 14, height: 14 })

function isActive(id: string): boolean {
    return props.activeThemeId === id
}

function handleThemeSetActive(id: string) {
    emit('set-active-theme', id)
}

function handleThemeExport(id: string) {
    emit('export-theme', id)
}

function handleThemeRemove(id: string) {
    emit('remove-theme', id)
}

function handleAddTheme() {
    emit('add-theme')
}

function handleImportTheme() {
    emit('import-theme')
}
</script>

<template>
    <div>
        <div class="theme-grid">
            <div
                v-for="t in themes"
                :key="t.id"
                class="theme-card"
                :class="{ active: isActive(t.id) }"
                @click="handleThemeSetActive(t.id)"
            >
                <div class="theme-swatches">
                    <span
                        v-for="(color, ci) in t.swatches"
                        :key="ci"
                        class="theme-swatch"
                        :style="{ background: color }"
                    />
                </div>
                <div class="theme-card-body">
                    <span class="theme-name">{{ t.name }}</span>
                </div>
                <div class="theme-card-actions">
                    <span v-if="isActive(t.id)" class="active-label">Active</span>
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
                @click="handleAddTheme"
            />
            <pButton
                :schema="{ variant: 'ghost', size: 'sm', icon: DownloadIcon, label: 'Import' }"
                @click="handleImportTheme"
            />
        </div>
    </div>
</template>

<style scoped>
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

.active-label {
    font-size: 10px;
    font-weight: 500;
    color: rgb(var(--color-success));
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(var(--color-success), 0.1);
}

.theme-actions-row {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    align-items: center;
}
</style>
