<script setup lang="ts" generic="T extends Record<string, unknown>">
import { ref, computed } from 'vue'
import type { ListItemField, ListItemAction } from './types'
import type { DropdownItemConfig } from '@/components/dropdown/types'
import { pButton } from '@/components/button'

type Props = {
    item: T
    fields: ListItemField<T>[]
    actions?: ListItemAction<T>[]
    active?: boolean
    size?: 'xs' | 'sm' | 'md'
    variant?: 'sidebar' | 'content' | 'compact'
    onSelect?: (item: T) => void
    hoverMenuItems?: DropdownItemConfig[]
}

const props = withDefaults(defineProps<Props>(), {
    active: false,
    size: 'sm',
    variant: 'sidebar',
})

const emit = defineEmits<{ hoverSelect: [value: string] }>()

const isHovered = ref(false)

const hasHoverMenu = computed(() => props.hoverMenuItems && props.hoverMenuItems.length > 0)

const isExpandable = computed(() => {
    if (!props.hoverMenuItems) return false
    return props.hoverMenuItems.length > 0 && props.hoverMenuItems[0].type !== 'label'
})

const itemClass = computed(() =>
    [
        'dl-item',
        `dl-item--${props.size}`,
        props.active ? 'dl-item--active' : '',
        `dl-item--${props.variant}`,
        isHovered.value && hasHoverMenu.value ? 'dl-item--hover' : '',
    ]
        .filter(Boolean)
        .join(' '),
)

const visibleFields = computed(() =>
    props.fields.filter((f) => !f.visible || f.visible(props.item)),
)

const titleFields = computed(() => visibleFields.value.filter((f) => f.class?.includes('title')))

const metaFields = computed(() => visibleFields.value.filter((f) => !f.class?.includes('title')))

function getFieldValue(field: ListItemField<T>): string {
    const raw = props.item[field.key]
    if (field.format) return field.format(raw, props.item)
    if (raw == null) return ''
    return String(raw)
}

function onMouseEnter() {
    isHovered.value = true
}

function onMouseLeave() {
    isHovered.value = false
}

function onChatClick(chatId: string) {
    emit('hoverSelect', chatId)
}
</script>

<template>
    <div
        class="dl-item-wrapper"
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
    >
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
                        ...(action.variant === 'danger'
                            ? {
                                  preset: 'danger',
                                  overrides: { variant: 'ghost', iconPosition: 'only' },
                              }
                            : {}),
                    }"
                    @click="action.onClick(item)"
                />
            </div>
        </div>

        <Transition name="sub-list">
            <div v-if="isHovered && hasHoverMenu" class="dl-sub-list">
                <div
                    v-for="chatItem in hoverMenuItems"
                    :key="chatItem.id"
                    class="dl-sub-item"
                    :class="{ 'dl-sub-item--label': chatItem.type === 'label' }"
                    @click.stop="chatItem.value != null && onChatClick(chatItem.value as string)"
                >
                    <span class="dl-sub-item__label">{{ chatItem.label }}</span>
                </div>
            </div>
        </Transition>
    </div>
</template>