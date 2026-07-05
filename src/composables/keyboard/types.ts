import type { Ref } from 'vue'

export interface KeyModifiers {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
}

export interface KeyBinding {
    handler: (e: KeyboardEvent) => void
    preventDefault?: boolean
    stopPropagation?: boolean
    exclusive?: boolean
}

export type KeyboardBindings = Record<string, KeyBinding | ((e: KeyboardEvent) => void)>

export interface KeyboardScopeOptions {
    active?: Ref<boolean> | boolean
    inherit?: boolean
    priority?: number
    id?: string
}

export interface KeyboardScope {
    readonly id: string
    readonly isActive: Ref<boolean>
    pause: () => void
    resume: () => void
    readonly isPaused: Ref<boolean>
    destroy: () => void
}

export interface UseKeyboardOptions {
    scope?: KeyboardScope
    active?: Ref<boolean> | boolean
    bindings: KeyboardBindings
    target?: Ref<HTMLElement | null> | HTMLElement | 'window' | 'document'
    eventType?: 'keydown' | 'keyup' | 'keypress'
    priority?: number
}

export interface ShortcutConfig {
    key: string
    modifiers?: KeyModifiers
    handler: (e: KeyboardEvent) => void
    priority?: number
    disabled?: Ref<boolean> | boolean
    description?: string
    preventDefault?: boolean
    stopPropagation?: boolean
}

export interface ShortcutManager {
    register: (config: ShortcutConfig) => () => void
    unregister: (id: string) => void
    enable: (id: string) => void
    disable: (id: string) => void
    getAll: () => ShortcutConfig[]
}

export interface ScopeEntry {
    id: string
    priority: number
    isActive: Ref<boolean>
    isPaused: Ref<boolean>
    bindings: Map<string, KeyBinding>
    parent?: string
}
