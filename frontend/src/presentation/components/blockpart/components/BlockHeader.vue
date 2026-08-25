<script setup lang="ts">
import { computed } from 'vue'
import { NavArrowDown, NavArrowRight, Eye, Code } from '@iconoir/vue'
import type { Component } from 'vue'
import type { BlockPartViewMode, BlockPartStatus } from '../types/schema'

const props = defineProps<{
    title?: string
    icon?: Component | string
    collapsible: boolean
    expanded: boolean
    viewToggle: boolean
    viewMode: BlockPartViewMode
    status: BlockPartStatus
    hasPreview: boolean
    hasSource: boolean
}>()

const emit = defineEmits<{
    toggleExpand: []
    toggleView: [mode: BlockPartViewMode]
}>()

const isComponent = computed(() => typeof props.icon === 'object' && props.icon !== null)
const iconLabel = computed(() => {
    if (!props.icon) return ''
    return typeof props.icon === 'string' ? props.icon : ''
})

function handleViewToggle(mode: BlockPartViewMode) {
    emit('toggleView', mode)
}
</script>

<template>
    <div class="block-header">
        <div class="block-header__left">
            <button
                v-if="collapsible"
                class="block-expand-btn"
                @click="emit('toggleExpand')"
                type="button"
                :aria-label="expanded ? 'Collapse' : 'Expand'"
            >
                <component
                    :is="expanded ? NavArrowDown : NavArrowRight"
                    v-if="isComponent"
                    width="12"
                    height="12"
                />
                <span v-else-if="iconLabel" class="block-icon-label">{{ iconLabel }}</span>
            </button>
            <span v-else-if="icon && isComponent" class="block-icon">
                <component :is="icon" width="14" height="14" />
            </span>
            <span v-else-if="iconLabel" class="block-icon-label">{{ iconLabel }}</span>
            <span v-if="title" class="block-title">{{ title }}</span>
            <span
                v-if="status === 'streaming'"
                class="status-indicator status-indicator--streaming"
            />
            <span v-else-if="status === 'done'" class="status-indicator status-indicator--done" />
        </div>
        <div v-if="viewToggle && (hasPreview || hasSource)" class="block-header__right">
            <button
                class="view-toggle-btn"
                :class="{ active: viewMode === 'preview' }"
                :disabled="!hasPreview"
                @click="handleViewToggle('preview')"
                type="button"
            >
                <Eye width="12" height="12" />
                <span>Preview</span>
            </button>
            <button
                class="view-toggle-btn"
                :class="{ active: viewMode === 'source' }"
                :disabled="!hasSource"
                @click="handleViewToggle('source')"
                type="button"
            >
                <Code width="12" height="12" />
                <span>Source</span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.block-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 10px;
    background: var(--border-color);
    min-height: 32px;
}

.block-header__left {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
}

.block-header__right {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
}

.block-expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--text-primary);
    opacity: 0.5;
    cursor: pointer;
    border-radius: 3px;
    flex-shrink: 0;
}

.block-expand-btn:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.06);
}

.block-icon {
    display: flex;
    align-items: center;
    opacity: 0.6;
    flex-shrink: 0;
}

.block-icon-label {
    font-size: 12px;
    opacity: 0.6;
    flex-shrink: 0;
}

.block-title {
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    opacity: 0.85;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.view-toggle-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border: none;
    background: transparent;
    color: var(--text-primary);
    opacity: 0.45;
    font-size: 11px;
    cursor: pointer;
    border-radius: 3px;
    transition: opacity 0.15s;
}

.view-toggle-btn:hover:not(:disabled) {
    opacity: 0.7;
    background: rgba(255, 255, 255, 0.06);
}

.view-toggle-btn.active {
    opacity: 0.9;
    background: rgba(255, 255, 255, 0.1);
}

.view-toggle-btn:disabled {
    opacity: 0.2;
    cursor: default;
}

.status-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
}

.status-indicator--streaming {
    background: #3b82f6;
    animation: pulse 1.5s ease-in-out infinite;
}

.status-indicator--done {
    background: #22c55e;
}

@keyframes pulse {
    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.5;
        transform: scale(0.8);
    }
}
</style>
