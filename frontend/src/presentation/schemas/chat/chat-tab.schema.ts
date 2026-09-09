import type { ChatTabSchema } from '@/presentation/components/chat/types/schema'
import type { MentionItem, MentionTriggerRange, Provider, ChatMode } from '@/core/entities'
import type { Chat } from '@/core/entities'
import type { ChatSessionState } from '@/application/stores'
import type { HitlDockSchema } from '@/presentation/components/hitl'

export interface ChatTabParams {
    chat: Chat
    hitl?: HitlDockSchema | null
    state: ChatSessionState
    providers: Provider[]
    contentWidth?: number
    fontSize?: number
    lineHeight?: number
    mentionItems?: MentionItem[]
    mentionLoading?: boolean
    onSend?: (text: string) => void
    onStop?: () => void
    onUpdateModel?: (modelId: string, providerId: string) => void
    onChangeThinkingMode?: (mode: string) => void
    onChangeMode?: (mode: ChatMode) => void
    onMentionSearch?: (query: string, range: MentionTriggerRange) => void
}

export function createChatTabSchema(params: ChatTabParams): ChatTabSchema {
    return {
        title: params.chat.title,
        chatId: params.chat.id,
        hitl: params.hitl ?? null,
        messages: params.state.messages,
        loading: params.state.isLoading,
        providers: params.providers,
        modelId: params.chat.modelId,
        providerId: params.chat.providerId,
        thinkingMode: params.chat.thinkingMode,
        mode: params.chat.mode ?? 'ask',
        contentWidth: params.contentWidth,
        fontSize: params.fontSize,
        lineHeight: params.lineHeight,
        mentionItems: params.mentionItems,
        mentionLoading: params.mentionLoading,
        onSend: params.onSend,
        onStop: params.onStop,
        onSelectModel: params.onUpdateModel,
        onChangeThinkingMode: params.onChangeThinkingMode,
        onChangeMode: params.onChangeMode,
        onMentionSearch: params.onMentionSearch,
    }
}
