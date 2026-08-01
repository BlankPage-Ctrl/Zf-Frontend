<script setup lang="ts">
import { computed } from 'vue'
import { useFileExplorerStorer } from '@/application/stores'
import FileTree from './FileTree.vue'
import { basename } from '@/shared/utils/path.utils'

const emit = defineEmits<{
    toggle: [path: string]
    select: [path: string | null]
}>()

const store = useFileExplorerStorer()

const workspaceDisplayName = computed(() => {
    if (store.workspaceRoot) {
        return basename(store.workspaceRoot)
    }
    return basename(store.rootPath)
})
</script>

<template>
    <div class="fe-root">
        <div class="fe-header">
            <span class="fe-header__title">{{ workspaceDisplayName }}</span>
        </div>
        <div class="fe-body" role="tree" aria-label="File Explorer">
            <FileTree @toggle="emit('toggle', $event)" @select="emit('select', $event)" />
        </div>
    </div>
</template>

<style scoped>
.fe-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.fe-header {
    height: 35px;
    display: flex;
    align-items: center;
    padding: 0 12px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border-color);
}

.fe-header__title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-primary);
    opacity: 0.5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.fe-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
}
</style>
