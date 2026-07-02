<script setup lang="ts">
import { computed } from 'vue'
import type { MessageBubbleSchema } from './types/schema'
import { resolveMessageBubbleSchema } from './resolver/resolveMessageBubbleSchema'
import BaseMessageBubble from './components/MessageBubble.vue'

const props = defineProps<{
    schema: MessageBubbleSchema
}>()

const resolved = computed(() => resolveMessageBubbleSchema(props.schema))
</script>

<template>
    <BaseMessageBubble
        :parts="resolved.parts"
        :content-width="resolved.contentWidth"
        :role="resolved.role"
        :role-label="resolved.roleLabel"
        :avatar-label="resolved.avatarLabel"
    />
</template>
