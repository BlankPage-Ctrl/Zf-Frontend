import type { ThemeStoreLogic } from '../store-logic/theme.logic'
import type { ThemeBusinessLogic } from '../business-logic/theme.logic'
import type { ThemeSchema, ThemeColors } from '@/core/entities'

export interface ThemeActions {
    load(): Promise<void>
    setTheme(id: string): void
    addCustomTheme(schema: ThemeSchema): void
    removeCustomTheme(id: string): void
    importTheme(data: unknown): ThemeSchema
    exportTheme(id: string): ThemeSchema | undefined
    getThemePreview(id: string): ThemeColors | undefined
}

export function createThemeActions(
    storeLogic: ThemeStoreLogic,
    businessLogic: ThemeBusinessLogic,
): ThemeActions {
    let loaded = false

    async function load(): Promise<void> {
        const persistence = await businessLogic.load()
        storeLogic.setActiveThemeId(persistence.currentId ?? 'ola')
        storeLogic.setCustomThemes(persistence.customThemes)
        loaded = true
    }

    function setTheme(id: string): void {
        storeLogic.setActiveThemeId(id)
        if (loaded) {
            businessLogic.saveCurrent(id)
        }
    }

    function addCustomTheme(schema: ThemeSchema): void {
        storeLogic.addCustomTheme(schema)
        if (loaded) {
            businessLogic.saveCustomThemes(storeLogic.getCustomThemes())
        }
    }

    function removeCustomTheme(id: string): void {
        storeLogic.removeCustomTheme(id)
        if (loaded) {
            businessLogic.saveCustomThemes(storeLogic.getCustomThemes())
        }
    }

    function importTheme(data: unknown): ThemeSchema {
        return storeLogic.importTheme(data)
    }

    function exportTheme(id: string): ThemeSchema | undefined {
        return storeLogic.exportTheme(id)
    }

    function getThemePreview(id: string): ThemeColors | undefined {
        return storeLogic.getThemePreview(id)
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
