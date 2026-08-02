import { shallowRef, readonly, computed } from 'vue'

export function useTabs<T>(initial: T[] = []) {
    const order = shallowRef<T[]>([...initial])
    const activeId = shallowRef<T | null>(initial[0] ?? null)

    function isOpen(id: T): boolean {
        return order.value.includes(id)
    }

    function open(id: T): void {
        if (!isOpen(id)) {
            order.value.push(id)
        }
        activeId.value = id
    }

    function activate(id: T): void {
        if (isOpen(id)) {
            activeId.value = id
        }
    }

    function close(id: T): void {
        const index = order.value.indexOf(id)
        if (index === -1) return

        const wasActive = activeId.value === id
        order.value.splice(index, 1)

        if (wasActive) {
            activeId.value = order.value[index] ?? order.value[index - 1] ?? null
        }
    }

    function reset(): void {
        order.value = []
        activeId.value = null
    }

    const activeTab = computed<T | null>(() => activeId.value)

    return {
        order: readonly(order),
        activeId,
        activeTab,
        isOpen,
        open,
        activate,
        close,
        reset,
    }
}
