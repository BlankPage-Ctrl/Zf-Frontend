<script setup lang="ts">
import type { ContainerResizeMode } from '../types'

type Props = {
    readonly mode?: ContainerResizeMode
}

withDefaults(defineProps<Props>(), {
    mode: 'edge',
})

const emit = defineEmits<{
    grab: [event: MouseEvent]
}>()
</script>

<template>
    <div
        class="resize-handle"
        :class="`resize-handle--${mode}`"
        data-resize-handle
        aria-hidden="true"
        @mousedown="emit('grab', $event)"
    ></div>
</template>

<style scoped>
.resize-handle {
    position: absolute;
    top: 0;
    height: 100%;
    width: 6px;
    cursor: col-resize;
    background: transparent;
    z-index: 10;
    transition: background 0.15s ease;
}

.resize-handle:hover {
    background: rgba(var(--primary-lighting, 100 100 100), 0.25);
}

.resize-handle:active {
    background: rgba(var(--primary-lighting, 100 100 100), 0.4);
}

.resize-handle--edge {
    right: -3px;
}

.resize-handle--split {
    left: -3px;
    width: 6px;
}
</style>
