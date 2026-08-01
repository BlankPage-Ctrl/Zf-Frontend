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
