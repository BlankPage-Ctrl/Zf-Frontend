import type { AppearanceStoreLogic } from '../store-logic/appearance.logic'

export interface AppearanceActions {
    load(): Promise<void>
    setPreset(label: string): void
    setFontSize(size: number): void
}

export function createAppearanceActions(logic: AppearanceStoreLogic): AppearanceActions {
    return {
        load: logic.load,
        setPreset: logic.setPreset,
        setFontSize: logic.setFontSize,
    }
}
