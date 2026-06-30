<script setup lang="ts">
import { computed } from 'vue'
import { useSidebarResize } from '@/composables/useSidebarResize'
import { SIDEBAR_DEFAULTS } from '@/components/sidebar/sidebar'

defineOptions({ name: 'AppSidebar' })

const RAIL_WIDTH = 48
const HANDLE_WIDTH = 6

const props = withDefaults(
    defineProps<{
        collapsed: boolean
        width: number
        minWidth?: number
        maxWidth?: number
    }>(),
    {
        minWidth: SIDEBAR_DEFAULTS.minWidth,
        maxWidth: SIDEBAR_DEFAULTS.maxWidth,
    },
)

const emit = defineEmits<{
    'update:collapsed': [value: boolean]
    'update:width': [value: number]
}>()

const localWidth = computed({
    get: () => props.width,
    set: (v: number) => emit('update:width', v),
})

const { isResizing, onHandleMouseDown } = useSidebarResize({
    width: localWidth,
    minWidth: props.minWidth,
    maxWidth: props.maxWidth,
})

function toggleCollapsed() {
    emit('update:collapsed', !props.collapsed)
}

const sidebarWidth = computed(() => {
    if (props.collapsed) return `${RAIL_WIDTH}px`
    return `${RAIL_WIDTH + props.width + HANDLE_WIDTH}px`
})

const panelWidth = computed(() => {
    return props.collapsed ? '0px' : `${props.width}px`
})
</script>

<template>
    <div
        class="app-sidebar"
        :class="{
            'app-sidebar--collapsed': collapsed,
            'app-sidebar--resizing': isResizing,
        }"
        :style="{ width: sidebarWidth }"
    >
        <div class="app-sidebar__rail">
            <slot name="iconRail" :toggle="toggleCollapsed" />
        </div>

        <div class="app-sidebar__panel" :style="{ width: panelWidth }">
            <div class="app-sidebar__panel-inner">
                <div v-if="$slots.header" class="app-sidebar__header">
                    <slot name="header" />
                </div>
                <div class="app-sidebar__body">
                    <slot />
                </div>
            </div>
        </div>

        <div
            v-if="!collapsed"
            class="app-sidebar__resize-handle"
            :class="{ 'app-sidebar__resize-handle--active': isResizing }"
            @mousedown="onHandleMouseDown"
        />
    </div>
</template>

<style scoped>
.app-sidebar {
    display: flex;
    flex-shrink: 0;
    overflow: hidden;
    position: relative;
}

.app-sidebar--resizing {
    user-select: none;
}

/* --- Icon Rail --- */
.app-sidebar__rail {
    width: 48px;
    flex-shrink: 0;
    background: rgb(var(--secondary-color));
    border-right: 1px solid rgba(var(--third-color), 0.25);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 0;
    gap: 4px;
    z-index: 1;
}

/* --- Panel --- */
.app-sidebar__panel {
    flex-shrink: 0;
    overflow: hidden;
    background: rgb(var(--secondary-color));
    border-right: 1px solid rgba(var(--third-color), 0.25);
    transition: width 150ms ease;
}

.app-sidebar--collapsed .app-sidebar__panel {
    border-right-color: transparent;
}

.app-sidebar__panel-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: v-bind('width + "px"');
    overflow: hidden;
}

.app-sidebar__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 12px 8px;
    flex-shrink: 0;
}

.app-sidebar__body {
    flex: 1;
    overflow-y: auto;
    padding: 0 8px 8px;
}

/* --- Resize Handle --- */
.app-sidebar__resize-handle {
    position: absolute;
    top: 0;
    right: 0;
    width: 6px;
    height: 100%;
    cursor: col-resize;
    background: transparent;
    z-index: 2;
    transition: background 100ms ease;
}

.app-sidebar__resize-handle:hover,
.app-sidebar__resize-handle--active {
    background: rgb(var(--third-color));
}
</style>
