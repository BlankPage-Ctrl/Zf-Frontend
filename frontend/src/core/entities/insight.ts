export type FEInsightSearchMode = 'auto' | 'exact' | 'prefix' | 'substring' | 'fts'

export interface FEInsightSearchHit {
    id: string
    name: string
    kind: string
    filePath: string
    lineRange: { start: number; end: number }
}

export interface FEInsightSearchResult {
    query: string
    hits: FEInsightSearchHit[]
    stats: Record<string, number>
}

export interface FEInsightSearchParams {
    query: string
    mode?: FEInsightSearchMode
    limit?: number
    file?: string
    container?: string
}

export interface FEInsightSyncAccepted {
    accepted: boolean
    force: boolean
    at: string
}

export interface FEInsightStatus {
    workspaceId: string
    enabled: boolean
    running: boolean
    projectPath: string
}

export type FEInsightNotificationMethod =
    | 'sync/start'
    | 'sync/done'
    | 'incrementalUpdate/start'
    | 'incrementalUpdate/done'

export interface FEInsightNotification {
    method: FEInsightNotificationMethod
    params: Record<string, unknown>
}

const INSIGHT_NOTIFICATION_METHODS: readonly string[] = [
    'sync/start',
    'sync/done',
    'incrementalUpdate/start',
    'incrementalUpdate/done',
]

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseInsightNotification(raw: string): FEInsightNotification | null {
    let parsed: unknown
    try {
        parsed = JSON.parse(raw) as unknown
    } catch {
        return null
    }
    if (!isRecord(parsed) || typeof parsed.method !== 'string') return null
    if (!INSIGHT_NOTIFICATION_METHODS.includes(parsed.method)) return null
    const params = isRecord(parsed.params) ? parsed.params : {}
    return { method: parsed.method as FEInsightNotificationMethod, params }
}

/** True while an index pass is in flight (dot shows active color). */
export function isInsightActiveNotification(method: FEInsightNotificationMethod): boolean {
    return method === 'sync/start' || method === 'incrementalUpdate/start'
}
