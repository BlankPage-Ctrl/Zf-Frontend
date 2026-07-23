import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { settingsApi } from '@/services/settings'

const STORAGE_KEY_CURRENT = 'theme-current'
const STORAGE_KEY_CUSTOM = 'themes-custom'

export interface ThemeColors {
    bgPrimary: string
    bgSecondary: string
    border: string
    textPrimary: string
    success: string
    danger: string
    shadow: string
}

export interface ThemeSchema {
    id: string
    name: string
    description?: string
    colors: ThemeColors
}

export interface ThemeMeta {
    id: string
    name: string
    description?: string
    builtIn: boolean
}

export const BUILT_IN_THEMES: ThemeSchema[] = [
    {
        id: 'ola',
        name: 'Ola',
        description: 'Warm cream beige — current default',
        colors: {
            bgPrimary: '255, 250, 243',
            bgSecondary: '255, 242, 219',
            border: '255, 229, 191',
            textPrimary: '19, 16, 16',
            success: '34, 197, 93',
            danger: '246, 36, 64',
            shadow: '200, 180, 150',
        },
    },
    {
        id: 'day',
        name: 'Day',
        description: 'Clean white, crisp and minimal',
        colors: {
            bgPrimary: '255, 255, 255',
            bgSecondary: '248, 249, 250',
            border: '233, 236, 239',
            textPrimary: '33, 37, 41',
            success: '34, 197, 93',
            danger: '246, 36, 64',
            shadow: '180, 180, 180',
        },
    },
    {
        id: 'night',
        name: 'Night',
        description: 'Dark mode, easy on the eyes',
        colors: {
            bgPrimary: '34, 34, 40',
            bgSecondary: '44, 44, 52',
            border: '56, 56, 64',
            textPrimary: '215, 215, 225',
            success: '68, 220, 120',
            danger: '255, 90, 110',
            shadow: '90, 90, 100',
        },
    },
]

const BUILT_IN_IDS = new Set(BUILT_IN_THEMES.map((t) => t.id))

let loaded = false

export const useThemeStore = defineStore('theme', () => {
    const activeThemeId = ref('ola')
    const customThemes = ref<ThemeSchema[]>([])

    const availableThemes = computed<ThemeMeta[]>(() => {
        const builtIn: ThemeMeta[] = BUILT_IN_THEMES.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            builtIn: true,
        }))
        const custom: ThemeMeta[] = customThemes.value.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            builtIn: false,
        }))
        return [...builtIn, ...custom]
    })

    const activeTheme = computed(() => {
        const builtIn = BUILT_IN_THEMES.find((t) => t.id === activeThemeId.value)
        if (builtIn) return builtIn
        const custom = customThemes.value.find((t) => t.id === activeThemeId.value)
        return custom ?? BUILT_IN_THEMES[0]
    })

    function applyTheme(id: string) {
        document.documentElement.dataset.theme = id
    }

    function setTheme(id: string) {
        activeThemeId.value = id
        applyTheme(id)
    }

    function addCustomTheme(schema: ThemeSchema) {
        if (BUILT_IN_IDS.has(schema.id)) {
            throw new Error(`Theme id "${schema.id}" is a built-in theme`)
        }
        const existing = customThemes.value.findIndex((t) => t.id === schema.id)
        if (existing >= 0) {
            customThemes.value[existing] = schema
        } else {
            customThemes.value.push(schema)
        }
        saveCustomThemes()
    }

    function removeCustomTheme(id: string) {
        if (BUILT_IN_IDS.has(id)) return
        customThemes.value = customThemes.value.filter((t) => t.id !== id)
        if (activeThemeId.value === id) {
            setTheme('ola')
        }
        saveCustomThemes()
    }

    function importTheme(data: unknown): ThemeSchema {
        const schema = data as Record<string, unknown>
        if (!schema.id || !schema.name || !schema.colors) {
            throw new Error('Invalid theme format: missing id, name, or colors')
        }
        const colors = schema.colors as Record<string, unknown>
        const required = [
            'bgPrimary',
            'bgSecondary',
            'border',
            'textPrimary',
            'success',
            'danger',
            'shadow',
        ] as const
        for (const key of required) {
            if (typeof colors[key] !== 'string') {
                throw new Error(`Invalid theme format: missing color "${key}"`)
            }
        }
        const result: ThemeSchema = {
            id: String(schema.id).replace(/[^a-zA-Z0-9_-]/g, '_'),
            name: String(schema.name),
            description: schema.description ? String(schema.description) : undefined,
            colors: {
                bgPrimary: colors.bgPrimary as string,
                bgSecondary: colors.bgSecondary as string,
                border: colors.border as string,
                textPrimary: colors.textPrimary as string,
                success: colors.success as string,
                danger: colors.danger as string,
                shadow: colors.shadow as string,
            },
        }
        if (BUILT_IN_IDS.has(result.id)) {
            throw new Error(`Theme id "${result.id}" conflicts with a built-in theme`)
        }
        return result
    }

    function exportTheme(id: string): ThemeSchema | undefined {
        const builtIn = BUILT_IN_THEMES.find((t) => t.id === id)
        if (builtIn) return { ...builtIn }
        const custom = customThemes.value.find((t) => t.id === id)
        if (custom) return { ...custom }
        return undefined
    }

    function getThemePreview(id: string): ThemeColors | undefined {
        const builtIn = BUILT_IN_THEMES.find((t) => t.id === id)
        if (builtIn) return { ...builtIn.colors }
        const custom = customThemes.value.find((t) => t.id === id)
        if (custom) return { ...custom.colors }
        return undefined
    }

    async function saveCustomThemes() {
        if (!loaded) return
        try {
            await settingsApi.setValue(STORAGE_KEY_CUSTOM, JSON.stringify(customThemes.value))
        } catch {
            /* ignore */
        }
    }

    async function load() {
        try {
            const currentRes = await settingsApi.getValue(STORAGE_KEY_CURRENT)
            if (currentRes.value) {
                const parsed = JSON.parse(currentRes.value)
                if (typeof parsed.themeId === 'string') {
                    activeThemeId.value = parsed.themeId
                }
            }
            const customRes = await settingsApi.getValue(STORAGE_KEY_CUSTOM)
            if (customRes.value) {
                const parsed = JSON.parse(customRes.value)
                if (Array.isArray(parsed)) {
                    customThemes.value = parsed
                }
            }
        } catch {
            /* ignore */
        }
        loaded = true
        applyTheme(activeThemeId.value)
    }

    watch(activeThemeId, async (v) => {
        if (!loaded) return
        applyTheme(v)
        try {
            await settingsApi.setValue(STORAGE_KEY_CURRENT, JSON.stringify({ themeId: v }))
        } catch {
            /* ignore */
        }
    })

    return {
        activeThemeId,
        customThemes,
        availableThemes,
        activeTheme,
        setTheme,
        addCustomTheme,
        removeCustomTheme,
        importTheme,
        exportTheme,
        getThemePreview,
        load,
    }
})
