<script setup lang="ts">
import { computed } from 'vue'
import type { ListItemField, ListItemAction } from './types'
import { pButton } from '@/components/button'

type Props = {
  item: any
  fields: ListItemField[]
  actions?: ListItemAction[]
  active?: boolean
  size?: 'xs' | 'sm' | 'md'
  variant?: 'sidebar' | 'content' | 'compact'
  onSelect?: (item: any) => void
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
  size: 'sm',
  variant: 'sidebar',
})

const itemClass = computed(() => [
  'dl-item',
  `dl-item--${props.size}`,
  props.active ? 'dl-item--active' : '',
  `dl-item--${props.variant}`,
].filter(Boolean).join(' '))

const visibleFields = computed(() =>
  props.fields.filter(f => !f.visible || f.visible(props.item)),
)

const titleFields = computed(() =>
  visibleFields.value.filter(f => f.class?.includes('title')),
)

const metaFields = computed(() =>
  visibleFields.value.filter(f => !f.class?.includes('title')),
)

function getFieldValue(field: ListItemField): string {
  const raw = props.item?.[field.key]
  if (field.format) return field.format(raw, props.item)
  if (raw == null) return ''
  return String(raw)
}
</script>

<template>
  <div :class="itemClass" @click="onSelect?.(item)">
    <div class="dl-item__body">
      <span
        v-for="field in titleFields"
        :key="field.key"
        :class="['dl-item__field', `dl-item__field--${field.class}`]"
      >
        {{ getFieldValue(field) }}
      </span>

      <div v-if="metaFields.length" class="dl-item__meta">
        <span
          v-for="field in metaFields"
          :key="field.key"
          :class="['dl-item__field', `dl-item__field--${field.class ?? 'meta'}`]"
        >
          {{ getFieldValue(field) }}
        </span>
      </div>
    </div>

    <div v-if="actions?.length" class="dl-item__actions" @click.stop>
      <pButton
        v-for="(action, idx) in actions"
        :key="idx"
        :schema="{
          variant: 'ghost',
          size: action.size ?? 'xs',
          icon: action.icon,
          iconPosition: 'only',
          ariaLabel: action.ariaLabel,
          ...(action.variant === 'danger' ? { preset: 'danger', overrides: { variant: 'ghost', iconPosition: 'only' } } : {}),
        }"
        @click="action.onClick(item)"
      />
    </div>
  </div>
</template>
