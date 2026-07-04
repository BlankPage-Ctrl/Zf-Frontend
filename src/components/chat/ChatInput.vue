<script setup lang="ts">
import { computed } from 'vue'
import type { ChatInputSchema } from './types/schema'
import { resolveChatInputSchema } from './resolver/resolveChatInputSchema'
import BaseChatInput from './components/ChatInput.vue'

const props = defineProps<{
    schema: ChatInputSchema
}>()

const resolved = computed(() => resolveChatInputSchema(props.schema))
</script>

<template>
    <BaseChatInput :resolved="resolved" />
</template>
