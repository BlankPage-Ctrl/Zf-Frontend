<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  mediaType: string;
  url?: string;
  filename?: string;
}>();

const icon = computed(() => {
  if (props.mediaType.startsWith('image/')) return '🖼️';
  if (props.mediaType.startsWith('text/')) return '📄';
  if (props.mediaType.startsWith('application/')) return '📦';
  if (props.mediaType.startsWith('audio/')) return '🎵';
  if (props.mediaType.startsWith('video/')) return '🎬';
  return '📎';
});

const displayName = computed(() => props.filename || props.url || 'file');
</script>

<template>
  <a
    v-if="url"
    :href="url"
    target="_blank"
    rel="noopener noreferrer"
    class="file-part"
  >
    <span class="file-icon" v-text="icon"></span>
    <span class="file-name">{{ displayName }}</span>
    <span class="file-type">{{ mediaType.split('/').pop() }}</span>
    <span class="file-arrow">↗</span>
  </a>
  <div v-else class="file-part">
    <span class="file-icon" v-text="icon"></span>
    <span class="file-name">{{ displayName }}</span>
    <span class="file-type">{{ mediaType.split('/').pop() }}</span>
  </div>
</template>

<style scoped>
.file-part {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid rgba(var(--third-color), 0.12);
  border-radius: 8px;
  font-size: 13px;
  color: rgb(var(--text-color));
  text-decoration: none;
  transition: background 0.15s;
}

.file-part:hover {
  background: rgba(var(--third-color), 0.06);
}

.file-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.file-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-type {
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(var(--third-color), 0.08);
  font-size: 10px;
  text-transform: uppercase;
  opacity: 0.5;
  flex-shrink: 0;
}

.file-arrow {
  font-size: 12px;
  opacity: 0.4;
  flex-shrink: 0;
}
</style>
