<script setup lang="ts">
import { ref, computed } from 'vue'
import { Brain, Check } from '@iconoir/vue'
import type { ReasoningPartSchema } from '../../types/schema'
import { resolveReasoningPartSchema } from '../../resolver/resolvePartsSchema'

const props = defineProps<{
    schema: ReasoningPartSchema
}>()

const expanded = ref(false)
const resolved = computed(() => resolveReasoningPartSchema(props.schema))

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
            <span class="reasoning-status" :class="{ running: resolved.isRunning, done: resolved.isDone }">
                <span v-if="resolved.isRunning" class="status-spinner"></span>
                <span v-else class="status-check">
                    <Check width="12" height="12" stroke-width="3" />
                </span>
                {{ resolved.statusText }}
            </span>
            <button class="details-toggle" @click="toggle" type="button">
                {{ expanded ? 'Hide' : 'Show' }} details
            </button>
        </div>
        <div v-show="expanded" class="reasoning-content">
            <pre class="reasoning-text">{{ resolved.text }}</pre>
        </div>
    </div>
</template>
