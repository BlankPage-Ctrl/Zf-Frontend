import type { SettingsRepository } from '@/core/repositories'

const STORAGE_KEY = 'appearance'

export interface AppearanceBusinessLogic {
    load(): Promise<number | null>
    save(fontSize: number): Promise<void>
}

export function createAppearanceBusinessLogic(
    settingsRepo: SettingsRepository,
): AppearanceBusinessLogic {
    async function load(): Promise<number | null> {
        try {
            const res = await settingsRepo.getValue(STORAGE_KEY)
            if (res.value) {
                const parsed = JSON.parse(res.value)
                if (typeof parsed.fontSize === 'number') {
                    return parsed.fontSize
                }
            }
        } catch {
            /* ignore */
        }
        return null
    }

    async function save(fontSize: number): Promise<void> {
        try {
            await settingsRepo.setValue(STORAGE_KEY, JSON.stringify({ fontSize }))
        } catch {
            /* ignore */
        }
    }

    return {
        load,
        save,
    }
}
