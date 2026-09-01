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
            fontSize: schema.fontSize,
            lineHeight: schema.lineHeight,
            emptyMessage: schema.emptyMessage,
            emptyHint: schema.emptyHint,
        }),
        input: resolveChatInputSchema({
            disabled: schema.loading,
            modelId: schema.modelId,
            providerId: schema.providerId,
            thinkingMode: schema.thinkingMode,
            providers: schema.providers,
            mentionItems: schema.mentionItems,
            mentionLoading: schema.mentionLoading,
            onSend: schema.onSend,
            onStop: schema.onStop,
            onSelectModel: schema.onSelectModel,
            onChangeThinkingMode: schema.onChangeThinkingMode,
            onMentionSearch: schema.onMentionSearch,
        }),
    }
}
