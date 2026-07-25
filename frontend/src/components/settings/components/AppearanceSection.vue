<script setup lang="ts">
import type { AppearanceSectionProps } from '../types'

defineProps<AppearanceSectionProps>()

const emit = defineEmits<{
    'update-preset': [preset: string]
    'update-font-size': [size: number]
}>()

function onPresetClick(label: string) {
    emit('update-preset', label)
}

function onScaleInput(e: Event) {
    const value = Number((e.target as HTMLInputElement).value)
    emit('update-font-size', value)
}
</script>

<template>
    <div class="appearance-card">
        <div class="appearance-row">
            <label class="appearance-label">Preset</label>
            <div class="preset-group">
                <button
                    v-for="p in presets"
                    :key="p.label"
                    class="preset-btn"
                    :class="{ active: preset === p.label }"
                    :aria-pressed="preset === p.label ? 'true' : 'false'"
                    @click="onPresetClick(p.label)"
                >
                    {{ p.label }}
                </button>
                <span
                    class="preset-custom-tag"
                    :class="{ active: preset === 'Custom' }"
                >Custom</span>
            </div>
        </div>

        <div class="appearance-row">
            <label class="appearance-label">
                Scale
                <span class="scale-value">{{ fontSize }}px</span>
            </label>
            <input
                type="range"
                class="appearance-slider"
                min="12"
                max="20"
                step="1"
                :value="fontSize"
                @input="onScaleInput"
            />
        </div>
    </div>
</template>

<style scoped>
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

.preset-btn {
    font-size: 11px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: rgb(var(--text-primary));
    opacity: 0.5;
    cursor: pointer;
    transition: opacity 100ms ease, background 100ms ease;
}

.preset-btn:hover {
    opacity: 0.8;
}

.preset-btn.active,
.preset-btn[aria-pressed='true'] {
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
</style>
