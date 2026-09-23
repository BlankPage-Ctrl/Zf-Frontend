import type { MessageListSchema } from '../types/schema'
import type { ResolvedMessage, ResolvedMessageList } from '../types/resolved'
import { resolveMessageParts } from './resolvePartsSchema'
import { canCopyText, resolveCopyText } from './resolveCopyText'

export function resolveMessageListSchema(schema: MessageListSchema): ResolvedMessageList {
    const defaults = { fontSize: schema.fontSize, lineHeight: schema.lineHeight }
    const messages: ResolvedMessage[] = schema.messages.map((msg) => {
        const copyText = msg.role === 'user' ? resolveCopyText(msg.blocks) : ''
        return {
            id: msg.id,
            role: msg.role,
            parts: resolveMessageParts(msg.blocks ?? [], defaults),
            copyText,
            canCopy: canCopyText(msg.role, copyText),
        }
    })
    return {
        messages,
        loading: !!schema.loading,
        contentWidth: schema.contentWidth,
        emptyMessage: schema.emptyMessage ?? 'Start a conversation',
        emptyHint: schema.emptyHint ?? 'Ask a question or describe a task',
        onEditMessage: schema.onEditMessage,
    }
}
