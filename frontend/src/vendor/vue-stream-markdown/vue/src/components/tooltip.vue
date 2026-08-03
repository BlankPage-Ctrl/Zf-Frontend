<script setup lang="ts">
import type { UITooltipProps } from '../types'
import { getOverlayContainer } from '@stream-markdown/core'
import { toRefs } from 'vue'
import { useContext, useFloating } from '../composables'

defineOptions({
    inheritAttrs: false,
})

const props = withDefaults(defineProps<UITooltipProps>(), {
    trigger: 'hover',
    placement: 'top',
    delay: () => [100, 100],
})

const { placement, delay, trigger } = toRefs(props)

const { hideTooltip } = useContext()

const {
    referenceEl: _referenceEl,
    floatingEl: _floatingEl,
    open,
    appendTo,
    floatingStyle,
    show,
    hide,
    onMouseEnter,
    onMouseLeave,
    onClick,
    onFloatingEnter,
    onFloatingLeave,
} = useFloating({
    hideTooltip,
    placement,
    delay,
    trigger,
    getContainer: () => getOverlayContainer(),
})

defineExpose({ show, hide })
</script>

<template>
    <span
        v-bind="$attrs"
        ref="_referenceEl"
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
        @click="onClick"
    >
        <slot />
    </span>

    <Teleport v-if="appendTo" :to="appendTo">
        <div
            v-if="open"
            ref="_floatingEl"
            :style="floatingStyle"
            data-stream-markdown="tooltip"
            class="border rounded-lg z-[10000]"
            @mouseenter="onFloatingEnter"
            @mouseleave="onFloatingLeave"
        >
            <slot name="content">
                <pre data-stream-markdown="tooltip-overlay" class="text-sm px-2 py-1">{{
                    content
                }}</pre>
            </slot>
        </div>
    </Teleport>
</template>

<style scoped>
[data-stream-markdown='tooltip'] {
    color: var(--markdown-muted-foreground);
    border: 1px solid var(--markdown-border);
    background-color: var(--markdown-bg-secondary);
}
</style>
