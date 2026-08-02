<script setup lang="ts">
import type { ThematicBreakNodeRendererProps } from '../../types'

withDefaults(defineProps<ThematicBreakNodeRendererProps>(), {})
</script>

<template>
    <hr data-stream-markdown="thematic-break" class="my-6 border-t" />
</template>

<style scoped>
[data-stream-markdown='thematic-break'] {
    border-top-color: var(--markdown-border);
}
</style>
