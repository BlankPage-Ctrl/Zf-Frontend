import { describe, it, expect, vi } from 'vitest'
import { createChatStreamDispatcher, type EventsOnFn } from '../chat.dispatcher'

function createFakeEventsOn() {
    const handlers = new Map<string, Array<(...args: unknown[]) => void>>()
    const eventsOn = vi.fn<EventsOnFn>(((event: string, cb: (...args: unknown[]) => void) => {
        const arr = handlers.get(event) ?? []
        arr.push(cb)
        handlers.set(event, arr)
        return () => {
            const current = handlers.get(event)!
            const idx = current.indexOf(cb)
            if (idx >= 0) current.splice(idx, 1)
        }
    }) as EventsOnFn)
    const emit = (event: string, ...args: unknown[]) => {
        for (const cb of handlers.get(event) ?? []) cb(...args)
    }
    return { eventsOn, emit, handlers }
}

const handlersFor = () => ({
    onChunk: vi.fn<(line: string) => void>(),
    onDone: vi.fn<() => void>(),
    onError: vi.fn<(err: string) => void>(),
})

describe('createChatStreamDispatcher', () => {
    it('installs one listener per channel, once', () => {
        const { eventsOn } = createFakeEventsOn()
        const d = createChatStreamDispatcher(eventsOn)
        expect(eventsOn).toHaveBeenCalledTimes(3)
        const d2 = createChatStreamDispatcher(eventsOn)
        expect(eventsOn).toHaveBeenCalledTimes(6)
        // each dispatcher owns its own listeners, no cross-talk
        d.destroy()
        d2.destroy()
        expect(eventsOn).toHaveBeenCalledTimes(6)
    })

    it('routes chunks only to the matching subscriber', () => {
        const { eventsOn, emit } = createFakeEventsOn()
        const d = createChatStreamDispatcher(eventsOn)
        const a = handlersFor()
        const b = handlersFor()
        d.subscribe('cs-a', a)
        d.subscribe('cs-b', b)

        emit('chat:stream-chunk', 'cs-a', 'hello')

        expect(a.onChunk).toHaveBeenCalledWith('hello')
        expect(b.onChunk).not.toHaveBeenCalled()
        d.destroy()
    })

    it('buffers events before subscribe and replays them in order', () => {
        const { eventsOn, emit } = createFakeEventsOn()
        const d = createChatStreamDispatcher(eventsOn)

        emit('chat:stream-chunk', 'cs-9', 'first')
        emit('chat:stream-chunk', 'cs-9', 'second')
        emit('chat:stream-done', 'cs-9')

        const h = handlersFor()
        d.subscribe('cs-9', h)

        expect(h.onChunk.mock.calls.map((c) => c[0])).toEqual(['first', 'second'])
        expect(h.onDone).toHaveBeenCalledTimes(1)
        d.destroy()
    })

    it('does not duplicate on replay for events that already had a subscriber', () => {
        const { eventsOn, emit } = createFakeEventsOn()
        const d = createChatStreamDispatcher(eventsOn)
        const h = handlersFor()
        d.subscribe('cs-a', h)

        emit('chat:stream-chunk', 'cs-a', 'live')
        emit('chat:stream-chunk', 'cs-b', 'other')

        expect(h.onChunk).toHaveBeenCalledTimes(1)
        d.destroy()
    })

    it('unsubscribe stops routing', () => {
        const { eventsOn, emit } = createFakeEventsOn()
        const d = createChatStreamDispatcher(eventsOn)
        const h = handlersFor()
        const unsub = d.subscribe('cs-a', h)

        unsub()
        emit('chat:stream-chunk', 'cs-a', 'gone')

        expect(h.onChunk).not.toHaveBeenCalled()
        d.destroy()
    })

    it('discard removes the subscriber and pending events for that sid', () => {
        const { eventsOn, emit } = createFakeEventsOn()
        const d = createChatStreamDispatcher(eventsOn)
        const h = handlersFor()

        emit('chat:stream-chunk', 'cs-x', 'buffered')
        d.subscribe('cs-x', h)
        emit('chat:stream-chunk', 'cs-x', 'second')

        d.discard('cs-x')
        emit('chat:stream-chunk', 'cs-x', 'after')

        expect(h.onChunk.mock.calls.map((c) => c[0])).toEqual(['buffered', 'second'])
        // 'after' goes back to pending, not to the removed subscriber
        d.destroy()
    })

    it('error is routed to the matching subscriber', () => {
        const { eventsOn, emit } = createFakeEventsOn()
        const d = createChatStreamDispatcher(eventsOn)
        const h = handlersFor()
        d.subscribe('cs-a', h)

        emit('chat:stream-error', 'cs-a', 'boom')

        expect(h.onError).toHaveBeenCalledWith('boom')
        d.destroy()
    })

    it('destroy unregisters channel listeners', () => {
        const { eventsOn, emit } = createFakeEventsOn()
        const d = createChatStreamDispatcher(eventsOn)
        const h = handlersFor()
        d.subscribe('cs-a', h)

        d.destroy()
        emit('chat:stream-chunk', 'cs-a', 'after-destroy')

        expect(h.onChunk).not.toHaveBeenCalled()
    })

    it('keeps per-stream ordering when multiple streams interleave', () => {
        const { eventsOn, emit } = createFakeEventsOn()
        const d = createChatStreamDispatcher(eventsOn)
        const a = {
            onChunk: vi.fn<(line: string) => void>(),
            onDone: vi.fn<() => void>(),
            onError: vi.fn<(err: string) => void>(),
        }
        const b = {
            onChunk: vi.fn<(line: string) => void>(),
            onDone: vi.fn<() => void>(),
            onError: vi.fn<(err: string) => void>(),
        }
        d.subscribe('cs-a', a)
        d.subscribe('cs-b', b)

        emit('chat:stream-chunk', 'cs-a', 'a1')
        emit('chat:stream-chunk', 'cs-b', 'b1')
        emit('chat:stream-chunk', 'cs-a', 'a2')
        emit('chat:stream-done', 'cs-b')
        emit('chat:stream-chunk', 'cs-a', 'a3')

        expect(a.onChunk.mock.calls.map((c) => c[0])).toEqual(['a1', 'a2', 'a3'])
        expect(b.onChunk.mock.calls.map((c) => c[0])).toEqual(['b1'])
        expect(b.onDone).toHaveBeenCalledTimes(1)
        d.destroy()
    })
})
