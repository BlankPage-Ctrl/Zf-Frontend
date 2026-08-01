import { ref, computed, onUnmounted } from 'vue'
import type { KeyboardScope, KeyboardScopeOptions, ScopeEntry } from './types'

/**
 * Global scope stack for manages all keyboard scopes
 * Scopes are processed in LIFO order (last pushed = highest priority)
 */
const scopeStack: ScopeEntry[] = []
let scopeCounter = 0

export function getTopmostScope(): ScopeEntry | undefined {
    for (let i = scopeStack.length - 1; i >= 0; i--) {
        const scope = scopeStack[i]!
        if (!scope.isPaused.value) {
            return scope
        }
    }
    return undefined
}

export function isScopeActive(scopeId: string): boolean {
    const topmost = getTopmostScope()
    return topmost?.id === scopeId
}

export function getScopeStack(): readonly ScopeEntry[] {
    return scopeStack
}

export function findScope(id: string): ScopeEntry | undefined {
    return scopeStack.find((s) => s.id === id)
}

/**
 * useKeyboardScope for creates a keyboard scope with stack-based context management
 *
 * When multiple components need keyboard handlers, only the topmost scope
 * in the stack receives events. This prevents conflicts between e.g. a page
 * and a dialog that both listen for Escape.
 *
 * @example
 * ```ts
 * // Page.vue
 * const pageScope = useKeyboardScope()
 *
 * // Dialog.vue (child)
 * const dialogScope = useKeyboardScope() // Auto-pushes to stack
 * // When dialog opens, pageScope is paused automatically
 * ```
 */
export function useKeyboardScope(options: KeyboardScopeOptions = {}): KeyboardScope {
    const scopeId = options.id ?? `scope-${++scopeCounter}`
    const priority = options.priority ?? 0
    const isPaused = ref(false)
    const isActive = computed(() => {
        if (isPaused.value) return false
        const topmost = getTopmostScope()
        return topmost?.id === scopeId
    })

    const entry: ScopeEntry = {
        id: scopeId,
        priority,
        isActive,
        isPaused,
        bindings: new Map(),
    }

    const currentTop = getTopmostScope()
    if (currentTop) {
        entry.parent = currentTop.id
    }

    scopeStack.push(entry)

    function pause() {
        isPaused.value = true
    }

    function resume() {
        isPaused.value = false
    }

    function destroy() {
        const index = scopeStack.findIndex((s) => s.id === scopeId)
        if (index !== -1) {
            scopeStack.splice(index, 1)
        }
    }

    onUnmounted(() => {
        destroy()
    })

    return {
        id: scopeId,
        isActive,
        pause,
        resume,
        isPaused,
        destroy,
    }
}

export function getParentScope(scopeId: string): ScopeEntry | undefined {
    const scope = findScope(scopeId)
    if (!scope?.parent) return undefined
    return findScope(scope.parent)
}

export function debugScopeStack(): void {
    console.log(
        '[KeyboardScope] Stack:',
        scopeStack.map((s) => ({
            id: s.id,
            priority: s.priority,
            active: s.isActive.value,
            paused: s.isPaused.value,
            bindings: s.bindings.size,
        })),
    )
}
