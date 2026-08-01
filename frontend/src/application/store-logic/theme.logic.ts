import type { SettingsRepository } from '@/core/repositories'
import {
    isBuiltInTheme,
    importTheme as coreImportTheme,
    exportTheme as coreExportTheme,
    getThemePreview as coreGetThemePreview,
    type ThemeSchema,
    type ThemeColors,
} from '@/core/entities'
import type { ThemeStorer } from '../stores/theme.storer'

const STORAGE_KEY_CURRENT = 'theme-current'
const STORAGE_KEY_CUSTOM = 'themes-custom'

export interface ThemeStoreLogic {
    load(): Promise<void>
    setTheme(id: string): void
    addCustomTheme(schema: ThemeSchema): void
    removeCustomTheme(id: string): void
    importTheme(data: unknown): ThemeSchema
    exportTheme(id: string): ThemeSchema | undefined
    getThemePreview(id: string): ThemeColors | undefined
}

export function createThemeLogic(
    getStorer: () => ThemeStorer,
    settingsRepo: SettingsRepository,
): ThemeStoreLogic {
    let loaded = false

    function applyTheme(id: string): void {
        document.documentElement.dataset.theme = id
    }

    async function saveCustomThemes(): Promise<void> {
        if (!loaded) return
        try {
            await settingsRepo.setValue(
                STORAGE_KEY_CUSTOM,
                JSON.stringify(getStorer().customThemes),
            )
        } catch {
            /* ignore */
        }
    }

    async function load(): Promise<void> {
        const storer = getStorer()
        try {
            const currentRes = await settingsRepo.getValue(STORAGE_KEY_CURRENT)
            if (currentRes.value) {
                const parsed = JSON.parse(currentRes.value)
                if (typeof parsed.themeId === 'string') {
                    storer.setActiveThemeId(parsed.themeId)
                }
            }
            const customRes = await settingsRepo.getValue(STORAGE_KEY_CUSTOM)
            if (customRes.value) {
                const parsed = JSON.parse(customRes.value)
                if (Array.isArray(parsed)) {
                    storer.setCustomThemes(parsed)
                }
            }
        } catch {
            /* ignore */
        }
        loaded = true
        applyTheme(storer.activeThemeId)
    }

    function setTheme(id: string): void {
        const storer = getStorer()
        storer.setActiveThemeId(id)
        applyTheme(id)
        if (loaded) {
            settingsRepo
                .setValue(STORAGE_KEY_CURRENT, JSON.stringify({ themeId: id }))
                .catch(() => {})
        }
    }

    function addCustomTheme(schema: ThemeSchema): void {
        if (isBuiltInTheme(schema.id)) {
            throw new Error(`Theme id "${schema.id}" is a built-in theme`)
        }
        getStorer().upsertCustomTheme(schema)
        saveCustomThemes()
    }

    function removeCustomTheme(id: string): void {
        if (isBuiltInTheme(id)) return
        getStorer().removeCustomTheme(id)
        if (getStorer().activeThemeId === id) {
            setTheme('ola')
        }
        saveCustomThemes()
    }

    function importTheme(data: unknown): ThemeSchema {
        return coreImportTheme(data)
    }

    function exportTheme(id: string): ThemeSchema | undefined {
        return coreExportTheme(id, getStorer().customThemes)
    }

    function getThemePreview(id: string): ThemeColors | undefined {
        return coreGetThemePreview(id, getStorer().customThemes)
    }

    return {
        load,
        setTheme,
        addCustomTheme,
        removeCustomTheme,
        importTheme,
        exportTheme,
        getThemePreview,
    }
}
