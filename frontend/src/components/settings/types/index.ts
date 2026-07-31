import type { Provider } from '@/services/provider'
import type { ThemeMeta } from '@/stores/theme'

export interface SettingsTheme extends ThemeMeta {
    swatches: string[]
}

export interface ProviderSectionProps {
    providers: Provider[]
    loading: boolean
    error: string | null
    defaultProviderId: string | null
    defaultModelId: string | null
}

export interface AppearanceSectionProps {
    preset: string
    fontSize: number
    presets: readonly { readonly label: string; readonly fontSize: number }[]
}

export interface ThemeSectionProps {
    themes: SettingsTheme[]
    activeThemeId: string | null
}
