import { describe, it, expect } from 'vitest'
import type { FeedBlock, FeedMessage } from '@/core/entities'
import { resolveMessageBubbleSchema } from '../resolveMessageBubbleSchema'
import { resolveMessageListSchema } from '../resolveMessageListSchema'

function textBlock(text: string): FeedBlock {
    return { kind: 'text', sliceId: 'txt-0', text, closed: true } as FeedBlock
}

function userMessage(id: string, text: string): FeedMessage {
    return {
        id,
        role: 'user',
        blocks: [textBlock(text)],
    } as FeedMessage
}

describe('resolveMessageBubbleSchema copy', () => {
    it('exposes joined text and canCopy for user messages', () => {
        const resolved = resolveMessageBubbleSchema({
            role: 'user',
            blocks: [textBlock('hello'), textBlock('world')],
            messageId: 'm-1',
            onEditMessage: () => {},
        })
        expect(resolved.copyText).toBe('hello\nworld')
        expect(resolved.canCopy).toBe(true)
        expect(resolved.canEdit).toBe(true)
    })

    it('disables copy for empty user text', () => {
        const resolved = resolveMessageBubbleSchema({
            role: 'user',
            blocks: [textBlock('   ')],
            messageId: 'm-1',
            onEditMessage: () => {},
        })
        expect(resolved.copyText).toBe('   ')
        expect(resolved.canCopy).toBe(false)
    })

    it('disables copy for assistant messages', () => {
        const resolved = resolveMessageBubbleSchema({
            role: 'assistant',
            blocks: [textBlock('answer')],
            messageId: 'm-2',
        })
        expect(resolved.copyText).toBe('')
        expect(resolved.canCopy).toBe(false)
        expect(resolved.canEdit).toBe(false)
    })
})

describe('resolveMessageListSchema copy', () => {
    it('fills copyText and canCopy per message', () => {
        const resolved = resolveMessageListSchema({
            messages: [userMessage('u-1', 'hello')],
            emptyMessage: 'empty',
            emptyHint: 'hint',
            onEditMessage: () => {},
        })
        expect(resolved.messages).toHaveLength(1)
        expect(resolved.messages[0]!.copyText).toBe('hello')
        expect(resolved.messages[0]!.canCopy).toBe(true)
    })
})
