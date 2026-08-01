import {
    isBuiltInTheme,
    importTheme as coreImportTheme,
    exportTheme as coreExportTheme,
    getThemePreview as coreGetThemePreview,
    type ThemeSchema,
    type ThemeColors,
} from '@/core/entities'
import type { ThemeStorer } from '../stores/theme.storer'

export interface ThemeStoreLogic {
    setActiveThemeId(id: string): void
    setCustomThemes(list: ThemeSchema[]): void
    addCustomTheme(schema: ThemeSchema): void
    removeCustomTheme(id: string): void
    importTheme(data: unknown): ThemeSchema
    exportTheme(id: string): ThemeSchema | undefined
    getThemePreview(id: string): ThemeColors | undefined
    getCustomThemes(): ThemeSchema[]
}

export function createThemeStoreLogic(getStorer: () => ThemeStorer): ThemeStoreLogic {
    function applyTheme(id: string): void {
        document.documentElement.dataset.theme = id
    }

    function setActiveThemeId(id: string): void {
        getStorer().setActiveThemeId(id)
        applyTheme(id)
    }

    function setCustomThemes(list: ThemeSchema[]): void {
        getStorer().setCustomThemes(list)
    }

    function addCustomTheme(schema: ThemeSchema): void {
        if (isBuiltInTheme(schema.id)) {
            throw new Error(`Theme id "${schema.id}" is a built-in theme`)
        }
        getStorer().upsertCustomTheme(schema)
    }

    function removeCustomTheme(id: string): void {
        if (isBuiltInTheme(id)) return
        getStorer().removeCustomTheme(id)
        if (getStorer().activeThemeId === id) {
            setActiveThemeId('ola')
        }
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

    function getCustomThemes(): ThemeSchema[] {
        return getStorer().customThemes
    }

    return {
        setActiveThemeId,
        setCustomThemes,
        addCustomTheme,
        removeCustomTheme,
        importTheme,
        exportTheme,
        getThemePreview,
        getCustomThemes,
    }
}
