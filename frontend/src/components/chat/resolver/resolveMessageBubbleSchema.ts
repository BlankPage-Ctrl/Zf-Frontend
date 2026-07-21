import type { MessageBubbleSchema } from '../types/schema'
import type { ResolvedMessageBubble } from '../types/resolved'
import { resolveMessagePart } from './resolvePartsSchema'

export function resolveMessageBubbleSchema(schema: MessageBubbleSchema): ResolvedMessageBubble {
    return {
        role: schema.role,
        roleLabel: schema.role === 'user' ? 'You' : 'Assistant',
        avatarLabel: schema.role === 'user' ? 'U' : 'AI',
        parts: schema.parts.map(resolveMessagePart),
        contentWidth: schema.contentWidth,
    }
}
