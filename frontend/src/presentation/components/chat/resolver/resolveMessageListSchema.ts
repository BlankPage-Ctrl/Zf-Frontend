import type { MessageListSchema, MessagePartSchema } from '../types/schema'
import type { ResolvedMessage, ResolvedMessageList } from '../types/resolved'
import { resolveMessagePart } from './resolvePartsSchema'

export function resolveMessageListSchema(schema: MessageListSchema): ResolvedMessageList {
    const defaults = { fontSize: schema.fontSize, lineHeight: schema.lineHeight }
    const messages: ResolvedMessage[] = schema.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        parts: (msg.parts ?? [])
            .map((part) => resolveMessagePart(part, defaults))
            .filter((p): p is MessagePartSchema => p !== null),
    }))
    return {
        messages,
        loading: !!schema.loading,
        contentWidth: schema.contentWidth,
        emptyMessage: schema.emptyMessage ?? 'Start a conversation',
        emptyHint: schema.emptyHint ?? 'Ask a question or describe a task',
    }
}
