<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue'
import type { ListSchema } from './types.ts'
import DynamicListItem from './ListItem.vue'
import { pButton } from '@/components/button'

defineOptions({ name: 'DynamicList' })

type Props = {
  schema: ListSchema<T>
  items: T[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ select: [item: T] }>()

const rootClass = computed(() => [
  'dl-root',
  `dl-root--${props.schema.variant ?? 'sidebar'}`,
  props.schema.class ?? '',
].filter(Boolean).join(' '))

function getItemKey(item: T, index: number): string | number {
  const id = item.id
  return id != null ? String(id) : index
}

function isActive(item: T): boolean {
  if (!props.schema.activeKey || props.schema.activeId == null) return false
  return item[props.schema.activeKey] === props.schema.activeId
}

function handleSelect(item: T) {
  props.schema.onSelect?.(item)
  emit('select', item)
}
</script>

<style src="./styles/list.css"></style>

<template>
  <div :class="rootClass">
    <DynamicListItem
      v-for="(item, index) in items"
      :key="getItemKey(item, index)"
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
