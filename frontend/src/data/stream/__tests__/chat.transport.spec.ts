import { describe, it, expect, vi, beforeEach } from 'vitest'
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
        startStream: null as
            | null
            | ((workspaceId: string, chatId: string, body: string) => Promise<string>),
        cancelCalls: [] as string[],
        nextId() {
            seq += 1
            return `cs-${seq}`
        },
        reset() {
            seq = 0
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
    StartStream: (workspaceId: string, chatId: string, body: string) =>
        stream.startStream
            ? stream.startStream(workspaceId, chatId, body)
            : Promise.resolve(stream.nextId()),
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
})

describe('createChatFetch', () => {
    it('renders only its own stream with no dropped chunks across requests', async () => {
        const fetchFn = createChatFetch('w', 'c')
        const respA = await fetchFn('http://x', { body })
        const respB = await fetchFn('http://x', { body })

        router.emit('chat:stream-chunk', 'cs-1', '0:{"type":"text","text":"a"}')
        router.emit('chat:stream-chunk', 'cs-1', '0:{"type":"text","text":"b"}')
        router.emit('chat:stream-done', 'cs-1')

        router.emit('chat:stream-chunk', 'cs-2', '0:{"type":"text","text":"x"}')
        router.emit('chat:stream-done', 'cs-2')

        const textA = await readText(respA)
        const textB = await readText(respB)

        expect(textA).toContain('text","text":"a')
        expect(textA).toContain('text","text":"b')
        expect(textA).not.toContain('text","text":"x')
        expect(textB).toContain('text","text":"x')
        expect(textB).not.toContain('text","text":"a')

        expect(router.logs.some((l) => l.includes('DROPPED'))).toBe(false)
        expect(router.handlers.get('chat:stream-chunk')!.length).toBe(1)
        expect(router.handlers.get('chat:stream-done')!.length).toBe(1)
    })

    it('buffers events before StartStream resolves and replays them in order', async () => {
        const { promise, resolve } = deferred()
        stream.startStream = () => promise

        const resp = await createChatFetch('w', 'c')('http://x', { body })

        router.emit('chat:stream-chunk', 'cs-9', '0:first')
        router.emit('chat:stream-chunk', 'cs-9', '0:second')
        router.emit('chat:stream-done', 'cs-9')

        await Promise.resolve()
        resolve('cs-9')
        await Promise.resolve()

        const text = await readText(resp)
        expect(text.indexOf('first')).toBeLessThan(text.indexOf('second'))
        expect(text).toContain('second')
    })

    it('cancels and discards pending when aborted before StartStream resolves', async () => {
        const { promise, resolve } = deferred()
        stream.startStream = () => promise

        const resp = await createChatFetch('w', 'c')('http://x', { body })
        router.emit('chat:stream-chunk', 'cs-7', '0:x')

        await resp.body!.cancel()
        resolve('cs-7')
        await Promise.resolve()

        expect(stream.cancelCalls).toContain('cs-7')
    })

    it('closes on done and errors on backend error', async () => {
        const fetchFn = createChatFetch('w', 'c')
        const resp = await fetchFn('http://x', { body })

        router.emit('chat:stream-error', 'cs-1', 'boom')

        await expect(readText(resp)).rejects.toThrow('boom')
        expect(router.errors.some((e) => e.includes('boom'))).toBe(true)
    })

    it('calls CancelStream on transport cancel', async () => {
        const fetchFn = createChatFetch('w', 'c')
        const resp = await fetchFn('http://x', { body })

        await resp.body!.cancel()

        expect(stream.cancelCalls).toEqual(['cs-1'])
    })

    it('reinstalls a fresh singleton after reset (HMR path)', async () => {
        const first = await createChatFetch('w', 'c')('http://x', { body })
        router.emit('chat:stream-chunk', 'cs-1', '0:a')
        router.emit('chat:stream-done', 'cs-1')
        await expect(readText(first)).resolves.toContain('a')

        resetChatDispatcherGlobal()
        expect(router.handlers.get('chat:stream-chunk')!.length).toBe(0)

        const second = await createChatFetch('w', 'c')('http://x', { body })
        expect(router.handlers.get('chat:stream-chunk')!.length).toBe(1)

        router.emit('chat:stream-chunk', 'cs-2', '0:b')
        router.emit('chat:stream-done', 'cs-2')
        await expect(readText(second)).resolves.toContain('b')
    })
})
