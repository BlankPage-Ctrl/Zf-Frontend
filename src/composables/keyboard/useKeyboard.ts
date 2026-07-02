import { ref, watch, onUnmounted, type Ref, isRef } from 'vue'
import { useEventListener } from '@vueuse/core'
import type { UseKeyboardOptions, KeyboardBindings, KeyBinding } from './types'
import { useKeyboardScope, getTopmostScope } from './useKeyboardScope'

function normalizeBinding(
    binding: KeyboardBindings[string],
): KeyBinding {
    if (typeof binding === 'function') {
        return {
            handler: binding,
            preventDefault: true,
            stopPropagation: false,
        }
    }
    return {
        preventDefault: true,
        stopPropagation: false,
        ...binding,
    }
}

function parseKeyString(keyStr: string): { modifiers: { ctrl: boolean; shift: boolean; alt: boolean; meta: boolean }; key: string } {
    const parts = keyStr.toLowerCase().split('+')
    const key = parts.pop()!
    const modifiers = {
        ctrl: parts.includes('ctrl'),
        shift: parts.includes('shift'),
        alt: parts.includes('alt'),
        meta: parts.includes('meta') || parts.includes('cmd'),
    }
    return { modifiers, key }
}

function matchesKeyBinding(e: KeyboardEvent, keyStr: string): boolean {
    const { modifiers, key } = parseKeyString(keyStr)

    if (modifiers.ctrl !== (e.ctrlKey || e.metaKey)) return false
    if (modifiers.shift !== e.shiftKey) return false
    if (modifiers.alt !== e.altKey) return false
    if (modifiers.meta !== (e.metaKey && !e.ctrlKey)) return false

    return e.key.toLowerCase() === key.toLowerCase()
}

/**
 * useKeyboard just register keyboard listeners within a scope
 *
 * Only the topmost scope in the stack receives keyboard events.
 * This prevents conflicts between components that both listen for keys.
 *
 * @example
 * ```ts
 * // In Dialog.vue
 * const dialogScope = useKeyboardScope()
 *
 * useKeyboard({
 *   scope: dialogScope,
 *   active: isOpen,
 *   bindings: {
 *     Escape: () => closeDialog(),
 *     ArrowDown: { handler: focusNext, preventDefault: true },
 *     'ctrl+k': { handler: search, preventDefault: true },
 *   }
 * })
 * ```
 */
export function useKeyboard(options: UseKeyboardOptions) {
    const {
        scope: providedScope,
        active = true,
        bindings,
        target = 'document',
        eventType = 'keydown',
        priority = 0,
    } = options

    const scope = providedScope ?? useKeyboardScope({ priority })
    const isActive = ref(true)
    const activeRef = isRef(active) ? active : ref(active)

    let cleanupFn: (() => void) | null = null

    function handleKeyEvent(e: KeyboardEvent) {
        const topmost = getTopmostScope()
        if (!topmost || topmost.id !== scope.id) {
            return
        }

        if (!isActive.value) return
        if (!activeRef.value) return

        for (const [keyStr, rawBinding] of Object.entries(bindings)) {
            if (matchesKeyBinding(e, keyStr)) {
                const binding = normalizeBinding(rawBinding)

                if (binding.preventDefault) {
                    e.preventDefault()
                }
                if (binding.stopPropagation) {
                    e.stopPropagation()
                }

                binding.handler(e)
                return
            }
        }
    }

    function setup() {
        cleanupFn?.()
        let targetElement: HTMLElement | Document | Window
        if (target === 'window') {
            targetElement = window
        } else if (target === 'document') {
            targetElement = document
        } else if (isRef(target)) {
            targetElement = target.value ?? document
        } else {
            targetElement = target
        }

        const cleanup = useEventListener(targetElement, eventType, handleKeyEvent)
        cleanupFn = () => cleanup()
    }

    function cleanup() {
        cleanupFn?.()
        cleanupFn = null
    }

    setup()

    if (isRef(activeRef)) {
        watch(activeRef, (newActive) => {
            if (newActive) {
                setup()
            } else {
                cleanup()
            }
        })
    }

    onUnmounted(() => {
        cleanup()
    })

    return {
        pause: () => {
            isActive.value = false
            cleanup()
        },
        resume: () => {
            isActive.value = true
            setup()
        },
        updateBindings: (newBindings: KeyboardBindings) => {
            Object.assign(bindings, newBindings)
        },
        scope,
    }
}

/**
 * useKeyListener version for single key handling
 * Useful when you just need to listen for one key without scope management
 *
 * @example
 * ```ts
 * useKeyListener('Escape', () => closeDialog(), { active: isOpen })
 * ```
 */
export function useKeyListener(
    key: string,
    handler: (e: KeyboardEvent) => void,
    options: {
        active?: Ref<boolean> | boolean
        target?: 'window' | 'document'
        preventDefault?: boolean
    } = {},
) {
    const { active = true, target = 'document', preventDefault = true } = options

    return useKeyboard({
        active,
        target,
        bindings: {
            [key]: { handler, preventDefault },
        },
    })
}
