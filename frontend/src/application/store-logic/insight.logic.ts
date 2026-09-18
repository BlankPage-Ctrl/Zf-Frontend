import type { InsightStorer } from '../stores/insight.storer'

export interface InsightStoreLogic {
    selectWorkspace(id: string | null): void
    beginSync(): void
    endSync(at?: string): void
    setRunning(running: boolean): void
    setEnabled(enabled: boolean): void
    setForce(force: boolean): void
    setError(message: string | null): void
    beginLoad(): void
    endLoad(): void
}

export function createInsightStoreLogic(getStorer: () => InsightStorer): InsightStoreLogic {
    return {
        selectWorkspace: (id) => getStorer().selectWorkspace(id),
        beginSync: () => {
            getStorer().syncing = true
            getStorer().error = null
        },
        endSync: (at) => {
            const storer = getStorer()
            storer.syncing = false
            if (at) storer.lastSyncAt = at
        },
        setRunning: (running) => {
            getStorer().running = running
        },
        setEnabled: (enabled) => {
            getStorer().enabled = enabled
        },
        setForce: (force) => getStorer().setForce(force),
        setError: (message) => {
            getStorer().error = message
        },
        beginLoad: () => {
            getStorer().loading = true
        },
        endLoad: () => {
            getStorer().loading = false
        },
    }
}
