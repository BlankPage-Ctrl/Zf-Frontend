<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  text: string;
  state?: string;
}>();

const expanded = ref(false);

const isRunning = computed(() => props.state === 'streaming');

const isDone = computed(() => !props.state || props.state === 'done');

const statusText = computed(() => {
  if (isRunning.value) return 'Running...';
  return 'Done';
});

function toggle() {
  expanded.value = !expanded.value;
}
</script>

<template>
  <div class="reasoning-part" :class="{ expanded }">
    <div class="reasoning-header">
      <span class="reasoning-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
	<path d="M0 0h24v24H0z" fill="none" />
	<g fill="none" fill-rule="evenodd">
		<path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z" />
		<path fill="currentColor" d="M5 16c.748 0 1.463.226 2.014.64c.552.413.986 1.06.986 1.86s-.434 1.447-.986 1.86c-.55.414-1.266.64-2.014.64s-1.463-.226-2.014-.64C2.434 19.948 2 19.3 2 18.5s.434-1.447.986-1.86C3.536 16.225 4.252 16 5 16m0 2c-.357 0-.641.11-.814.24c-.123.092-.165.17-.18.218L4 18.5l.007.042c.014.048.056.126.179.219c.173.13.457.239.814.239s.641-.11.814-.24c.123-.092.165-.17.18-.218L6 18.5l-.007-.042c-.014-.048-.056-.126-.179-.219C5.641 18.11 5.357 18 5 18m7.923-15.115c1.487 0 2.803.727 3.613 1.844a4.462 4.462 0 0 1 4.309 7.344a4.462 4.462 0 0 1-6.296 3.956a4.462 4.462 0 0 1-6.87-1.707A4.462 4.462 0 0 1 8.725 5.83a4.46 4.46 0 0 1 4.197-2.945Zm0 2a2.46 2.46 0 0 0-2.427 2.05a1 1 0 0 1-.888.83l-.146.004a2.462 2.462 0 0 0-.716 4.818a1 1 0 0 1 .667.667a2.463 2.463 0 0 0 4.224.889a1 1 0 0 1 1.333-.166a2.462 2.462 0 0 0 3.867-2.225a1 1 0 0 1 .333-.832a2.462 2.462 0 0 0-2.665-4.078a1 1 0 0 1-1.333-.5a2.46 2.46 0 0 0-2.249-1.457" />
	</g>
</svg>


      </span>
      <span class="reasoning-label">Thinking</span>
      <span class="reasoning-status" :class="{ running: isRunning, done: isDone }">
        <span v-if="isRunning" class="status-spinner"></span>
        <span v-else class="status-check">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
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
  to { transform: rotate(360deg); }
}
</style>
