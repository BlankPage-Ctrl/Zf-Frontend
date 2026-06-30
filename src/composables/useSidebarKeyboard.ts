import { useEventListener } from '@vueuse/core'

export function useSidebarKeyboard(toggle: () => void) {
    useEventListener(window, 'keydown', (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault()
            toggle()
        }
    })
}
