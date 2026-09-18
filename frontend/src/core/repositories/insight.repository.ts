import type {
    FEInsightNotification,
    FEInsightSearchParams,
    FEInsightSearchResult,
    FEInsightStatus,
    FEInsightSyncAccepted,
} from '@/core/entities'

export interface InsightWatchHandlers {
    onEvent: (event: FEInsightNotification) => void
    onError?: (error: Event) => void
}

export interface InsightRepository {
    ensure(workspaceId: string): Promise<FEInsightStatus>
    status(workspaceId: string): Promise<FEInsightStatus>
    stop(workspaceId: string): Promise<void>
    sync(workspaceId: string, force: boolean): Promise<FEInsightSyncAccepted>
    search(workspaceId: string, params: FEInsightSearchParams): Promise<FEInsightSearchResult>
    isEnabled(workspaceId: string): Promise<boolean>
    setEnabled(workspaceId: string, enabled: boolean): Promise<boolean>
}

export interface InsightWatchPort {
    watch(workspaceId: string, handlers: InsightWatchHandlers): () => void
}
