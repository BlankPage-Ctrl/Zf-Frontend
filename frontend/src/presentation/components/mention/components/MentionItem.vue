<script setup lang="ts">
import type { MentionItem } from '@/core/entities/mention'

defineProps<{
    item: MentionItem
    active?: boolean
}>()

const emit = defineEmits<{
    (e: 'click', item: MentionItem): void
}>()
</script>

<template>
    <div
        class="mention-item"
        :class="{ 'mention-item--active': active }"
        role="option"
        :aria-selected="active"
        @click="emit('click', item)"
    >
        <span v-if="item.icon" class="mention-item__icon">
            <component :is="item.icon" :width="14" :height="14" />
        </span>
        <span class="mention-item__main">
            <span class="mention-item__label" :title="item.title ?? item.label">{{ item.label }}</span>
            <span v-if="item.description" class="mention-item__desc" :title="item.description">{{ item.description }}</span>
        </span>
        <span class="mention-item__kind">{{ item.kind }}</span>
    </div>
</template>
