import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
    providersApi,
    modelsApi,
    type Provider,
    type ProviderDto,
    type ModelDto,
} from '@/services/provider'
import { settingsApi } from '@/services/settings'

function toMessage(e: unknown): string {
    return e instanceof Error ? e.message : 'An error occurred'
}

export const useProviderStore = defineStore('provider', () => {
    const providers = ref<Provider[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    const defaultProviderId = ref<string | null>(null)
    const defaultModelId = ref<string | null>(null)

    function clearError() {
        error.value = null
    }

    async function fetchProviders() {
        loading.value = true
        error.value = null
        try {
            providers.value = await providersApi.list()
        } catch (e: unknown) {
            error.value = toMessage(e) || 'Failed to load providers'
        } finally {
            loading.value = false
        }
    }

    async function createProvider(dto: ProviderDto) {
        error.value = null
        try {
            const provider = await providersApi.create(dto)
            providers.value.push(provider)
        } catch (e: unknown) {
            error.value = toMessage(e) || 'Failed to create provider'
            throw e
        }
    }

    async function updateProvider(id: string, dto: Partial<ProviderDto>) {
        error.value = null
        try {
            const updated = await providersApi.update(id, dto)
            const idx = providers.value.findIndex((p) => p.id === id)
            if (idx !== -1) {
                providers.value[idx] = { ...providers.value[idx], ...updated }
            }
        } catch (e: unknown) {
            error.value = toMessage(e) || 'Failed to update provider'
            throw e
        }
    }

    async function deleteProvider(id: string) {
        error.value = null
        try {
            await providersApi.remove(id)
            providers.value = providers.value.filter((p) => p.id !== id)
            if (defaultProviderId.value === id) {
                defaultProviderId.value = null
                defaultModelId.value = null
            }
        } catch (e: unknown) {
            error.value = toMessage(e) || 'Failed to delete provider'
            throw e
        }
    }

    async function createModel(providerId: string, dto: ModelDto) {
        error.value = null
        try {
            const model = await modelsApi.create(providerId, dto)
            const provider = providers.value.find((p) => p.id === providerId)
            if (provider) {
                provider.models.push(model)
            }
        } catch (e: unknown) {
            error.value = toMessage(e) || 'Failed to create model'
            throw e
        }
    }

    async function updateModel(providerId: string, modelId: string, dto: Partial<ModelDto>) {
        error.value = null
        try {
            const updated = await modelsApi.update(providerId, modelId, dto)
            const provider = providers.value.find((p) => p.id === providerId)
            if (provider) {
                const idx = provider.models.findIndex((m) => m.id === modelId)
                if (idx !== -1) {
                    provider.models[idx] = { ...provider.models[idx], ...updated }
                }
            }
        } catch (e: unknown) {
            error.value = toMessage(e) || 'Failed to update model'
            throw e
        }
    }

    async function deleteModel(providerId: string, modelId: string) {
        error.value = null
        try {
            await modelsApi.remove(providerId, modelId)
            const provider = providers.value.find((p) => p.id === providerId)
            if (provider) {
                provider.models = provider.models.filter((m) => m.id !== modelId)
            }
            if (defaultModelId.value === modelId) {
                defaultModelId.value = null
            }
        } catch (e: unknown) {
            error.value = toMessage(e) || 'Failed to delete model'
            throw e
        }
    }

    async function fetchDefaultProvider() {
        try {
            const data = await settingsApi.getDefaultProvider()
            defaultProviderId.value = data.providerId
            defaultModelId.value = data.modelId
        } catch {}
    }

    async function setDefaultProvider(providerId: string, modelId: string) {
        error.value = null
        try {
            await settingsApi.setDefaultProvider(providerId, modelId)
            defaultProviderId.value = providerId
            defaultModelId.value = modelId
        } catch (e: unknown) {
            error.value = toMessage(e) || 'Failed to set default provider'
            throw e
        }
    }

    return {
        providers,
        loading,
        error,
        defaultProviderId,
        defaultModelId,
        clearError,
        fetchProviders,
        createProvider,
        updateProvider,
        deleteProvider,
        createModel,
        updateModel,
        deleteModel,
        fetchDefaultProvider,
        setDefaultProvider,
    }
})
