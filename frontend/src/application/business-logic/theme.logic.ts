import type { SettingsRepository } from '@/core/repositories'
import type { ThemeSchema } from '@/core/entities'

const STORAGE_KEY_CURRENT = 'theme-current'
const STORAGE_KEY_CUSTOM = 'themes-custom'

export interface ThemePersistence {
    currentId: string | null
    customThemes: ThemeSchema[]
}

export interface ThemeBusinessLogic {
    load(): Promise<ThemePersistence>
    saveCurrent(id: string): Promise<void>
    saveCustomThemes(themes: ThemeSchema[]): Promise<void>
}

export function createThemeBusinessLogic(
    settingsRepo: SettingsRepository,
): ThemeBusinessLogic {
    async function load(): Promise<ThemePersistence> {
        const result: ThemePersistence = { currentId: null, customThemes: [] }
        try {
            const currentRes = await settingsRepo.getValue(STORAGE_KEY_CURRENT)
            if (currentRes.value) {
                const parsed = JSON.parse(currentRes.value)
                if (typeof parsed.themeId === 'string') {
                    result.currentId = parsed.themeId
                }
            }
        } catch {
            /* ignore */
        }
        try {
            const customRes = await settingsRepo.getValue(STORAGE_KEY_CUSTOM)
            if (customRes.value) {
                const parsed = JSON.parse(customRes.value)
                if (Array.isArray(parsed)) {
                    result.customThemes = parsed
                }
            }
        } catch {
            /* ignore */
        }
        return result
    }

    async function saveCurrent(id: string): Promise<void> {
        try {
            await settingsRepo.setValue(STORAGE_KEY_CURRENT, JSON.stringify({ themeId: id }))
        } catch {
            /* ignore */
        }
    }

    async function saveCustomThemes(themes: ThemeSchema[]): Promise<void> {
        try {
            await settingsRepo.setValue(STORAGE_KEY_CUSTOM, JSON.stringify(themes))
        } catch {
            /* ignore */
        }
    }

    return {
        load,
        saveCurrent,
        saveCustomThemes,
    }
}
