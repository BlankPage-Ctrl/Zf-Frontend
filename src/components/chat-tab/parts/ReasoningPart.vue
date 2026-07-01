<script setup lang="ts">
import { ref, computed } from 'vue'
import { Brain, Check } from '@iconoir/vue'

const props = defineProps<{
    text: string
    state?: string
}>()

const expanded = ref(false)

const isRunning = computed(() => props.state === 'streaming')

const isDone = computed(() => !props.state || props.state === 'done')

const statusText = computed(() => {
    if (isRunning.value) return 'Running...'
    return 'Done'
})

function toggle() {
    expanded.value = !expanded.value
}
</script>

<template>
    <div class="reasoning-part" :class="{ expanded }">
        <div class="reasoning-header">
            <span class="reasoning-icon">
                <Brain width="14" height="14" />
            </span>
            <span class="reasoning-label">Thinking</span>
            <span class="reasoning-status" :class="{ running: isRunning, done: isDone }">
                <span v-if="isRunning" class="status-spinner"></span>
                <span v-else class="status-check">
                    <Check width="12" height="12" stroke-width="3" />
                </span>
                {{ statusText }}
            </span>
            <button class="details-toggle" @click="toggle" type="button">
                {{ expanded ? 'Hide' : 'Show' }} details
            </button>
        </div>
        <div v-show="expanded" class="reasoning-content">
            <pre class="reasoning-text">{{ text }}</pre>
        </div>
    </div>
</template>

<style scoped>
.reasoning-part {
    margin: 4px 0;
    border: 1px solid rgba(var(--third-color), 0.12);
    border-radius: 8px;
    overflow: hidden;
}

.reasoning-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 12px;
    background: rgba(var(--third-color), 0.04);
    cursor: pointer;
    user-select: none;
}

.reasoning-icon {
    display: flex;
    align-items: center;
    opacity: 0.6;
}

.reasoning-label {
    font-weight: 600;
    font-family: var(--font-mono, ui-monospace, monospace);
    color: rgb(var(--text-color));
    opacity: 0.85;
}

.reasoning-status {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    opacity: 0.6;
}

.reasoning-status.running {
    color: rgb(var(--text-color));
    opacity: 0.7;
}

.reasoning-status.done {
    color: rgb(34, 197, 94);
}

.status-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(var(--text-color), 0.15);
    border-top-color: rgb(var(--text-color));
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

.status-check {
    display: flex;
    align-items: center;
}

.details-toggle {
    margin-left: 8px;
    padding: 2px 8px;
    border: 1px solid rgba(var(--third-color), 0.15);
    border-radius: 4px;
    background: transparent;
    font-size: 11px;
    color: rgb(var(--text-color));
    opacity: 0.5;
    cursor: pointer;
    transition: opacity 0.15s;
}

.details-toggle:hover {
    opacity: 0.8;
}

.reasoning-content {
    border-top: 1px solid rgba(var(--third-color), 0.08);
    padding: 8px 12px;
}

.reasoning-text {
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    opacity: 0.65;
    margin: 0;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
