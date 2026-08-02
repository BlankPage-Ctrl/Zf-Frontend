<script setup lang="ts">
import type { BlockquoteNodeRendererProps } from '../../types/index.ts'
import NodeList from '../node-list.vue'

const props = withDefaults(defineProps<BlockquoteNodeRendererProps>(), {})
</script>

<template>
    <blockquote
        data-stream-markdown="blockquote"
        class="mx-0 my-4 pl-4 italic relative [&_p]:mb-0"
    >
        <NodeList v-bind="props" :parent-node="node" :nodes="node.children" :deep="deep + 1" />
    </blockquote>
</template>

<style scoped>
[data-stream-markdown='blockquote'] {
    color: var(--markdown-muted-foreground);
    border-left: 4px solid color-mix(in srgb, var(--markdown-muted-foreground) 30%, transparent);
}
</style>
