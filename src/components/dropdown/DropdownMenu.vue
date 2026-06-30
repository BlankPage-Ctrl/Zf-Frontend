<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
    useFloating,
    offset as offsetMiddleware,
    flip,
    shift,
    autoUpdate,
    type Placement,
} from '@floating-ui/vue'
import type { DropdownItemConfig, DropdownMode } from './types'
import DropdownItem from './DropdownItem.vue'
import DropdownSeparator from './DropdownSeparator.vue'
import { filterVisible } from './utils'

type Props = {
    items: DropdownItemConfig[]
    mode?: DropdownMode
    dense?: boolean
    parentRef: HTMLElement | null
    close: () => void
    onItemClick: (item: DropdownItemConfig) => void
    focusedIndex?: number
    maxHeight?: number
    minWidth?: number
    level?: number
}

const props = withDefaults(defineProps<Props>(), {
    mode: 'menu',
    dense: false,
    focusedIndex: -1,
    level: 0,
})

const menuRef = ref<HTMLElement | null>(null)
const submenuRef = ref<HTMLElement | null>(null)
const hoveredItem = ref<DropdownItemConfig | null>(null)
const submenuOpen = ref(false)

const visibleItems = computed(() => filterVisible(props.items))

const parentEl = computed(() => props.parentRef)

const submenuItems = computed(() => {
    if (!hoveredItem.value?.children) return []
    return hoveredItem.value.children
})

const { floatingStyles: submenuStyles } = useFloating(parentEl, submenuRef, {
    placement: 'right-start' as Placement,
    middleware: [offsetMiddleware(8), flip(), shift()],
    whileElementsMounted: autoUpdate,
    open: submenuOpen,
})

let hoverTimer: ReturnType<typeof setTimeout> | null = null

function handleItemMouseEnter(item: DropdownItemConfig) {
    if (hoverTimer) clearTimeout(hoverTimer)
    if (item.children && item.children.length > 0 && item.enabled !== false) {
        hoverTimer = setTimeout(() => {
            hoveredItem.value = item
            submenuOpen.value = true
        }, 150)
    } else {
        hoveredItem.value = null
        submenuOpen.value = false
    }
}

function handleItemClick(item: DropdownItemConfig) {
    if (item.children && item.children.length > 0) {
        return
    }
    props.onItemClick(item)
}

function handleMenuMouseLeave() {
    if (hoverTimer) clearTimeout(hoverTimer)
    hoverTimer = setTimeout(() => {
        hoveredItem.value = null
        submenuOpen.value = false
    }, 200)
}

watch(
    () => props.items,
    () => {
        submenuOpen.value = false
        hoveredItem.value = null
    },
)
</script>

<template>
    <div
        ref="menuRef"
        class="dropdown-menu"
        :class="{ 'dropdown-menu--dense': dense }"
        :style="{
            maxHeight: maxHeight ? `${maxHeight}px` : undefined,
            minWidth: minWidth ? `${minWidth}px` : undefined,
        }"
        @mouseleave="handleMenuMouseLeave"
    >
        <template v-for="item in visibleItems" :key="item.id">
            <DropdownSeparator v-if="item.type === 'separator'" />
            <DropdownItem
                v-else
                :item="item"
                :dense="dense"
                :focused="focusedIndex >= 0 && visibleItems.indexOf(item) === focusedIndex"
                :selected="!!item.selected"
                :has-submenu="
                    !!(
                        item.children &&
                        item.children.length > 0 &&
                        item.action?.type !== 'submenu'
                    ) || item.action?.type === 'submenu'
                "
                :mode="mode"
                @click="handleItemClick"
                @mouseenter="handleItemMouseEnter"
            />
        </template>

        <div
            v-if="submenuOpen && submenuItems.length > 0"
            ref="submenuRef"
            :style="submenuStyles"
            class="dropdown-menu--submenu"
        >
            <DropdownMenu
                :items="submenuItems"
                :mode="mode"
                :dense="dense"
                :parent-ref="menuRef"
                :close="close"
                :on-item-click="onItemClick"
                :focused-index="-1"
                :level="level + 1"
            />
        </div>
    </div>
</template>

<style scoped>
.dropdown-menu {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 4px;
    min-width: 160px;
    max-height: 400px;
    overflow-y: auto;
    background-color: rgb(var(--primary-color));
    border: 1px solid rgba(var(--third-color), 0.2);
    border-radius: 8px;
    box-shadow:
        0 4px 12px rgba(15, 15, 20, 0.08),
        0 8px 24px rgba(15, 15, 20, 0.06);
}

.dropdown-menu--dense {
    min-width: 140px;
    max-height: 320px;
}

.dropdown-menu--submenu {
    z-index: 10;
}

.dropdown-menu::-webkit-scrollbar {
    width: 4px;
}

.dropdown-menu::-webkit-scrollbar-track {
    background: transparent;
}

.dropdown-menu::-webkit-scrollbar-thumb {
    background: rgba(var(--third-color), 0.2);
    border-radius: 4px;
}

.dropdown-menu::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--third-color), 0.35);
}
</style>
