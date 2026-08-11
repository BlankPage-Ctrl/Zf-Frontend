export interface ChatStreamEventHandlers {
    onChunk(line: string): void
    onDone(): void
    onError(err: string): void
}

export interface ChatStreamDispatcher {
    subscribe(sid: string, handlers: ChatStreamEventHandlers): () => void
    destroy(): void
}

export type EventsOnFn = (event: string, callback: (...data: unknown[]) => void) => () => void

const CHUNK_EVENT = 'chat:stream-chunk'
const DONE_EVENT = 'chat:stream-done'
const ERROR_EVENT = 'chat:stream-error'

export function createChatStreamDispatcher(eventsOn: EventsOnFn): ChatStreamDispatcher {
    const listeners = new Map<string, ChatStreamEventHandlers>()

    const route =
        (kind: 'chunk' | 'done' | 'error') =>
        (...data: unknown[]): void => {
            const sid = data[0] as string
            const handler = listeners.get(sid)
            if (!handler) return
            if (kind === 'chunk') handler.onChunk(data[1] as string)
            else if (kind === 'done') handler.onDone()
            else handler.onError(data[1] as string)
        }

    const unsubscribes = [
        eventsOn(CHUNK_EVENT, route('chunk')),
        eventsOn(DONE_EVENT, route('done')),
        eventsOn(ERROR_EVENT, route('error')),
    ]

    const subscribe = (sid: string, handlers: ChatStreamEventHandlers): (() => void) => {
        listeners.set(sid, handlers)
        return () => {
            listeners.delete(sid)
        }
    }

    const destroy = (): void => {
        unsubscribes.forEach((unsub) => unsub())
        listeners.clear()
    }

    return { subscribe, destroy }
}
