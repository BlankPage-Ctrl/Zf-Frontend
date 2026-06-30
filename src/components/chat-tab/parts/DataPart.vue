<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  type: string;
  data: unknown;
}>();

const expanded = ref(false);

function toggle() {
  expanded.value = !expanded.value;
}
</script>

<template>
  <div class="data-part">
    <button class="data-toggle" @click="toggle" type="button">
      <span v-text="expanded ? '▼' : '▶'"></span>
      <span class="data-label">{{ type }}</span>
      <span class="data-badge">data</span>
    </button>
    <div v-show="expanded" class="data-content">
      <pre class="data-json">{{ JSON.stringify(data, null, 2) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.data-part {
  margin: 4px 0;
}

.data-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid rgba(var(--third-color), 0.12);
  border-radius: 6px;
  background: rgba(var(--third-color), 0.04);
  cursor: pointer;
  font-size: 12px;
  color: rgb(var(--text-color));
  transition: background 0.15s;
}

.data-toggle:hover {
  background: rgba(var(--third-color), 0.08);
}

.data-label {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-weight: 500;
  opacity: 0.7;
}

.data-badge {
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(var(--third-color), 0.1);
  font-size: 10px;
  opacity: 0.4;
}

.data-content {
  margin-top: 6px;
  padding: 8px 12px;
  border: 1px solid rgba(var(--third-color), 0.08);
  border-radius: 6px;
}

.data-json {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  opacity: 0.7;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
}
</style>
