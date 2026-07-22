<script setup lang="ts">
import type { CodeNodeRendererProps } from '../../../types/index.ts'
import VanillaRenderer from './vanilla-renderer.vue'

const props = withDefaults(defineProps<CodeNodeRendererProps>(), {})
</script>

<template>
    <VanillaRenderer :node="props.node" />
</template>
