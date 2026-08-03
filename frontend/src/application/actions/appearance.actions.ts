import type { AppearanceStoreLogic } from '../store-logic/appearance.logic'
import type { AppearanceBusinessLogic } from '../business-logic/appearance.logic'

export interface AppearanceActions {
    load(): Promise<void>
    setPreset(label: string): void
    setFontSize(size: number): void
}

export function createAppearanceActions(
    storeLogic: AppearanceStoreLogic,
    businessLogic: AppearanceBusinessLogic,
): AppearanceActions {
    let loaded = false

    async function load(): Promise<void> {
        const fontSize = await businessLogic.load()
        if (fontSize !== null) {
            storeLogic.setFontSize(fontSize)
        }
        loaded = true
    }

    function setPreset(label: string): void {
        storeLogic.setPreset(label)
        if (loaded) {
            businessLogic.save(storeLogic.getFontSize())
        }
    }

    function setFontSize(size: number): void {
        storeLogic.setFontSize(size)
        if (loaded) {
            businessLogic.save(size)
        }
    }

    return {
        load,
        setPreset,
        setFontSize,
    }
}
