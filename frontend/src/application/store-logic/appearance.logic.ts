import { APPEARANCE_PRESETS } from '@/core/entities'
import type { AppearanceStorer } from '../stores/appearance.storer'

export interface AppearanceStoreLogic {
    setFontSize(size: number): void
    setPreset(label: string): void
    getFontSize(): number
}

export function createAppearanceStoreLogic(
    getStorer: () => AppearanceStorer,
): AppearanceStoreLogic {
    function setFontSize(size: number): void {
        getStorer().setFontSize(size)
    }

    function setPreset(label: string): void {
        const match = APPEARANCE_PRESETS.find((p) => p.label === label)
        if (!match) return
        getStorer().setFontSize(match.fontSize)
    }

    function getFontSize(): number {
        return getStorer().fontSize
    }

    return {
        setFontSize,
        setPreset,
        getFontSize,
    }
}
