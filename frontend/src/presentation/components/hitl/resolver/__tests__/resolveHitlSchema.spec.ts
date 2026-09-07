import { describe, it, expect, vi } from 'vitest'
import { resolveHitlDockSchema } from '../resolveHitlSchema'
import type { HitlItemState } from '@/application/stores'
import type { HitlCardCallbacks } from '../../types/schema'

function callbacks(): HitlCardCallbacks {
    return {
        onApprove: vi.fn<HitlCardCallbacks['onApprove']>(),
        onDeny: vi.fn<HitlCardCallbacks['onDeny']>(),
        onAskSubmit: vi.fn<HitlCardCallbacks['onAskSubmit']>(),
        onChoiceSubmit: vi.fn<HitlCardCallbacks['onChoiceSubmit']>(),
        onDismiss: vi.fn<HitlCardCallbacks['onDismiss']>(),
    }
}

function item(request: Record<string, unknown>): HitlItemState {
    return {
        request: {
            id: 'req-1',
            type: 'approval',
            title: 'Shell approval: ls',
            description: null,
            correlationId: null,
            workspaceId: null,
            chatId: 'chat-1',
            executionId: null,
            metadata: {},
            status: 'pending',
            createdAt: null,
            expiresAt: null,
            payload: {},
            ...request,
        } as HitlItemState['request'],
        submitting: false,
        error: null,
    }
}

describe('resolveHitlDockSchema', () => {
    it('maps a shell approval to detail rows', () => {
        const schema = resolveHitlDockSchema(
            [
                item({
                    metadata: { command: 'rm -rf /tmp/x', cwd: '/repo' },
                    payload: {
                        contextPreview: {
                            command: 'rm -rf /tmp/x',
                            cwd: '/repo',
                            matched: { pattern: 'rm -rf *', tier: 'restricted' },
                        },
                    },
                }),
            ],
            callbacks(),
        )
        expect(schema.items).toHaveLength(1)
        const card = schema.items[0]
        expect(card?.type).toBe('approval')
        if (card?.type !== 'approval') return
        expect(card.details).toEqual([
            { key: 'cmd', value: 'rm -rf /tmp/x' },
            { key: 'cwd', value: '/repo' },
            { key: 'match', value: 'rm -rf * (restricted)' },
        ])
        expect(card.requireReasonOnReject).toBe(false)
        expect(card.submitting).toBe(false)
    })

    it('maps ask payload constraints and wizard steps', () => {
        const schema = resolveHitlDockSchema(
            [
                item({
                    type: 'ask',
                    title: 'Name it',
                    payload: {
                        minLength: 2,
                        maxLength: 10,
                        validationRegex: '^[a-z]+$',
                        wizard: {
                            steps: [
                                { key: 'first', prompt: 'First?', placeholder: 'a' },
                                { key: 'bad' },
                            ],
                        },
                    },
                }),
            ],
            callbacks(),
        )
        const card = schema.items[0]
        expect(card?.type).toBe('ask')
        if (card?.type !== 'ask') return
        expect(card.minLength).toBe(2)
        expect(card.maxLength).toBe(10)
        expect(card.validationRegex).toBe('^[a-z]+$')
        expect(card.steps).toEqual([{ key: 'first', prompt: 'First?', placeholder: 'a' }])
    })

    it('maps choice options and normalizes the mode', () => {
        const schema = resolveHitlDockSchema(
            [
                item({
                    type: 'choice',
                    payload: {
                        mode: 'bogus',
                        options: [
                            { id: 'a', title: 'A', recommended: true },
                            { id: '', title: 'Skipped' },
                        ],
                        defaultSelection: ['a', 42],
                        allowOther: true,
                    },
                }),
            ],
            callbacks(),
        )
        const card = schema.items[0]
        expect(card?.type).toBe('choice')
        if (card?.type !== 'choice') return
        expect(card.mode).toBe('single')
        expect(card.options).toEqual([{ id: 'a', title: 'A', recommended: true }])
        expect(card.defaultSelection).toEqual(['a'])
        expect(card.allowOther).toBe(true)
    })

    it('propagates submitting and error state', () => {
        const pending = item({})
        pending.submitting = true
        pending.error = 'boom'
        const schema = resolveHitlDockSchema([pending], callbacks())
        const card = schema.items[0]
        expect(card?.submitting).toBe(true)
        expect(card?.error).toBe('boom')
    })
})
