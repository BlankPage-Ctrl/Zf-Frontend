import {
    List as ListProviders,
    Get as GetProvider,
    Create as CreateProvider,
    Update as UpdateProvider,
    Delete as DeleteProvider,
} from '../../wailsjs/go/providers/Service'
import {
    List as ListModels,
    Create as CreateModel,
    Update as UpdateModel,
    Delete as DeleteModel,
} from '../../wailsjs/go/models/Service'
import { GetDefaultProvider, SetDefaultProvider } from '../../wailsjs/go/settings/Service'

export type ProviderType = 'openai' | 'openai-compatible'

export interface ProviderDto {
    name: string
    type: ProviderType
    apiKey?: string
    baseURL?: string
}

export interface Provider {
    id: string
    name: string
    type: ProviderType
    apiKey?: string
    baseURL?: string
    models: Model[]
    createdAt: string
    updatedAt: string
}

export interface ModelDto {
    modelId: string
    displayName?: string
}

export interface Model {
    id: string
    modelId: string
    displayName?: string
    providerId: string
    createdAt: string
    updatedAt: string
}

export const providersApi = {
    list: () => ListProviders() as Promise<Provider[]>,
    get: (id: string) => GetProvider(id) as Promise<Provider>,
    create: (dto: ProviderDto) => CreateProvider(dto) as Promise<Provider>,
    update: (id: string, dto: Partial<ProviderDto>) => UpdateProvider(id, dto) as Promise<Provider>,
    remove: (id: string) => DeleteProvider(id) as Promise<void>,
}

export const modelsApi = {
    list: (providerId: string) => ListModels(providerId) as Promise<Model[]>,
    create: (providerId: string, dto: ModelDto) => CreateModel(providerId, dto) as Promise<Model>,
    update: (providerId: string, modelId: string, dto: Partial<ModelDto>) =>
        UpdateModel(providerId, modelId, dto) as Promise<Model>,
    remove: (providerId: string, modelId: string) =>
        DeleteModel(providerId, modelId) as Promise<void>,
}

export const settingsApi = {
    getDefaultProvider: () =>
        GetDefaultProvider() as Promise<{ providerId: string | null; modelId: string | null }>,
    setDefaultProvider: (providerId: string, modelId: string) =>
        SetDefaultProvider(providerId, modelId) as Promise<{ providerId: string; modelId: string }>,
}
