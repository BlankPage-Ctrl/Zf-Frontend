<script setup lang="ts">
import { computed } from 'vue'
import type { ListSchema } from './types.ts'
import DynamicListItem from './ListItem.vue'
import { pButton } from '@/components/button'

type Props = {
  schema: ListSchema
  items: any[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ select: [item: any] }>()

const rootClass = computed(() => [
  'dl-root',
  `dl-root--${props.schema.variant ?? 'sidebar'}`,
  props.schema.class ?? '',
].filter(Boolean).join(' '))

function isActive(item: any): boolean {
  if (!props.schema.activeKey || props.schema.activeId == null) return false
  return item?.[props.schema.activeKey] === props.schema.activeId
}

function handleSelect(item: any) {
  props.schema.onSelect?.(item)
  emit('select', item)
}
</script>

<style src="./styles/list.css"></style>

<template>
  <div :class="rootClass">
    <DynamicListItem
      v-for="item in items"
      :key="item.id ?? item"
      :item="item"
      :fields="schema.fields"
      :actions="schema.actions"
      :active="isActive(item)"
      :size="schema.size ?? 'sm'"
      :variant="schema.variant ?? 'sidebar'"
      :on-select="handleSelect"
    />

    <div v-if="!items.length" class="dl-empty">
      <span class="dl-empty__message">{{ schema.emptyMessage ?? 'No items' }}</span>
      <pButton
        v-if="schema.emptyAction"
        :schema="{ preset: 'ghost', size: 'sm', label: schema.emptyAction.label }"
        @click="schema.emptyAction!.onClick()"
      />
    </div>
  </div>
</template>
