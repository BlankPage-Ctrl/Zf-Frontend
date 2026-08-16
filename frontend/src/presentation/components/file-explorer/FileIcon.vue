<script setup lang="ts">
import { computed } from 'vue'
import { resolveFileIconComponent } from '../../composables/useFileIcon'

const props = defineProps<{
    path: string
    isDirectory: boolean
    isExpanded?: boolean
    isSymlink?: boolean
}>()

const iconComponent = computed(() => resolveFileIconComponent(props.path, props.isDirectory))
</script>

<template>
    <component :is="iconComponent" class="fe-icon" aria-hidden="true" width="16" height="16" />
</template>

<style scoped>
.fe-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: var(--text-primary);
    opacity: 0.7;
}
</style>
