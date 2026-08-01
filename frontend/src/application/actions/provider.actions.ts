import type { ProviderStoreLogic } from '../store-logic/provider.logic'
import type { ProviderDto, ModelDto } from '@/core/entities'

export interface ProviderActions {
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

export function createProviderActions(logic: ProviderStoreLogic): ProviderActions {
    return {
        fetchProviders: logic.fetchProviders,
        createProvider: logic.createProvider,
        updateProvider: logic.updateProvider,
        deleteProvider: logic.deleteProvider,
        createModel: logic.createModel,
        updateModel: logic.updateModel,
        deleteModel: logic.deleteModel,
        fetchDefaultProvider: logic.fetchDefaultProvider,
        setDefaultProvider: logic.setDefaultProvider,
    }
}
