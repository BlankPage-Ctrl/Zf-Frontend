<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { useFileExplorerStore } from '../../stores/file-explorer.ts'
import FileTree from './FileTree.vue'
import { useFileTree } from '../../composables/useFileTree.ts'
import { basename } from '@/shared/utils/path.utils'
import type { FEListDirData, FEMeta, FEWatchEvent } from './file-explorer.types.ts'

const props = defineProps<{
    initialData: FEListDirData
    meta?: FEMeta
}>()

const emit = defineEmits<{
    'request-children': [path: string]
    select: [path: string | null]
}>()

const store = useFileExplorerStore()

const { handleFolderClick, handleNodeClick } = useFileTree((path) => {
    emit('request-children', path)
})

function handleSelect(path: string) {
    handleNodeClick(path)
    emit('select', path)
}

function loadChildren(data: FEListDirData): void {
    store.loadChildren(data)
}

function applyWatchEvent(event: FEWatchEvent): void {
    store.applyWatchEvent(event)
}

function reset(data: FEListDirData, meta?: FEMeta): void {
    store.reset(data, meta)
}

// expose for parent integration layer
defineExpose({ loadChildren, applyWatchEvent, reset })

const workspaceDisplayName = computed(() => {
    if (store.workspaceRoot) {
        return basename(store.workspaceRoot)
    }
    return basename(store.rootPath)
})

onMounted(() => {
    store.loadInitial(props.initialData, props.meta)
})

watch(
    () => props.initialData,
    (data) => {
        store.reset(data, props.meta)
    },
)
</script>

<template>
    <div class="fe-root">
        <div class="fe-header">
            <span class="fe-header__title">{{ workspaceDisplayName }}</span>
        </div>
        <div class="fe-body" role="tree" aria-label="File Explorer">
            <FileTree @toggle="handleFolderClick" @select="handleSelect" />
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
    border-bottom: 1px solid rgba(var(--third-color), 0.12);
}

.fe-header__title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgb(var(--text-color));
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
