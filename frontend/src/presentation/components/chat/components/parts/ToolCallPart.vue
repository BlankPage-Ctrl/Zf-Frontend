<script setup lang="ts">
import { ref, computed } from 'vue'
import { Check, Wrench, Xmark } from '@iconoir/vue'
import type { ToolCallPartSchema } from '../../types/schema'
import { resolveToolCallPartSchema } from '../../resolver/resolvePartsSchema'
import { useShellExecStorer } from '@/application/stores'
import ShellTerminal from './ShellTerminal.vue'

const props = defineProps<{
    schema: ToolCallPartSchema
}>()

const showDetails = ref(false)
const resolved = computed(() => resolveToolCallPartSchema(props.schema))
const shellStore = useShellExecStorer()

interface RunShellOutput {
    executionId?: string
    stdout?: string
    stderr?: string
    exitCode?: number
}

const live = computed(() => {
    if (resolved.value.toolName !== 'run_shell') return undefined
    const id =
        props.schema.toolCallId ??
        (props.schema.output as RunShellOutput | undefined)?.executionId
    if (!id) return undefined
    return shellStore.byToolCall[id]
})

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
            <span
                class="tool-status"
                :class="{
                    running: resolved.isRunning,
                    done: resolved.isDone,
                    error: resolved.isError,
                }"
            >
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
        <div v-if="live" class="tool-live">
            <div class="tool-live__label">
                {{ live.status === 'running' ? 'Running' : 'Output' }}
                <span v-if="live.status === 'running'" class="tool-live__dot" />
            </div>
            <ShellTerminal :lines="live.lines" />
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

<style scoped>
.tool-live {
    margin-top: 6px;
}

.tool-live__label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #8b95a5;
    margin-bottom: 2px;
}

.tool-live__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #4ade80;
    animation: tool-live-pulse 1s ease-in-out infinite;
}

@keyframes tool-live-pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.3;
    }
}
</style>
