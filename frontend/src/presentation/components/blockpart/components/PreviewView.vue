<script setup lang="ts">
// import type { Component } from 'vue'
import type { BlockPartPreviewConfig } from '../types/schema'

defineProps<{
    config?: BlockPartPreviewConfig
}>()
</script>

<template>
    <div class="block-preview">
        <component
            v-if="config?.component"
            :is="config.component"
            v-bind="config.props"
        />
        <slot v-else />
    </div>
</template>

<style scoped>
.block-preview {
    padding: 10px 12px;
}
</style>
