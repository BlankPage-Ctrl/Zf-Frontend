import {
    GetDefaultProvider,
    SetDefaultProvider,
    GetValue,
    SetValue,
} from '../../wailsjs/go/settings/Service'

export const settingsApi = {
    getDefaultProvider: () =>
        GetDefaultProvider() as Promise<{ providerId: string | null; modelId: string | null }>,
    setDefaultProvider: (providerId: string, modelId: string) =>
        SetDefaultProvider(providerId, modelId) as Promise<{ providerId: string; modelId: string }>,
    getValue: (key: string) =>
        GetValue(key) as Promise<{ key: string; value: string | null }>,
    setValue: (key: string, value: string) =>
        SetValue(key, value) as Promise<{ key: string; value: string }>,
}
