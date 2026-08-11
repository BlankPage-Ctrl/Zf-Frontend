import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createChatFetch, resetChatDispatcherGlobal } from '../chat.transport'

const router = vi.hoisted(() => {
    const handlers = new Map<string, Array<(...args: unknown[]) => void>>()
    return {
        handlers,
        logs: [] as string[],
        errors: [] as string[],
        emit(event: string, ...args: unknown[]) {
            for (const cb of handlers.get(event) ?? []) cb(...args)
        },
    }
})

const stream = vi.hoisted(() => {
    let seq = 0
    return {
        seq: 0,
        sids: [] as string[],
        startStream: null as
            | null
            | ((sid: string, workspaceId: string, chatId: string, body: string) => Promise<string>),
        cancelCalls: [] as string[],
        nextId() {
            seq += 1
            return `cs-${seq}`
        },
        reset() {
            seq = 0
            this.sids.length = 0
        },
    }
})

vi.mock('../../../../wailsjs/runtime', () => ({
    EventsOn: (event: string, cb: (...args: unknown[]) => void) => {
        const arr = router.handlers.get(event) ?? []
        arr.push(cb)
        router.handlers.set(event, arr)
        return () => {
            const current = router.handlers.get(event)!
            const idx = current.indexOf(cb)
            if (idx >= 0) current.splice(idx, 1)
        }
    },
    EventsOff: vi.fn<(eventName: string) => void>(),
    LogInfo: (msg: string) => {
        router.logs.push(msg)
    },
    LogError: (msg: string) => {
        router.errors.push(msg)
    },
}))

vi.mock('../../../../wailsjs/go/stream/ChatStreamService', () => ({
    StartStream: (sid: string, workspaceId: string, chatId: string, body: string) => {
        stream.sids.push(sid)
        return stream.startStream
            ? stream.startStream(sid, workspaceId, chatId, body)
            : Promise.resolve()
    },
    CancelStream: (id: string) => {
        stream.cancelCalls.push(id)
        return Promise.resolve()
    },
}))

const body = JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] })

async function readText(resp: Response): Promise<string> {
    const reader = resp.body!.getReader()
    const parts: string[] = []
    let result: ReadableStreamReadResult<Uint8Array>
    while (!(result = await reader.read()).done) {
        parts.push(new TextDecoder().decode(result.value))
    }
    return parts.join('')
}

function deferred() {
    let resolve!: (id: string) => void
    const promise = new Promise<string>((res) => {
        resolve = res
    })
    return { promise, resolve }
}

beforeEach(() => {
    resetChatDispatcherGlobal()
    router.handlers.clear()
    router.logs.length = 0
    router.errors.length = 0
    stream.startStream = null
    stream.cancelCalls.length = 0
    stream.reset()
    vi.stubGlobal('crypto', {
        ...(globalThis.crypto as object),
        randomUUID: vi.fn<() => string>(() => stream.nextId()),
    })
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('createChatFetch', () => {
    it('renders only its own stream with no dropped chunks across requests', async () => {
        const fetchFn = createChatFetch('w', 'c')
        const respA = await fetchFn('http://x', { body })
        const respB = await fetchFn('http://x', { body })
        const sidA = stream.sids[0]
        const sidB = stream.sids[1]

        router.emit('chat:stream-chunk', sidA, '0:{"type":"text","text":"a"}')
        router.emit('chat:stream-chunk', sidA, '0:{"type":"text","text":"b"}')
        router.emit('chat:stream-done', sidA)

        router.emit('chat:stream-chunk', sidB, '0:{"type":"text","text":"x"}')
        router.emit('chat:stream-done', sidB)

        const textA = await readText(respA)
        const textB = await readText(respB)

        expect(textA).toContain('text","text":"a')
        expect(textA).toContain('text","text":"b')
        expect(textA).not.toContain('text","text":"x')
        expect(textB).toContain('text","text":"x')
        expect(textB).not.toContain('text","text":"a')

        expect(router.handlers.get('chat:stream-chunk')!.length).toBe(1)
        expect(router.handlers.get('chat:stream-done')!.length).toBe(1)
    })

    it('routes chunks in order and closes on done', async () => {
        const resp = await createChatFetch('w', 'c')('http://x', { body })
        const sid = stream.sids[0]

        router.emit('chat:stream-chunk', sid, '0:first')
        router.emit('chat:stream-chunk', sid, '0:second')
        router.emit('chat:stream-done', sid)

        const text = await readText(resp)
        expect(text.indexOf('first')).toBeLessThan(text.indexOf('second'))
        expect(text).toContain('second')
    })

    it('cancels the stream when aborted before StartStream resolves', async () => {
        const { promise, resolve } = deferred()
        stream.startStream = () => promise

        const resp = await createChatFetch('w', 'c')('http://x', { body })
        const sid = stream.sids[0]!

        await resp.body!.cancel()
        resolve(sid)
        await Promise.resolve()

        expect(stream.cancelCalls).toContain(sid)
    })

    it('errors when the backend stream errors', async () => {
        const resp = await createChatFetch('w', 'c')('http://x', { body })
        const sid = stream.sids[0]

        router.emit('chat:stream-error', sid, 'boom')

        await expect(readText(resp)).rejects.toThrow('boom')
    })

    it('calls CancelStream on transport cancel', async () => {
        const resp = await createChatFetch('w', 'c')('http://x', { body })
        const sid = stream.sids[0]

        await resp.body!.cancel()

        expect(stream.cancelCalls).toEqual([sid])
    })

    it('reinstalls a fresh singleton after reset (HMR path)', async () => {
        const first = await createChatFetch('w', 'c')('http://x', { body })
        router.emit('chat:stream-chunk', stream.sids[0], '0:a')
        router.emit('chat:stream-done', stream.sids[0])
        await expect(readText(first)).resolves.toContain('a')

        resetChatDispatcherGlobal()
        expect(router.handlers.get('chat:stream-chunk')!.length).toBe(0)

        const second = await createChatFetch('w', 'c')('http://x', { body })
        expect(router.handlers.get('chat:stream-chunk')!.length).toBe(1)

        router.emit('chat:stream-chunk', stream.sids[1], '0:b')
        router.emit('chat:stream-done', stream.sids[1])
        await expect(readText(second)).resolves.toContain('b')
    })
})
