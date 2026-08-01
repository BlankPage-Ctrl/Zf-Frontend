import type { SettingsRepository } from '@/core/repositories'
import { APPEARANCE_PRESETS } from '@/core/entities'
import type { AppearanceStorer } from '../stores/appearance.storer'

const STORAGE_KEY = 'appearance'

export interface AppearanceStoreLogic {
    load(): Promise<void>
    setPreset(label: string): void
    setFontSize(size: number): void
}

export function createAppearanceLogic(
    getStorer: () => AppearanceStorer,
    settingsRepo: SettingsRepository,
): AppearanceStoreLogic {
    let loaded = false

    function persist(): void {
        if (!loaded) return
        settingsRepo
            .setValue(STORAGE_KEY, JSON.stringify({ fontSize: getStorer().fontSize }))
            .catch(() => {})
    }

    async function load(): Promise<void> {
        try {
            const res = await settingsRepo.getValue(STORAGE_KEY)
            if (res.value) {
                const parsed = JSON.parse(res.value)
                if (typeof parsed.fontSize === 'number') {
                    getStorer().setFontSize(parsed.fontSize)
                }
            }
        } catch {
            /* ignore */
        }
        loaded = true
    }

    function setPreset(label: string): void {
        const match = APPEARANCE_PRESETS.find((p) => p.label === label)
        if (!match) return
        getStorer().setFontSize(match.fontSize)
        persist()
    }

    function setFontSize(size: number): void {
        getStorer().setFontSize(size)
        persist()
    }

    return {
        load,
        setPreset,
        setFontSize,
    }
}
