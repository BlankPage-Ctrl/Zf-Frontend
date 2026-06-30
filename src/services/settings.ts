import { request } from './client.js'

export const settingsApi = {
    getDefaultProvider: () =>
        request<{ providerId: string | null; modelId: string | null }>(
            '/settings/default-provider',
        ),
    setDefaultProvider: (providerId: string, modelId: string) =>
        request<{ providerId: string; modelId: string }>('/settings/default-provider', {
            method: 'PUT',
            body: JSON.stringify({ providerId, modelId }),
        }),
    getValue: (key: string) =>
        request<{ key: string; value: string | null }>(`/settings/${encodeURIComponent(key)}`),
    setValue: (key: string, value: string) =>
        request<{ key: string; value: string }>(`/settings/${encodeURIComponent(key)}`, {
            method: 'PUT',
            body: JSON.stringify({ value }),
        }),
}
