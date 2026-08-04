import type { UIMessage } from 'ai'
import type { MessageListSchema } from '../types/schema'
import type { ResolvedMessage, ResolvedMessageList } from '../types/resolved'
import { resolveMessagePart } from './resolvePartsSchema'

interface MessageCacheEntry {
    defaults: { fontSize?: number; lineHeight?: number }
    resolved: ResolvedMessage
}

const messageCache = new WeakMap<UIMessage, MessageCacheEntry>()

export function resolveMessageListSchema(schema: MessageListSchema): ResolvedMessageList {
    const defaults = { fontSize: schema.fontSize, lineHeight: schema.lineHeight }
    const messages = schema.messages.map((msg) => {
        const cached = messageCache.get(msg)
        if (
            cached &&
            cached.defaults.fontSize === defaults.fontSize &&
            cached.defaults.lineHeight === defaults.lineHeight
        ) {
            return cached.resolved
        }

        const resolved: ResolvedMessage = {
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            parts: (msg.parts ?? []).map((part) => resolveMessagePart(part, defaults)),
        }
        messageCache.set(msg, { defaults, resolved })
        return resolved
    })
    return {
        messages,
        loading: !!schema.loading,
        contentWidth: schema.contentWidth,
        emptyMessage: schema.emptyMessage ?? 'Start a conversation',
        emptyHint: schema.emptyHint ?? 'Ask a question or describe a task',
    }
}
