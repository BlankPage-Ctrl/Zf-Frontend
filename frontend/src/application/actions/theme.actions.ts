import type { ThemeStoreLogic } from '../store-logic/theme.logic'
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

export function createThemeActions(logic: ThemeStoreLogic): ThemeActions {
    return {
        load: logic.load,
        setTheme: logic.setTheme,
        addCustomTheme: logic.addCustomTheme,
        removeCustomTheme: logic.removeCustomTheme,
        importTheme: logic.importTheme,
        exportTheme: logic.exportTheme,
        getThemePreview: logic.getThemePreview,
    }
}
