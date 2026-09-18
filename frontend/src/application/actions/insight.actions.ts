import type { InsightStoreLogic } from '../store-logic/insight.logic'
import type { InsightBusinessLogic } from '../business-logic/insight.logic'
import type { FEInsightSearchParams, FEInsightSearchResult } from '@/core/entities'
import { toMessage } from '@/shared/utils/error.utils'

export interface InsightActions {
    ensureOnSelect(workspaceId: string | null): Promise<void>
    sync(workspaceId: string, force: boolean): Promise<void>
    search(workspaceId: string, params: FEInsightSearchParams): Promise<FEInsightSearchResult | null>
    subscribe(workspaceId: string): void
    unsubscribe(): void
    setForce(force: boolean): void
    setEnabled(workspaceId: string, enabled: boolean): Promise<void>
}

export function createInsightActions(
    storeLogic: InsightStoreLogic,
    businessLogic: InsightBusinessLogic,
): InsightActions {
    let stop: (() => void) | null = null

    function subscribe(workspaceId: string): void {
        unsubscribe()
        stop = businessLogic.watch(workspaceId, {
            onStart: () => storeLogic.beginSync(),
            onDone: (at) => storeLogic.endSync(at),
            onError: () => {},
        })
    }

    function unsubscribe(): void {
        stop?.()
        stop = null
    }

    async function ensureOnSelect(workspaceId: string | null): Promise<void> {
        unsubscribe()
        storeLogic.selectWorkspace(workspaceId)
        if (!workspaceId) return
        storeLogic.beginLoad()
        try {
            await businessLogic.ensure(workspaceId)
            storeLogic.setRunning(true)
            storeLogic.setEnabled(true)
            subscribe(workspaceId)
        } catch (e: unknown) {
            const msg = toMessage(e) || 'Failed to ensure insight'
            // Disabled workspaces fail ensure with 503 — not an error state,
            // just mark disabled and stay unsubscribed.
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

    async function sync(workspaceId: string, force: boolean): Promise<void> {
        storeLogic.beginSync()
        try {
            const at = await businessLogic.sync(workspaceId, force)
            storeLogic.endSync(at ?? undefined)
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to sync insight')
            storeLogic.endSync()
        }
    }

    function setForce(force: boolean): void {
        storeLogic.setForce(force)
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
                unsubscribe()
                storeLogic.setRunning(false)
            } else {
                await ensureOnSelect(workspaceId)
            }
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to update insight setting')
        }
    }

    return { ensureOnSelect, sync, search, subscribe, unsubscribe, setForce, setEnabled }
}
