<script setup lang="ts">
import { computed } from 'vue'
import type { ContainerCellStyle, SizeValue } from './types'

type Props = {
    readonly cellId: string
    readonly styleConfig?: ContainerCellStyle
    readonly animate?: boolean
    readonly animationMs?: number
    readonly resizable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    styleConfig: undefined,
    animate: false,
    animationMs: 180,
    resizable: false,
})

const toCssSize = (value?: SizeValue): string | undefined => {
    if (value === undefined) return undefined
    return typeof value === 'number' ? `${value}px` : value
}

const cellStyle = computed(() => {
    const style = props.styleConfig

    return {
        padding: toCssSize(style?.padding),
        margin: toCssSize(style?.margin),
        borderColor: style?.borderColor,
        borderWidth: toCssSize(style?.borderWidth),
        borderStyle: style?.borderStyle,
        borderRadius: toCssSize(style?.radius),
        background: style?.background,
        overflow: style?.overflow ?? 'auto',
        overflowX: style?.overflowX,
        overflowY: style?.overflowY,
        transition: props.animate ? `all ${props.animationMs}ms ease` : undefined,
    }
})
</script>

<template>
    <div class="container-cell" :data-cell="cellId" :style="cellStyle">
        <slot />
        <div
            v-if="resizable"
            class="container-cell__resize-handle"
            data-resize="col"
            aria-hidden="true"
        ></div>
    </div>
</template>

<style scoped>
.container-cell {
    position: relative;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;
}

.container-cell__resize-handle {
    position: absolute;
    top: 0;
    right: -3px;
    width: 6px;
    height: 100%;
    cursor: col-resize;
    background: transparent;
}
</style>
