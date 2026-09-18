<script setup lang="ts">
import type { ResolvedInsightSection } from '../types/resolved'

const props = defineProps<{ resolved: ResolvedInsightSection }>()

function onToggle(e: Event) {
    const v = (e.target as HTMLInputElement).checked
    props.resolved.onToggle?.(v)
}
</script>

<template>
    <div class="insight-card">
        <div class="insight-row">
            <div class="insight-label">
                <span class="insight-label__title">SrcInsight - (ALPHA)</span>
                <span class="insight-label__desc">Workspace-scoped symbol search + graph index. Disable to stop the background daemon for this workspace.</span>
            </div>
            <label class="insight-toggle">
                <input type="checkbox" :checked="resolved.enabled" @change="onToggle" />
                <span class="insight-toggle__slider"></span>
            </label>
        </div>
    </div>
</template>

<style scoped>
.insight-card {
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-secondary);
    padding: 14px 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.insight-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}
.insight-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.insight-label__title {
    font-size: var(--type-xs);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
}
.insight-label__desc {
    font-size: var(--type-2xs);
    opacity: 0.6;
    color: var(--text-primary);
    line-height: 1.4;
}
.insight-toggle {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
    flex-shrink: 0;
    cursor: pointer;
}
.insight-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
}
.insight-toggle__slider {
    position: absolute;
    inset: 0;
    background: var(--border-color);
    border-radius: 9999px;
    transition: background 150ms ease;
}
.insight-toggle__slider::before {
    content: '';
    position: absolute;
    height: 18px;
    width: 18px;
    left: 3px;
    top: 3px;
    background: var(--bg-primary, #fff);
    border-radius: 50%;
    transition: transform 150ms ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.insight-toggle input:checked + .insight-toggle__slider {
    background: var(--accent, #8250df);
}
.insight-toggle input:checked + .insight-toggle__slider::before {
    transform: translateX(20px);
}
</style>
