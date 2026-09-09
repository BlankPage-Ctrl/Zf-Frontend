import type { MessageListSchema } from '../types/schema'
import type { ResolvedMessage, ResolvedMessageList } from '../types/resolved'
import { resolveMessageParts } from './resolvePartsSchema'

export function resolveMessageListSchema(schema: MessageListSchema): ResolvedMessageList {
    const defaults = { fontSize: schema.fontSize, lineHeight: schema.lineHeight }
    const messages: ResolvedMessage[] = schema.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        parts: resolveMessageParts(msg.parts ?? [], defaults),
    }))
    return {
        messages,
        loading: !!schema.loading,
        contentWidth: schema.contentWidth,
        emptyMessage: schema.emptyMessage ?? 'Start a conversation',
        emptyHint: schema.emptyHint ?? 'Ask a question or describe a task',
    }
}
