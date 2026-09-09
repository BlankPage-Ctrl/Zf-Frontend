import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRunFetch, resetRunDispatcherGlobal } from '../run.transport'
import type { RunFetchDeps } from '../run.transport'

const router = vi.hoisted(() => {
    const handlers = new Map<string, Array<(...args: unknown[]) => void>>()
    return {
        handlers,
        emit(event: string, ...args: unknown[]) {
            for (const cb of handlers.get(event) ?? []) cb(...args)
        },
    }
})

const backend = vi.hoisted(() => {
    let seq = 0
    return {
        watchIds: [] as string[],
        unwatchCalls: [] as string[],
        startCalls: [] as Array<{ workspaceId: string; chatId: string; body: string }>,
        startResult: { runId: 'run_1', assistantMessageId: 'msg_a', status: 'running' },
        nextId() {
            seq += 1
            return `rw-${seq}`
        },
        reset() {
            seq = 0
            this.watchIds.length = 0
            this.unwatchCalls.length = 0
            this.startCalls.length = 0
            this.startResult = { runId: 'run_1', assistantMessageId: 'msg_a', status: 'running' }
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
}))

vi.mock('../../../../wailsjs/go/stream/RunStreamService', () => ({
    StartRun: (workspaceId: string, chatId: string, body: string) => {
        backend.startCalls.push({ workspaceId, chatId, body })
        return Promise.resolve(backend.startResult)
    },
    WatchRun: (watchId: string) => {
        backend.watchIds.push(watchId)
        return Promise.resolve()
    },
    UnwatchRun: (watchId: string) => {
        backend.unwatchCalls.push(watchId)
        return Promise.resolve()
    },
}))

const postBody = JSON.stringify({ messages: [{ id: 'u1', role: 'user', parts: [] }] })

function makeDeps(overrides: Partial<RunFetchDeps['hooks']> = {}): RunFetchDeps & {
    started: Array<{ chatId: string; runId: string }>
    seqs: Array<{ chatId: string; seq: number }>
} {
    const started: Array<{ chatId: string; runId: string }> = []
    const seqs: Array<{ chatId: string; seq: number }> = []
    let target: { runId: string; afterSeq: number } | undefined = { runId: 'run_9', afterSeq: 0 }
    return {
        started,
        seqs,
        runs: {
            start: (workspaceId: string, chatId: string, message: unknown) => {
                backend.startCalls.push({ workspaceId, chatId, body: JSON.stringify({ message }) })
                return Promise.resolve({
                    runId: 'run_1',
                    assistantMessageId: 'msg_a',
                    status: 'running' as const,
                })
            },
            get: () => Promise.reject(new Error('not used')),
            list: () => Promise.resolve([]),
            cancel: () => Promise.reject(new Error('not used')),
        },
        hooks: {
            onRunStarted: (chatId, runId) => {
                started.push({ chatId, runId })
                overrides.onRunStarted?.(chatId, runId)
            },
            onSeq: (chatId, seq) => {
                seqs.push({ chatId, seq })
                overrides.onSeq?.(chatId, seq)
            },
            getResumeTarget: (chatId) => {
                if (overrides.getResumeTarget) return overrides.getResumeTarget(chatId)
                return target
            },
            clearResumeTarget: (chatId) => {
                target = undefined
                overrides.clearResumeTarget?.(chatId)
            },
        },
    }
}

async function readText(resp: Response): Promise<string> {
    const reader = resp.body!.getReader()
    const parts: string[] = []
    let result: ReadableStreamReadResult<Uint8Array>
    while (!(result = await reader.read()).done) {
        parts.push(new TextDecoder().decode(result.value))
    }
    return parts.join('')
}

beforeEach(() => {
    resetRunDispatcherGlobal()
    router.handlers.clear()
    backend.reset()
    vi.stubGlobal('crypto', {
        ...(globalThis.crypto as object),
        randomUUID: vi.fn<() => string>(() => backend.nextId()),
    })
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('createRunFetch', () => {
    it('starts a run on POST and streams chunks with seq tracking', async () => {
        const deps = makeDeps()
        const resp = await createRunFetch(
            'w',
            'c',
            deps,
        )('http://x', {
            method: 'POST',
            body: postBody,
        })

        expect(backend.startCalls).toHaveLength(1)
        expect(JSON.parse(backend.startCalls[0]!.body)).toEqual({
            message: { id: 'u1', role: 'user', parts: [] },
        })
        expect(deps.started).toEqual([{ chatId: 'c', runId: 'run_1' }])

        const wid = backend.watchIds[0]!
        router.emit('run:chunk', wid, '{"type":"text-delta","id":"t1","delta":"hi","seq":4}')
        router.emit('run:chunk', wid, '{"type":"text-delta","id":"t1","delta":"!","seq":5}')
        router.emit('run:done', wid)

        const text = await readText(resp)
        expect(text).toContain('"delta":"hi"')
        expect(text).toContain('"delta":"!"')
        // Must be valid SSE frames — DefaultChatTransport parses via
        // EventSourceParserStream, which ignores bare JSON lines.
        const events = text.split('\n\n').filter((e) => e.trim().length > 0)
        expect(events).toHaveLength(2)
        for (const event of events) {
            expect(event.startsWith('data: ')).toBe(true)
            expect(() => JSON.parse(event.slice('data: '.length))).not.toThrow()
        }
        expect(deps.seqs).toEqual([
            { chatId: 'c', seq: 4 },
            { chatId: 'c', seq: 5 },
        ])
    })

    it('closes cleanly on user-cancel terminal frame instead of erroring', async () => {
        const deps = makeDeps()
        const resp = await createRunFetch(
            'w',
            'c',
            deps,
        )('http://x', {
            method: 'POST',
            body: postBody,
        })
        const wid = backend.watchIds[0]!
        router.emit('run:error', wid, '{"type":"run-status","runId":"run_1","status":"cancelled"}')
        await expect(readText(resp)).resolves.toEqual('')
    })

    it('errors on failed terminal frame', async () => {
        const deps = makeDeps()
        const resp = await createRunFetch(
            'w',
            'c',
            deps,
        )('http://x', {
            method: 'POST',
            body: postBody,
        })
        const wid = backend.watchIds[0]!
        router.emit(
            'run:error',
            wid,
            '{"type":"run-status","runId":"run_1","status":"failed","message":"boom"}',
        )
        await expect(readText(resp)).rejects.toThrow('failed')
    })

    it('unwatches (does not cancel the run) on transport cancel', async () => {
        const deps = makeDeps()
        const resp = await createRunFetch(
            'w',
            'c',
            deps,
        )('http://x', {
            method: 'POST',
            body: postBody,
        })
        const wid = backend.watchIds[0]!
        await resp.body!.cancel()
        expect(backend.unwatchCalls).toEqual([wid])
    })

    it('throws when no user message is present', async () => {
        const deps = makeDeps()
        await expect(
            createRunFetch(
                'w',
                'c',
                deps,
            )('http://x', {
                method: 'POST',
                body: JSON.stringify({ messages: [] }),
            }),
        ).rejects.toThrow('no user message')
    })

    it('resumes via GET using the pending resume target', async () => {
        let cleared = false
        const deps = makeDeps({
            clearResumeTarget: () => {
                cleared = true
            },
        })
        const resp = await createRunFetch('w', 'c', deps)('http://x', { method: 'GET' })
        expect(backend.startCalls).toHaveLength(0)
        expect(backend.watchIds).toHaveLength(1)
        expect(cleared).toBe(true)

        const wid = backend.watchIds[0]!
        router.emit('run:chunk', wid, '{"type":"finish","finishReason":"stop","seq":9}')
        router.emit('run:done', wid)
        const text = await readText(resp)
        expect(text).toContain('finishReason')
    })

    it('returns 204 on GET without a resume target', async () => {
        const deps = makeDeps({
            getResumeTarget: () => undefined,
            clearResumeTarget: () => {},
        })
        const resp = await createRunFetch('w', 'c', deps)('http://x', { method: 'GET' })
        expect(resp.status).toBe(204)
        expect(backend.watchIds).toHaveLength(0)
    })
})
