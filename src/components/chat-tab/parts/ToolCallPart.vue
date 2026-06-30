<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  toolName: string;
  toolCallId: string;
  state: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
}>();

const showDetails = ref(false);

const isRunning = computed(() =>
  props.state === 'input-streaming' || props.state === 'input-available'
);

const isDone = computed(() => props.state === 'output-available');

const isError = computed(() => props.state === 'output-error');

const statusText = computed(() => {
  if (isRunning.value) return 'Running...';
  if (isError.value) return 'Failed';
  return 'Done';
});

function toggleDetails() {
  showDetails.value = !showDetails.value;
}
</script>

<template>
  <div class="tool-call-part" :class="{ error: isError }">
    <div class="tool-call-header">
      <span class="tool-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </span>
      <span class="tool-name">{{ toolName }}</span>
      <span class="tool-status" :class="{ running: isRunning, done: isDone, error: isError }">
        <span v-if="isRunning" class="status-spinner"></span>
        <span v-else-if="isDone" class="status-check">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
        <span v-else class="status-cross">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </span>
        {{ statusText }}
      </span>
      <button v-if="isDone || isError" class="details-toggle" @click="toggleDetails" type="button">
        {{ showDetails ? 'Hide' : 'Show' }} details
      </button>
    </div>
    <div v-if="showDetails" class="tool-details">
      <div v-if="input" class="detail-section">
        <div class="detail-label">Input</div>
        <pre class="detail-json">{{ JSON.stringify(input, null, 2) }}</pre>
      </div>
      <div v-if="output" class="detail-section">
        <div class="detail-label">Output</div>
        <pre class="detail-json">{{ JSON.stringify(output, null, 2) }}</pre>
      </div>
      <div v-if="errorText" class="detail-section error-text">
        <div class="detail-label">Error</div>
        <pre class="detail-json">{{ errorText }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-call-part {
  margin: 4px 0;
  border: 1px solid rgba(var(--third-color), 0.12);
  border-radius: 8px;
  overflow: hidden;
}

.tool-call-part.error {
  border-color: rgba(239, 68, 68, 0.3);
}

.tool-call-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  background: rgba(var(--third-color), 0.04);
}

.tool-icon {
  display: flex;
  align-items: center;
  opacity: 0.6;
}

.tool-name {
  font-weight: 600;
  font-family: var(--font-mono, ui-monospace, monospace);
  color: rgb(var(--text-color));
  opacity: 0.85;
}

.tool-status {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  opacity: 0.6;
}

.tool-status.running {
  color: rgb(var(--text-color));
  opacity: 0.7;
}

.tool-status.done {
  color: rgb(34, 197, 94);
}

.tool-status.error {
  color: rgb(239, 68, 68);
}

.status-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(var(--text-color), 0.15);
  border-top-color: rgb(var(--text-color));
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.status-check,
.status-cross {
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

.tool-details {
  border-top: 1px solid rgba(var(--third-color), 0.08);
  padding: 8px 12px;
}

.detail-section {
  margin-bottom: 8px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.4;
  margin-bottom: 4px;
}

.detail-json {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  opacity: 0.7;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

.error-text {
  color: rgb(239, 68, 68);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
