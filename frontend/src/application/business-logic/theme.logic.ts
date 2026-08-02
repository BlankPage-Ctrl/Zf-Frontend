import type { SettingsRepository } from '@/core/repositories'

const STORAGE_KEY_CURRENT = 'theme-current'

export interface ThemePersistence {
    currentId: string | null
}

export interface ThemeBusinessLogic {
    load(): Promise<ThemePersistence>
    saveCurrent(id: string): Promise<void>
}

export function createThemeBusinessLogic(
    settingsRepo: SettingsRepository,
): ThemeBusinessLogic {
    async function load(): Promise<ThemePersistence> {
        const result: ThemePersistence = { currentId: null }
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
        return result
    }

    async function saveCurrent(id: string): Promise<void> {
        try {
            await settingsRepo.setValue(STORAGE_KEY_CURRENT, JSON.stringify({ themeId: id }))
        } catch {
            /* ignore */
        }
    }

    return {
        load,
        saveCurrent,
    }
}
