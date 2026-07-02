<script setup lang="ts">
import { ref, computed } from 'vue'
import { Check, Wrench, Xmark } from '@iconoir/vue'
import type { ToolCallPartSchema } from '../../types/schema'
import { resolveToolCallPartSchema } from '../../resolver/resolvePartsSchema'

const props = defineProps<{
    schema: ToolCallPartSchema
}>()

const showDetails = ref(false)
const resolved = computed(() => resolveToolCallPartSchema(props.schema))

function toggleDetails() {
    showDetails.value = !showDetails.value
}
</script>

<template>
    <div class="tool-call-part" :class="{ error: resolved.isError }">
        <div class="tool-call-header">
            <span class="tool-icon">
                <Wrench width="14" height="14" />
            </span>
            <span class="tool-name">{{ resolved.toolName }}</span>
            <span class="tool-status" :class="{ running: resolved.isRunning, done: resolved.isDone, error: resolved.isError }">
                <span v-if="resolved.isRunning" class="status-spinner"></span>
                <span v-else-if="resolved.isDone" class="status-check">
                    <Check width="12" height="12" stroke-width="3" />
                </span>
                <span v-else class="status-cross">
                    <Xmark width="12" height="12" stroke-width="3" />
                </span>
                {{ resolved.statusText }}
            </span>
            <button
                v-if="resolved.isDone || resolved.isError"
                class="details-toggle"
                @click="toggleDetails"
                type="button"
            >
                {{ showDetails ? 'Hide' : 'Show' }} details
            </button>
        </div>
        <div v-if="showDetails" class="tool-details">
            <div v-if="resolved.input" class="detail-section">
                <div class="detail-label">Input</div>
                <pre class="detail-json">{{ JSON.stringify(resolved.input, null, 2) }}</pre>
            </div>
            <div v-if="resolved.output" class="detail-section">
                <div class="detail-label">Output</div>
                <pre class="detail-json">{{ JSON.stringify(resolved.output, null, 2) }}</pre>
            </div>
            <div v-if="resolved.errorText" class="detail-section error-text">
                <div class="detail-label">Error</div>
                <pre class="detail-json">{{ resolved.errorText }}</pre>
            </div>
        </div>
    </div>
</template>
