<script setup lang="ts">
import type { InlineCodeNodeRendererProps } from '../../types'

withDefaults(defineProps<InlineCodeNodeRendererProps>(), {})
</script>

<template>
    <code
        data-stream-markdown="inline-code"
        class="text-sm font-mono px-1.5 py-0.5 rounded whitespace-normal break-words"
    >
        {{ node.value }}
    </code>
</template>

<style scoped>
[data-stream-markdown='inline-code'] {
    background-color: var(--markdown-muted);
}
</style>
