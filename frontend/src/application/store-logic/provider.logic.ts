import type { ProviderRepository, ModelRepository, SettingsRepository } from '@/core/repositories'
import type { ProviderDto, ModelDto } from '@/core/entities'
import { toMessage } from '@/shared/utils/error.utils'
import type { ProviderStorer } from '../stores/provider.storer'

export interface ProviderLogicDeps {
    providersRepo: ProviderRepository
    modelsRepo: ModelRepository
    settingsRepo: SettingsRepository
}

export interface ProviderStoreLogic {
    fetchProviders(): Promise<void>
    createProvider(dto: ProviderDto): Promise<void>
    updateProvider(id: string, dto: Partial<ProviderDto>): Promise<void>
    deleteProvider(id: string): Promise<void>
    createModel(providerId: string, dto: ModelDto): Promise<void>
    updateModel(providerId: string, modelId: string, dto: Partial<ModelDto>): Promise<void>
    deleteModel(providerId: string, modelId: string): Promise<void>
    fetchDefaultProvider(): Promise<void>
    setDefaultProvider(providerId: string, modelId: string): Promise<void>
}

export function createProviderLogic(
    getStorer: () => ProviderStorer,
    deps: ProviderLogicDeps,
): ProviderStoreLogic {
    async function fetchProviders(): Promise<void> {
        const storer = getStorer()
        storer.setLoading(true)
        storer.clearError()
        try {
            storer.setProviders(await deps.providersRepo.list())
        } catch (e: unknown) {
            storer.setError(toMessage(e) || 'Failed to load providers')
        } finally {
            storer.setLoading(false)
        }
    }

    async function createProvider(dto: ProviderDto): Promise<void> {
        const storer = getStorer()
        storer.clearError()
        try {
            const provider = await deps.providersRepo.create(dto)
            storer.upsertProvider(provider)
        } catch (e: unknown) {
            storer.setError(toMessage(e) || 'Failed to create provider')
            throw e
        }
    }

    async function updateProvider(id: string, dto: Partial<ProviderDto>): Promise<void> {
        const storer = getStorer()
        storer.clearError()
        try {
            const updated = await deps.providersRepo.update(id, dto)
            storer.upsertProvider(updated)
        } catch (e: unknown) {
            storer.setError(toMessage(e) || 'Failed to update provider')
            throw e
        }
    }

    async function deleteProvider(id: string): Promise<void> {
        const storer = getStorer()
        storer.clearError()
        try {
            await deps.providersRepo.remove(id)
            storer.removeProvider(id)
            if (storer.defaultProviderId === id) {
                storer.setDefault(null, null)
            }
        } catch (e: unknown) {
            storer.setError(toMessage(e) || 'Failed to delete provider')
            throw e
        }
    }

    async function createModel(providerId: string, dto: ModelDto): Promise<void> {
        const storer = getStorer()
        storer.clearError()
        try {
            const model = await deps.modelsRepo.create(providerId, dto)
            storer.upsertModel(providerId, model)
        } catch (e: unknown) {
            storer.setError(toMessage(e) || 'Failed to create model')
            throw e
        }
    }

    async function updateModel(
        providerId: string,
        modelId: string,
        dto: Partial<ModelDto>,
    ): Promise<void> {
        const storer = getStorer()
        storer.clearError()
        try {
            const updated = await deps.modelsRepo.update(providerId, modelId, dto)
            storer.upsertModel(providerId, updated)
        } catch (e: unknown) {
            storer.setError(toMessage(e) || 'Failed to update model')
            throw e
        }
    }

    async function deleteModel(providerId: string, modelId: string): Promise<void> {
        const storer = getStorer()
        storer.clearError()
        try {
            await deps.modelsRepo.remove(providerId, modelId)
            storer.removeModel(providerId, modelId)
            if (storer.defaultModelId === modelId) {
                storer.setDefault(storer.defaultProviderId, null)
            }
        } catch (e: unknown) {
            storer.setError(toMessage(e) || 'Failed to delete model')
            throw e
        }
    }

    async function fetchDefaultProvider(): Promise<void> {
        try {
            const data = await deps.settingsRepo.getDefaultProvider()
            getStorer().setDefault(data.providerId, data.modelId)
        } catch {
            /* ignore */
        }
    }

    async function setDefaultProvider(providerId: string, modelId: string): Promise<void> {
        const storer = getStorer()
        storer.clearError()
        try {
            await deps.settingsRepo.setDefaultProvider(providerId, modelId)
            storer.setDefault(providerId, modelId)
        } catch (e: unknown) {
            storer.setError(toMessage(e) || 'Failed to set default provider')
            throw e
        }
    }

    return {
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
}
