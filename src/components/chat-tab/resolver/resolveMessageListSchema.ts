import type { MessageListSchema } from '../types/schema'
import type { ResolvedMessageList } from '../types/resolved'
import { resolveMessagePart } from './resolvePartsSchema'

export function resolveMessageListSchema(schema: MessageListSchema): ResolvedMessageList {
    return {
        messages: schema.messages.map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            parts: msg.parts.map(resolveMessagePart),
        })),
        loading: !!schema.loading,
        contentWidth: schema.contentWidth,
        emptyMessage: schema.emptyMessage ?? 'Start a conversation',
        emptyHint: schema.emptyHint ?? 'Ask a question or describe a task',
    }
}
