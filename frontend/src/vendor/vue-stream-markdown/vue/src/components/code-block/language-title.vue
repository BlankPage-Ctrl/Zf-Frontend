<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
    defineProps<{
        icon?: Component
        language: string
        showIcon?: boolean
        showName?: boolean
    }>(),
    {
        showIcon: true,
        showName: true,
    },
)
</script>

<template>
    <div data-stream-markdown="language-title" class="flex gap-2 items-center">
        <component :is="icon" v-if="showIcon" />
        <span v-if="showName" data-stream-markdown="language-name" class="language-name">
            {{ language }}
        </span>
    </div>
</template>

<style scoped>
.language-name {
    font-size: 12px;
    font-weight: 600;
    font-family: var(--font-mono, ui-monospace, monospace);
    color: rgb(var(--text-color));
    opacity: 0.85;
    text-transform: lowercase;
}
</style>
