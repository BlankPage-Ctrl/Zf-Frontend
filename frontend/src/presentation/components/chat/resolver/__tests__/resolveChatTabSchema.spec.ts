import { describe, it, expect, vi } from 'vitest'
import { resolveChatTabSchema } from '../resolveChatTabSchema'
import type { ChatTabSchema } from '../../types/schema'

function makeSchema(overrides: Partial<ChatTabSchema> = {}): ChatTabSchema {
    return {
        title: 'Chat',
        chatId: 'chat-1',
        hitl: null,
        messages: [],
        providers: [],
        ...overrides,
    }
}

describe('resolveChatTabSchema error banner', () => {
    it('resolves null when no error', () => {
        const resolved = resolveChatTabSchema(makeSchema())
        expect(resolved.errorBanner).toBeNull()
    })

    it('maps message, code and dismiss through', () => {
        const onDismissError = vi.fn<() => void>()
        const resolved = resolveChatTabSchema(
            makeSchema({
                error: { message: 'Slow down', code: 'RATE_LIMITED' },
                onDismissError,
            }),
        )
        expect(resolved.errorBanner).toEqual({
            message: 'Slow down',
            code: 'RATE_LIMITED',
            onDismiss: onDismissError,
        })
    })

    it('omits code and onDismiss when absent', () => {
        const resolved = resolveChatTabSchema(makeSchema({ error: { message: 'boom' } }))
        expect(resolved.errorBanner).toEqual({ message: 'boom' })
    })

    it('passes ttlMs through when present', () => {
        const resolved = resolveChatTabSchema(
            makeSchema({ error: { message: 'boom', ttlMs: 1000 } }),
        )
        expect(resolved.errorBanner).toEqual({ message: 'boom', ttlMs: 1000 })
    })
})
