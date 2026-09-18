import { StartWatch, StopWatch } from '../../../wailsjs/go/stream/InsightWatchService'
import { EventsOn, EventsOff } from '../../../wailsjs/runtime'
import { parseInsightNotification } from '@/core/entities'
import type { InsightWatchHandlers, InsightWatchPort } from '@/core/repositories'

export const insightWatch: InsightWatchPort = {
    watch: (workspaceId: string, handlers: InsightWatchHandlers): (() => void) => {
        let streamId: string | null = null
        let active = true
        let cleanup: (() => void)[] = []

        const handleEvent = (sid: string, raw: string) => {
            if (!active || sid !== streamId) return
            const event = parseInsightNotification(raw)
            if (event) handlers.onEvent(event)
        }

        const handleError = (sid: string, errMsg: string) => {
            if (!active || sid !== streamId) return
            console.error('[Insight] watch error:', errMsg)
            handlers.onError?.(new Event('error'))
        }

        cleanup = [
            EventsOn('insight:watch-event', handleEvent),
            EventsOn('insight:watch-error', handleError),
        ]

        StartWatch(workspaceId).then((id) => {
            if (!active) {
                StopWatch(id)
                return
            }
            streamId = id
        })

        return () => {
            active = false
            cleanup.forEach((fn) => fn())
            EventsOff('insight:watch-event')
            EventsOff('insight:watch-error')
            if (streamId) StopWatch(streamId)
        }
    },
}
