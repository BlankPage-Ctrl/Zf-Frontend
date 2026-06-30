<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    sourceId: string
    url?: string
    title?: string
    mediaType?: string
}>()

const icon = computed(() => {
    if (props.mediaType) {
        if (props.mediaType.startsWith('image/')) return '🖼️'
        if (props.mediaType.startsWith('text/')) return '📄'
        if (props.mediaType.startsWith('application/pdf')) return '📕'
    }
    return '🔗'
})
</script>

<template>
    <a v-if="url" :href="url" target="_blank" rel="noopener noreferrer" class="source-part">
        <span class="source-icon" v-text="icon"></span>
        <span class="source-title">{{ title || url }}</span>
        <span class="source-arrow">↗</span>
    </a>
    <div v-else class="source-part">
        <span class="source-icon" v-text="icon"></span>
        <span class="source-title">{{ title || sourceId }}</span>
    </div>
</template>

<style scoped>
.source-part {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: 1px solid rgba(var(--third-color), 0.12);
    border-radius: 6px;
    font-size: 12px;
    color: rgb(var(--text-color));
    text-decoration: none;
    transition: background 0.15s;
    max-width: 100%;
}

.source-part:hover {
    background: rgba(var(--third-color), 0.06);
}

.source-icon {
    font-size: 14px;
    flex-shrink: 0;
}

.source-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0.8;
}

.source-arrow {
    font-size: 11px;
    opacity: 0.4;
    flex-shrink: 0;
}
</style>
