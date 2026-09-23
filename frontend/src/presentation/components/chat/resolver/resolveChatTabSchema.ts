import type { ChatTabSchema } from '../types/schema'
import type { ResolvedChatTab } from '../types/resolved'
import { resolveChatInputSchema } from './resolveChatInputSchema'
import { resolveMessageListSchema } from './resolveMessageListSchema'

export function resolveChatTabSchema(schema: ChatTabSchema): ResolvedChatTab {
    return {
        header: {
            title: schema.title,
        },
        chatId: schema.chatId,
        hitl: schema.hitl,
        messageList: resolveMessageListSchema({
            messages: schema.messages,
            loading: schema.loading,
            contentWidth: schema.contentWidth,
            fontSize: schema.fontSize,
            lineHeight: schema.lineHeight,
            emptyMessage: schema.emptyMessage,
            emptyHint: schema.emptyHint,
            onEditMessage: schema.onEditMessage,
        }),
        input: resolveChatInputSchema({
            // An edit draft keeps the composer usable while a run is live:
            // sending the draft cancels that run and restarts from the edit.
            disabled: !!schema.loading && schema.draftText == null,
            modelId: schema.modelId,
            providerId: schema.providerId,
            thinkingMode: schema.thinkingMode,
            mode: schema.mode,
            providers: schema.providers,
            mentionItems: schema.mentionItems,
            mentionLoading: schema.mentionLoading,
            draftText: schema.draftText,
            onSend: schema.onSend,
            onStop: schema.onStop,
            onSelectModel: schema.onSelectModel,
            onChangeThinkingMode: schema.onChangeThinkingMode,
            onChangeMode: schema.onChangeMode,
            onMentionSearch: schema.onMentionSearch,
            onCancelEdit: schema.onCancelEdit,
        }),
    }
}
