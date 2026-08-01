export interface ThemeColors {
    bgPrimary: string
    bgSecondary: string
    border: string
    textPrimary: string
    success: string
    danger: string
    shadow: string
}

export interface ThemeSchema {
    id: string
    name: string
    description?: string
    colors: ThemeColors
}

export interface ThemeMeta {
    id: string
    name: string
    description?: string
    builtIn: boolean
}

export const BUILT_IN_THEMES: ThemeSchema[] = [
    {
        id: 'ola',
        name: 'Ola',
        description: 'Warm cream beige — current default',
        colors: {
            bgPrimary: '255, 250, 243',
            bgSecondary: '255, 242, 219',
            border: '242, 210, 160',
            textPrimary: '19, 16, 16',
            success: '34, 197, 93',
            danger: '246, 36, 64',
            shadow: '200, 180, 150',
        },
    },
    {
        id: 'day',
        name: 'Day',
        description: 'Clean white, crisp and minimal',
        colors: {
            bgPrimary: '255, 255, 255',
            bgSecondary: '248, 249, 250',
            border: '215, 220, 228',
            textPrimary: '33, 37, 41',
            success: '34, 197, 93',
            danger: '246, 36, 64',
            shadow: '180, 180, 180',
        },
    },
    {
        id: 'night',
        name: 'Night',
        description: 'Dark mode, easy on the eyes',
        colors: {
            bgPrimary: '34, 34, 40',
            bgSecondary: '44, 44, 52',
            border: '68, 68, 80',
            textPrimary: '215, 215, 225',
            success: '68, 220, 120',
            danger: '255, 90, 110',
            shadow: '90, 90, 100',
        },
    },
]

const BUILT_IN_IDS = new Set(BUILT_IN_THEMES.map((t) => t.id))

export function isBuiltInTheme(id: string): boolean {
    return BUILT_IN_IDS.has(id)
}

export function getTheme(id: string, customThemes: ThemeSchema[]): ThemeSchema | undefined {
    const builtIn = BUILT_IN_THEMES.find((t) => t.id === id)
    if (builtIn) return builtIn
    return customThemes.find((t) => t.id === id)
}

export function getThemePreview(id: string, customThemes: ThemeSchema[]): ThemeColors | undefined {
    const theme = getTheme(id, customThemes)
    return theme ? { ...theme.colors } : undefined
}

export function exportTheme(id: string, customThemes: ThemeSchema[]): ThemeSchema | undefined {
    const theme = getTheme(id, customThemes)
    return theme ? { ...theme } : undefined
}

export function importTheme(data: unknown): ThemeSchema {
    const schema = data as Record<string, unknown>
    if (!schema.id || !schema.name || !schema.colors) {
        throw new Error('Invalid theme format: missing id, name, or colors')
    }
    const colors = schema.colors as Record<string, unknown>
    const required = [
        'bgPrimary',
        'bgSecondary',
        'border',
        'textPrimary',
        'success',
        'danger',
        'shadow',
    ] as const
    for (const key of required) {
        if (typeof colors[key] !== 'string') {
            throw new Error(`Invalid theme format: missing color "${key}"`)
        }
    }
    const result: ThemeSchema = {
        id: String(schema.id).replace(/[^a-zA-Z0-9_-]/g, '_'),
        name: String(schema.name),
        description: schema.description ? String(schema.description) : undefined,
        colors: {
            bgPrimary: colors.bgPrimary as string,
            bgSecondary: colors.bgSecondary as string,
            border: colors.border as string,
            textPrimary: colors.textPrimary as string,
            success: colors.success as string,
            danger: colors.danger as string,
            shadow: colors.shadow as string,
        },
    }
    if (isBuiltInTheme(result.id)) {
        throw new Error(`Theme id "${result.id}" conflicts with a built-in theme`)
    }
    return result
}
