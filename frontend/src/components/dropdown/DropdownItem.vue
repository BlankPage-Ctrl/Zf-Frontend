<script setup lang="ts">
import { computed } from 'vue'
import { Check, NavArrowRight } from '@iconoir/vue'
import type { DropdownItemConfig, DropdownMode } from './types'

defineOptions({ inheritAttrs: false })

type Props = {
    item: DropdownItemConfig
    dense?: boolean
    focused?: boolean
    selected?: boolean
    hasSubmenu?: boolean
    mode?: DropdownMode
}

const props = withDefaults(defineProps<Props>(), {
    dense: false,
    focused: false,
    selected: false,
    hasSubmenu: false,
    mode: 'menu',
})

const emit = defineEmits<{
    (e: 'click', item: DropdownItemConfig): void
    (e: 'mouseenter', item: DropdownItemConfig): void
    (e: 'right-click', item: DropdownItemConfig): void
}>()

const showIconArea = computed(() => {
    return !!(
        props.item.icon ||
        props.mode === 'select' ||
        props.mode === 'multi-select' ||
        props.selected
    )
})
</script>

<template>
    <div
        class="dropdown-item"
        :class="{
            'dropdown-item--focused': focused,
            'dropdown-item--danger': item.danger,
            'dropdown-item--disabled': item.enabled === false,
            'dropdown-item--selected': selected,
            'dropdown-item--dense': dense,
            'dropdown-item--has-submenu': hasSubmenu,
        }"
        role="menuitem"
        :aria-disabled="item.enabled === false"
        @click="item.enabled !== false && emit('click', item)"
        @mouseenter="emit('mouseenter', item)"
    >
        <div v-if="showIconArea" class="dropdown-item__icon">
            <component :is="item.icon" v-if="item.icon" class="dropdown-item__svg" />
            <Check
                v-else-if="selected"
                class="dropdown-item__check"
                width="14"
                height="14"
                stroke-width="2.5"
            />
        </div>

        <span class="dropdown-item__label">{{ item.label }}</span>

        <div
            v-if="item.rightIcon"
            class="dropdown-item__right-icon"
            @click.stop="emit('right-click', item)"
        >
            <component :is="item.rightIcon" class="dropdown-item__right-svg" />
        </div>

        <span v-if="item.shortcut" class="dropdown-item__shortcut">{{ item.shortcut }}</span>

        <div v-if="hasSubmenu" class="dropdown-item__arrow">
            <NavArrowRight width="14" height="14" />
        </div>
    </div>
</template>

<style scoped>
.dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    font-size: 12px;
    color: rgb(var(--text-primary));
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    transition: background-color 80ms ease;
}

.dropdown-item--dense {
    padding: 4px 8px;
    font-size: 11px;
}

.dropdown-item--focused {
    background-color: rgba(var(--border-color), 0.22);
}

.dropdown-item--danger {
    color: rgb(var(--color-danger));
}

.dropdown-item--danger.dropdown-item--focused {
    background-color: rgba(var(--color-danger), 0.12);
}

.dropdown-item--disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.dropdown-item--selected {
    background-color: rgba(var(--border-color), 0.1);
}

.dropdown-item__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
}

.dropdown-item__svg {
    width: 16px;
    height: 16px;
    color: rgba(var(--text-primary), 0.6);
}

.dropdown-item--danger .dropdown-item__svg {
    color: rgba(var(--color-danger), 0.7);
}

.dropdown-item__check {
    color: rgba(var(--text-primary), 0.6);
}

.dropdown-item--selected .dropdown-item__check {
    color: rgb(var(--text-primary));
}

.dropdown-item__label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dropdown-item__shortcut {
    font-size: 10px;
    color: rgba(var(--text-primary), 0.4);
    margin-left: auto;
    padding-left: 12px;
    letter-spacing: 0.02em;
}

.dropdown-item__right-icon {
    display: flex;
    align-items: center;
    opacity: 0;
    transition: opacity 80ms ease;
    margin-left: auto;
    padding-left: 8px;
}

.dropdown-item:hover .dropdown-item__right-icon {
    opacity: 1;
}

.dropdown-item__right-svg {
    width: 14px;
    height: 14px;
    color: rgba(var(--color-danger), 0.7);
}

.dropdown-item__right-svg:hover {
    color: rgb(var(--color-danger));
}

.dropdown-item__arrow {
    display: flex;
    align-items: center;
    color: rgba(var(--text-primary), 0.35);
    margin-left: 4px;
}
</style>
