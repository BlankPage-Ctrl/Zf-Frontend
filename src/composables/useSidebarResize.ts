import { ref, readonly, type Ref } from 'vue'
import { useEventListener } from '@vueuse/core'

export function useSidebarResize(options: {
    width: Ref<number>
    minWidth: number
    maxWidth: number
}) {
    const { width, minWidth, maxWidth } = options
    const isResizing = ref(false)
    const startX = ref(0)
    const startWidth = ref(0)

    function onHandleMouseDown(e: MouseEvent) {
        e.preventDefault()
        isResizing.value = true
        startX.value = e.clientX
        startWidth.value = width.value
    }

    useEventListener(window, 'mousemove', (e: MouseEvent) => {
        if (!isResizing.value) return
        const delta = e.clientX - startX.value
        const next = Math.max(minWidth, Math.min(maxWidth, startWidth.value + delta))
        width.value = Math.round(next)
    })

    useEventListener(window, 'mouseup', () => {
        isResizing.value = false
    })

    return {
        isResizing: readonly(isResizing),
        onHandleMouseDown,
    }
}
