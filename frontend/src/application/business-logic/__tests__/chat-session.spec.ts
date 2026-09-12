import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FeedEvent, FeedMessage } from '@/core/entities'
import type { ChatSessionStatePatch } from '../chat-session.logic'
import { createChatSessionEngine } from '../chat-session.logic'

interface CapturedHandlers {
    onEvent: (event: FeedEvent) => void
    onSeq: (seq: number) => void
    onDone: () => void
    onError: (err: Error) => void
}

function createHarness() {
    const patches: Array<{ chatId: string; patch: ChatSessionStatePatch }> = []
    let captured: CapturedHandlers | null = null
    const engine = createChatSessionEngine({
        messagesRepo: {
            loadHistory: async () => [],
        } as never,
        runsRepo: {
            list: async () => [],
            start: async () => ({ runId: 'run-1' }),
            cancel: async () => true,
        } as never,
        stream: {
            openStream: (_workspaceId: string, _chatId: string, _runId: string, _afterSeq: number, handlers: CapturedHandlers) => {
                captured = handlers
                return () => {}
            },
        } as never,
        onState: (chatId: string, patch: ChatSessionStatePatch) => {
            patches.push({ chatId, patch })
        },
    })
    return { engine, patches, getCaptured: () => captured as unknown as CapturedHandlers }
}

function messagePatches(patches: Array<{ patch: ChatSessionStatePatch }>): FeedMessage[][] {
    return patches.filter((p) => p.patch.messages !== undefined).map((p) => p.patch.messages as FeedMessage[])
}

const ASSISTANT_ID = 'msg-assistant'

function textOpen(): FeedEvent {
    return { type: 'text-open', messageId: ASSISTANT_ID, sliceId: 'txt-0', role: 'assistant' } as FeedEvent
}

function textDelta(delta: string): FeedEvent {
    return { type: 'text-delta', messageId: ASSISTANT_ID, sliceId: 'txt-0', delta, role: 'assistant' } as FeedEvent
}

function textClose(): FeedEvent {
    return { type: 'text-close', messageId: ASSISTANT_ID, sliceId: 'txt-0', role: 'assistant' } as FeedEvent
}

function runClose(): FeedEvent {
    return { type: 'run-close', status: 'done' } as FeedEvent
}

async function startStream(harness: ReturnType<typeof createHarness>): Promise<CapturedHandlers> {
    await harness.engine.sendMessage('ws-1', 'chat-1', 'hello')
    return harness.getCaptured()
}

describe('chat-session delta coalescing', () => {
    const realRaf = globalThis.requestAnimationFrame
    const realCancelRaf = globalThis.cancelAnimationFrame

    afterEach(() => {
        if (realRaf === undefined) delete (globalThis as Record<string, unknown>).requestAnimationFrame
        else globalThis.requestAnimationFrame = realRaf
        if (realCancelRaf === undefined) delete (globalThis as Record<string, unknown>).cancelAnimationFrame
        else globalThis.cancelAnimationFrame = realCancelRaf
        vi.restoreAllMocks()
    })

    it('coalesces text deltas into one store notification per frame', async () => {
        const queued: FrameRequestCallback[] = []
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            queued.push(cb)
            return queued.length
        })
        vi.stubGlobal('cancelAnimationFrame', () => {})

        const harness = createHarness()
        const handlers = await startStream(harness)
        const before = messagePatches(harness.patches).length

        handlers.onEvent(textOpen())
        for (const ch of ['a', 'b', 'c', 'd', 'e']) handlers.onEvent(textDelta(ch))

        // Structural open notified immediately; the 5 deltas are folded into
        // the cache with no store notification yet.
        expect(messagePatches(harness.patches).length).toBe(before + 1)

        for (const cb of queued.splice(0)) cb(0)
        const after = messagePatches(harness.patches)
        expect(after.length).toBe(before + 2)
        const last = after[after.length - 1]!
        const assistant = last.find((m) => m.id === ASSISTANT_ID)!
        expect(assistant.blocks).toEqual([{ kind: 'text', sliceId: 'txt-0', text: 'abcde', closed: false }])
    })

    it('flushes pending text on structural events and run-close', async () => {
        const queued: FrameRequestCallback[] = []
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            queued.push(cb)
            return queued.length
        })
        vi.stubGlobal('cancelAnimationFrame', () => {})

        const harness = createHarness()
        const handlers = await startStream(harness)
        handlers.onEvent(textOpen())
        handlers.onEvent(textDelta('a'))
        handlers.onEvent(textDelta('b'))
        expect(queued.length).toBe(1)

        // text-close is structural: pending text flushes synchronously.
        handlers.onEvent(textClose())
        const afterClose = messagePatches(harness.patches)
        const assistant = afterClose[afterClose.length - 1]!.find((m) => m.id === ASSISTANT_ID)!
        expect(assistant.blocks).toEqual([{ kind: 'text', sliceId: 'txt-0', text: 'ab', closed: true }])

        handlers.onEvent(textOpen())
        handlers.onEvent(textDelta('c'))
        handlers.onEvent(runClose())
        const atEnd = messagePatches(harness.patches)
        const finalAssistant = atEnd[atEnd.length - 1]!.find((m) => m.id === ASSISTANT_ID)!
        expect(finalAssistant.blocks).toEqual([
            { kind: 'text', sliceId: 'txt-0', text: 'ab', closed: true },
            { kind: 'text', sliceId: 'txt-0', text: 'c', closed: false },
        ])
        // Stale frame callbacks superseded by the run-close flush notify nothing.
        const countAtClose = harness.patches.length
        for (const cb of queued.splice(0)) cb(0)
        expect(harness.patches.length).toBe(countAtClose)
    })

    it('falls back to synchronous notify without rAF', async () => {
        vi.stubGlobal('requestAnimationFrame', undefined as unknown as typeof requestAnimationFrame)
        const harness = createHarness()
        const handlers = await startStream(harness)
        const before = messagePatches(harness.patches).length
        handlers.onEvent(textOpen())
        handlers.onEvent(textDelta('x'))
        handlers.onEvent(textDelta('y'))
        // open + 2 deltas, each notified synchronously.
        expect(messagePatches(harness.patches).length).toBe(before + 3)
    })

    it('drops deferred paint on dispose', async () => {
        const queued: FrameRequestCallback[] = []
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            queued.push(cb)
            return queued.length
        })
        vi.stubGlobal('cancelAnimationFrame', () => {})

        const harness = createHarness()
        const handlers = await startStream(harness)
        handlers.onEvent(textOpen())
        handlers.onEvent(textDelta('z'))
        harness.engine.dispose('chat-1')
        const countAfterDispose = harness.patches.length
        for (const cb of queued.splice(0)) cb(0)
        // The cancelled frame must not notify; dispose() itself only
        // detaches (no messages patch for the removed session).
        expect(harness.patches.length).toBe(countAfterDispose)
    })
})
