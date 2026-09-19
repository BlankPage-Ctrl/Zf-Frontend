import type { InsightStoreLogic } from '../store-logic/insight.logic'
import type { InsightBusinessLogic } from '../business-logic/insight.logic'
import type {
    FEInsightSearchParams,
    FEInsightSearchResult,
    FEInsightSyncResult,
} from '@/core/entities'
import { toMessage } from '@/shared/utils/error.utils'

export interface InsightActions {
    ensureOnSelect(workspaceId: string | null): Promise<void>
    sync(workspaceId: string): Promise<void>
    index(workspaceId: string): Promise<FEInsightSyncResult | null>
    refreshIndexStatus(workspaceId: string): Promise<void>
    search(workspaceId: string, params: FEInsightSearchParams): Promise<FEInsightSearchResult | null>
    setEnabled(workspaceId: string, enabled: boolean): Promise<void>
}

export function createInsightActions(
    storeLogic: InsightStoreLogic,
    businessLogic: InsightBusinessLogic,
): InsightActions {
    async function ensureOnSelect(workspaceId: string | null): Promise<void> {
        storeLogic.selectWorkspace(workspaceId)
        if (!workspaceId) return
        storeLogic.beginLoad()
        try {
            await businessLogic.ensure(workspaceId)
            storeLogic.setRunning(true)
            storeLogic.setEnabled(true)
        } catch (e: unknown) {
            const msg = toMessage(e) || 'Failed to ensure insight'
            // Disabled workspaces fail ensure with 503 — not an error state,
            // just mark disabled.
            if (/disabled/i.test(msg)) {
                storeLogic.setEnabled(false)
                storeLogic.setRunning(false)
            } else {
                storeLogic.setError(msg)
            }
        } finally {
            storeLogic.endLoad()
        }
    }

    async function sync(workspaceId: string): Promise<void> {
        storeLogic.beginSync()
        try {
            const at = await businessLogic.sync(workspaceId)
            storeLogic.endSync(at ?? undefined)
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to sync insight')
            storeLogic.endSync()
        }
    }

    async function index(workspaceId: string): Promise<FEInsightSyncResult | null> {
        storeLogic.beginSync()
        try {
            const res = await businessLogic.index(workspaceId)
            storeLogic.endSync()
            return res
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to index insight')
            storeLogic.endSync()
            return null
        }
    }

    async function refreshIndexStatus(workspaceId: string): Promise<void> {
        try {
            const status = await businessLogic.indexStatus(workspaceId)
            storeLogic.setIndexStatus(status)
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to fetch insight index status')
        }
    }

    async function search(
        workspaceId: string,
        params: FEInsightSearchParams,
    ): Promise<FEInsightSearchResult | null> {
        try {
            return await businessLogic.search(workspaceId, params)
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Insight search failed')
            return null
        }
    }

    async function setEnabled(workspaceId: string, enabled: boolean): Promise<void> {
        try {
            const applied = await businessLogic.setEnabled(workspaceId, enabled)
            storeLogic.setEnabled(applied)
            if (!applied) {
                storeLogic.setRunning(false)
            } else {
                await ensureOnSelect(workspaceId)
            }
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to update insight setting')
        }
    }

    return { ensureOnSelect, sync, index, refreshIndexStatus, search, setEnabled }
}
