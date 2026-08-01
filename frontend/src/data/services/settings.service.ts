import {
    GetDefaultProvider,
    SetDefaultProvider,
    GetValue,
    SetValue,
} from '../../../wailsjs/go/settings/Service'
import type { SettingsValue, DefaultProvider } from '@/core/entities'
import type { SettingsRepository } from '@/core/repositories'

export const settingsRepository: SettingsRepository = {
    getDefaultProvider: () => GetDefaultProvider() as Promise<DefaultProvider>,
    setDefaultProvider: (providerId: string, modelId: string) =>
        SetDefaultProvider(providerId, modelId) as Promise<DefaultProvider>,
    getValue: (key: string) => GetValue(key) as Promise<SettingsValue>,
    setValue: (key: string, value: string) => SetValue(key, value) as Promise<SettingsValue>,
}
