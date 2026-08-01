import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { BUILT_IN_THEMES, type ThemeSchema, type ThemeMeta } from '@/core/entities'

export const useThemeStorer = defineStore('theme', () => {
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

    function setActiveThemeId(id: string): void {
        activeThemeId.value = id
    }

    function setCustomThemes(list: ThemeSchema[]): void {
        customThemes.value = list
    }

    function upsertCustomTheme(schema: ThemeSchema): void {
        const existing = customThemes.value.findIndex((t) => t.id === schema.id)
        if (existing >= 0) {
            customThemes.value[existing] = schema
        } else {
            customThemes.value.push(schema)
        }
    }

    function removeCustomTheme(id: string): void {
        customThemes.value = customThemes.value.filter((t) => t.id !== id)
    }

    return {
        activeThemeId,
        customThemes,
        availableThemes,
        activeTheme,
        setActiveThemeId,
        setCustomThemes,
        upsertCustomTheme,
        removeCustomTheme,
    }
})

export type ThemeStorer = ReturnType<typeof useThemeStorer>
