<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  send: [text: string];
  stop: [];
}>();

const input = ref('');

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

function handleSend() {
  const text = input.value.trim();
  if (!text || props.loading) return;
  emit('send', text);
  input.value = '';
}

function handleStop() {
  emit('stop');
}
</script>

<template>
  <div class="chat-input">
    <div class="input-container">
      <textarea
        v-model="input"
        class="input-field"
        :placeholder="loading ? 'AI is responding...' : 'Type a message...'"
        :disabled="loading"
        rows="1"
        @keydown="onKeydown"
      />
      <div class="input-actions">
        <button
          v-if="loading"
          class="action-btn stop-btn"
          @click="handleStop"
          title="Stop generating"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="3" width="10" height="10" rx="2"/>
          </svg>
        </button>
        <button
          v-else
          class="action-btn send-btn"
          :disabled="!input.trim()"
          @click="handleSend"
          title="Send message"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 8L14 2L8 14L6 10Z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-input {
  flex-shrink: 0;
  padding: 8px 16px 12px;
  border-top: 1px solid rgba(var(--third-color), 0.1);
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid rgba(var(--third-color), 0.15);
  border-radius: 12px;
  background: rgba(var(--third-color), 0.04);
  transition: border-color 0.15s;
}

.input-container:focus-within {
  border-color: rgba(var(--third-color), 0.3);
}

.input-field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  color: rgb(var(--text-color));
  resize: none;
  max-height: 200px;
  min-height: 24px;
}

.input-field::placeholder {
  opacity: 0.35;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}

.send-btn {
  background: rgba(var(--third-color), 0.1);
  color: rgb(var(--text-color));
}

.send-btn:hover:not(:disabled) {
  background: rgba(var(--third-color), 0.2);
}

.send-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.stop-btn {
  background: rgba(239, 68, 68, 0.15);
  color: rgb(239, 68, 68);
}

.stop-btn:hover {
  background: rgba(239, 68, 68, 0.25);
}
</style>
