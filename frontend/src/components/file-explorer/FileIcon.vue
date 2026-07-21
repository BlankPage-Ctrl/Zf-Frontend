<script setup lang="ts">
import { computed } from 'vue'
import { useFileIcon } from '../../composables/useFileIcon'
import {
    AlbumList,
    Code,
    CodeBrackets,
    Folder,
    MediaImage,
    MediaVideo,
    MusicDoubleNote,
    Page,
    Terminal,
} from '@iconoir/vue'

const iconMap: Record<string, unknown> = {
    AlbumList,
    Code,
    CodeBrackets,
    Folder,
    MediaImage,
    MediaVideo,
    MusicDoubleNote,
    Page,
    Terminal,
}

const props = defineProps<{
    path: string
    isDirectory: boolean
    isExpanded?: boolean
    isSymlink?: boolean
}>()

const { getIconName } = useFileIcon()

const iconName = computed(() => getIconName(props.path, props.isDirectory, !!props.isExpanded))

const iconComponent = computed(() => iconMap[iconName.value] ?? Page)
</script>

<template>
    <component :is="iconComponent" class="fe-icon" aria-hidden="true" width="16" height="16" />
</template>

<style scoped>
.fe-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: rgb(var(--text-color));
    opacity: 0.7;
}
</style>
