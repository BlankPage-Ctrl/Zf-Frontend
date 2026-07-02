import type { ChatTabSchema } from '../types/schema'
import type { ResolvedChatTab } from '../types/resolved'
import { resolveChatInputSchema } from './resolveChatInputSchema'
import { resolveMessageListSchema } from './resolveMessageListSchema'

export function resolveChatTabSchema(schema: ChatTabSchema): ResolvedChatTab {
    return {
        header: {
            title: schema.title,
        },
        messageList: resolveMessageListSchema({
            messages: schema.messages,
            loading: schema.loading,
            contentWidth: schema.contentWidth,
            emptyMessage: schema.emptyMessage,
            emptyHint: schema.emptyHint,
        }),
        input: resolveChatInputSchema({
            disabled: schema.loading,
            modelId: schema.modelId,
            providerId: schema.providerId,
            providers: schema.providers,
            onSend: schema.onSend,
            onStop: schema.onStop,
            onSelectModel: schema.onSelectModel,
        }),
    }
}
