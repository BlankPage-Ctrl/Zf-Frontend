export interface ChatStreamEventHandlers {
    onChunk(line: string): void
    onDone(): void
    onError(err: string): void
}

export interface ChatStreamDispatcher {
    subscribe(sid: string, handlers: ChatStreamEventHandlers): () => void
    discard(sid: string): void
    destroy(): void
}

export type EventsOnFn = (event: string, callback: (...data: unknown[]) => void) => () => void

type PendingEvent =
    | { kind: 'chunk'; sid: string; line: string }
    | { kind: 'done'; sid: string }
    | { kind: 'error'; sid: string; err: string }

const CHUNK_EVENT = 'chat:stream-chunk'
const DONE_EVENT = 'chat:stream-done'
const ERROR_EVENT = 'chat:stream-error'
const MAX_PENDING = 2048

export function createChatStreamDispatcher(eventsOn: EventsOnFn): ChatStreamDispatcher {
    const listeners = new Map<string, ChatStreamEventHandlers>()
    const unsubscribes: Array<() => void> = []
    let pending: PendingEvent[] = []

    const trimPending = (): void => {
        if (pending.length > MAX_PENDING) {
            pending.splice(0, pending.length - MAX_PENDING)
        }
    }

    const route = (event: PendingEvent): void => {
        const handler = listeners.get(event.sid)
        if (handler) {
            if (event.kind === 'chunk') handler.onChunk(event.line)
            else if (event.kind === 'done') handler.onDone()
            else handler.onError(event.err)
            return
        }
        pending.push(event)
        trimPending()
    }

    const onChunk = (...data: unknown[]): void => {
        const [sid, line] = data as [string, string]
        route({ kind: 'chunk', sid, line })
    }
    const onDone = (...data: unknown[]): void => {
        const [sid] = data as unknown as [string]
        route({ kind: 'done', sid })
    }
    const onError = (...data: unknown[]): void => {
        const [sid, err] = data as [string, string]
        route({ kind: 'error', sid, err })
    }

    const replayPending = (sid: string, handler: ChatStreamEventHandlers): void => {
        if (pending.length === 0) return
        const kept: PendingEvent[] = []
        for (const event of pending) {
            if (event.sid !== sid) {
                kept.push(event)
                continue
            }
            if (event.kind === 'chunk') handler.onChunk(event.line)
            else if (event.kind === 'done') handler.onDone()
            else handler.onError(event.err)
        }
        pending = kept
    }

    const subscribe = (sid: string, handlers: ChatStreamEventHandlers): (() => void) => {
        listeners.set(sid, handlers)
        replayPending(sid, handlers)
        return () => {
            listeners.delete(sid)
        }
    }

    const discard = (sid: string): void => {
        listeners.delete(sid)
        pending = pending.filter((event) => event.sid !== sid)
    }

    if (unsubscribes.length === 0) {
        unsubscribes.push(
            eventsOn(CHUNK_EVENT, onChunk),
            eventsOn(DONE_EVENT, onDone),
            eventsOn(ERROR_EVENT, onError),
        )
    }

    const destroy = (): void => {
        unsubscribes.forEach((unsub) => unsub())
        unsubscribes.length = 0
        listeners.clear()
        pending = []
    }

    return { subscribe, discard, destroy }
}
