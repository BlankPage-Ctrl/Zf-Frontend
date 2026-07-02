import { ref, onUnmounted, unref, isRef } from 'vue'
import { useEventListener } from '@vueuse/core'
import type { ShortcutConfig } from './types'

/**
 * Global shortcut registry tracks all registered shortcuts
 * Ensures no conflicts between shortcuts
 */
const shortcutRegistry = new Map<string, {
    config: ShortcutConfig
    cleanup: () => void
}>()

let shortcutCounter = 0

function generateShortcutId(config: ShortcutConfig): string {
    return `shortcut-${config.key}-${JSON.stringify(config.modifiers)}-${++shortcutCounter}`
}

function buildKeyString(config: ShortcutConfig): string {
    const parts: string[] = []
    if (config.modifiers?.ctrl) parts.push('Ctrl')
    if (config.modifiers?.shift) parts.push('Shift')
    if (config.modifiers?.alt) parts.push('Alt')
    if (config.modifiers?.meta) parts.push('Cmd')
    parts.push(config.key.toUpperCase())
    return parts.join('+')
}

function matchesShortcut(e: KeyboardEvent, config: ShortcutConfig): boolean {
    const { modifiers = {}, key } = config

    if (modifiers.ctrl && !(e.ctrlKey || e.metaKey)) return false
    if (modifiers.shift && !e.shiftKey) return false
    if (modifiers.alt && !e.altKey) return false
    if (modifiers.meta && !e.metaKey) return false
    return e.key.toLowerCase() === key.toLowerCase()
}

/**
 * useShortcut for Register global keyboard shortcuts
 *
 * These shortcuts bypass the scope system and always listen on window.
 * Use this for app-wide shortcuts like Ctrl+S (save), Ctrl+Q (quit), etc.
 *
 * @example
 * ```ts
 * // App-wide save shortcut
 * useShortcut({
 *   key: 's',
 *   modifiers: { ctrl: true },
 *   handler: () => saveDocument(),
 *   description: 'Save current document',
 * })
 *
 * // Toggle sidebar
 * useShortcut({
 *   key: 'b',
 *   modifiers: { ctrl: true },
 *   handler: () => toggleSidebar(),
 *   priority: 10,
 * })
 * ```
 */
export function useShortcut(config: ShortcutConfig) {
    const {
        handler,
        priority = 0,
        disabled = false,
        description = '',
        preventDefault = true,
        stopPropagation = false,
    } = config

    const id = generateShortcutId(config)
    const disabledRef = isRef(disabled) ? disabled : ref(disabled)
    const keyString = buildKeyString(config)

    function handleKeyDown(e: KeyboardEvent) {
        if (disabledRef.value) return
        if (!matchesShortcut(e, config)) return

        const conflictingShortcut = findConflictingShortcut(config, priority)
        if (conflictingShortcut) {
            console.warn(
                `[useShortcut] Conflict detected: "${keyString}" conflicts with "${buildKeyString(conflictingShortcut.config)}" (priority: ${conflictingShortcut.config.priority ?? 0} > ${priority})`
            )
            return // Higher priority shortcut exists, skip this one
        }

        if (preventDefault) {
            e.preventDefault()
        }
        if (stopPropagation) {
            e.stopPropagation()
        }

        handler(e)
    }

    function findConflictingShortcut(
        config: ShortcutConfig,
        currentPriority: number,
    ): { config: ShortcutConfig; cleanup: () => void } | undefined {
        for (const [, entry] of shortcutRegistry) {
            if (entry.config.key === config.key &&
                JSON.stringify(entry.config.modifiers) === JSON.stringify(config.modifiers) &&
                (entry.config.priority ?? 0) > currentPriority) {
                return entry
            }
        }
        return undefined
    }

    function cleanup() {
        const entry = shortcutRegistry.get(id)
        if (entry) {
            entry.cleanup()
            shortcutRegistry.delete(id)
        }
    }

    const cleanupListener = useEventListener(window, 'keydown', handleKeyDown)
    shortcutRegistry.set(id, {
        config: { ...config, description },
        cleanup: () => {
            cleanupListener()
        },
    })

    onUnmounted(() => {
        cleanup()
    })

    return {
        id,
        keyString,
        disable: () => {
            disabledRef.value = true
        },
        enable: () => {
            disabledRef.value = false
        },
        isDisabled: () => disabledRef.value,
        destroy: cleanup,
    }
}

/**
 * useShortcutGroup for Register multiple shortcuts at once
 *
 * @example
 * ```ts
 * useShortcutGroup([
 *   { key: 's', modifiers: { ctrl: true }, handler: save },
 *   { key: 'z', modifiers: { ctrl: true }, handler: undo },
 *   { key: 'y', modifiers: { ctrl: true }, handler: redo },
 * ])
 * ```
 */
export function useShortcutGroup(shortcuts: ShortcutConfig[]) {
    const instances = shortcuts.map((config) => useShortcut(config))

    return {
        disableAll: () => instances.forEach((s) => s.disable()),
        enableAll: () => instances.forEach((s) => s.enable()),
        destroyAll: () => instances.forEach((s) => s.destroy()),
        instances,
    }
}

export function getRegisteredShortcuts(): Array<{
    id: string
    keyString: string
    description: string
    priority: number
    disabled: boolean
}> {
    const result: Array<{
        id: string
        keyString: string
        description: string
        priority: number
        disabled: boolean
    }> = []

    for (const [id, entry] of shortcutRegistry) {
        result.push({
            id,
            keyString: buildKeyString(entry.config),
            description: entry.config.description ?? '',
            priority: entry.config.priority ?? 0,
            disabled: unref(entry.config.disabled) ?? false,
        })
    }

    return result
}

export function debugShortcuts(): void {
    const shortcuts = getRegisteredShortcuts()
    console.log('[useShortcut] Registered shortcuts:', shortcuts)
}
