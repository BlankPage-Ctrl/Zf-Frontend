import { isInsightActiveNotification } from '@/core/entities'
import type { FEInsightNotification, FEInsightSearchParams, FEInsightSearchResult } from '@/core/entities'
import type { InsightRepository, InsightWatchHandlers, InsightWatchPort } from '@/core/repositories'

export interface InsightBusinessLogicDeps {
    repo: InsightRepository
    watch: InsightWatchPort
}

export interface InsightBusinessLogic {
    ensure(workspaceId: string): Promise<void>
    sync(workspaceId: string, force: boolean): Promise<string | null>
    search(workspaceId: string, params: FEInsightSearchParams): Promise<FEInsightSearchResult>
    setEnabled(workspaceId: string, enabled: boolean): Promise<boolean>
    watch(
        workspaceId: string,
        handlers: {
            onStart: () => void
            onDone: (at?: string) => void
            onError?: (error: Event) => void
        },
    ): () => void
}

export function createInsightBusinessLogic(deps: InsightBusinessLogicDeps): InsightBusinessLogic {
    function toWatchHandlers(handlers: {
        onStart: () => void
        onDone: (at?: string) => void
        onError?: (error: Event) => void
    }): InsightWatchHandlers {
        return {
            onEvent: (event: FEInsightNotification) => {
                if (isInsightActiveNotification(event.method)) {
                    handlers.onStart()
                } else {
                    const at = typeof event.params.at === 'string' ? event.params.at : undefined
                    handlers.onDone(at)
                }
            },
            onError: handlers.onError,
        }
    }

    return {
        ensure: async (workspaceId: string): Promise<void> => {
            await deps.repo.ensure(workspaceId)
        },
        sync: async (workspaceId: string, force: boolean): Promise<string | null> => {
            const res = await deps.repo.sync(workspaceId, force)
            return res.at || null
        },
        search: (workspaceId, params) => deps.repo.search(workspaceId, params),
        setEnabled: (workspaceId, enabled) => deps.repo.setEnabled(workspaceId, enabled),
        watch: (workspaceId, handlers) => deps.watch.watch(workspaceId, toWatchHandlers(handlers)),
    }
}
