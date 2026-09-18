import {
    Ensure,
    GetStatus,
    Stop,
    Sync,
    Search,
    IsEnabled,
    SetEnabled,
} from '../../../wailsjs/go/insight/Service'
import type {
    FEInsightSearchParams,
    FEInsightSearchResult,
    FEInsightStatus,
    FEInsightSyncAccepted,
} from '@/core/entities'
import type { InsightRepository } from '@/core/repositories'

function toStatus(raw: unknown): FEInsightStatus {
    const r = (raw ?? {}) as Record<string, unknown>
    return {
        workspaceId: typeof r.workspaceId === 'string' ? r.workspaceId : '',
        enabled: r.enabled !== false,
        running: r.running === true,
        projectPath: typeof r.projectPath === 'string' ? r.projectPath : '',
    }
}

export const insightRepository: InsightRepository = {
    ensure: async (workspaceId: string) => toStatus((await Ensure(workspaceId)) as unknown),
    status: async (workspaceId: string) => toStatus((await GetStatus(workspaceId)) as unknown),
    stop: async (workspaceId: string): Promise<void> => {
        await Stop(workspaceId)
    },
    sync: async (workspaceId: string, force: boolean): Promise<FEInsightSyncAccepted> => {
        const raw = ((await Sync(workspaceId, force)) as unknown) as Record<string, unknown>
        return {
            accepted: raw.accepted === true,
            force: raw.force === true,
            at: typeof raw.at === 'string' ? raw.at : '',
        }
    },
    search: async (workspaceId: string, params: FEInsightSearchParams): Promise<FEInsightSearchResult> => {
        const raw = ((await Search(workspaceId, {
            query: params.query,
            mode: params.mode ?? '',
            limit: params.limit ?? 0,
            file: params.file ?? '',
            container: params.container ?? '',
        })) as unknown) as Record<string, unknown>
        const hits = Array.isArray(raw.hits) ? raw.hits : []
        return {
            query: typeof raw.query === 'string' ? raw.query : params.query,
            hits: hits as FEInsightSearchResult['hits'],
            stats: (raw.stats ?? {}) as Record<string, number>,
        }
    },
    isEnabled: (workspaceId: string) => IsEnabled(workspaceId) as Promise<boolean>,
    setEnabled: (workspaceId: string, enabled: boolean) =>
        SetEnabled(workspaceId, enabled) as Promise<boolean>,
}
