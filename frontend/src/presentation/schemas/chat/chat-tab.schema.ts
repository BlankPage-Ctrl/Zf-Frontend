import type { ChatTabSchema } from '@/presentation/components/chat/types/schema'
import type { Provider } from '@/core/entities'
import type { Chat } from '@/core/entities'
import type { ChatSessionState } from '@/application/stores'

export interface ChatTabParams {
    chat: Chat
    state: ChatSessionState
    providers: Provider[]
    contentWidth?: number
    fontSize?: number
    lineHeight?: number
    onSend?: (text: string) => void
    onStop?: () => void
    onUpdateModel?: (modelId: string, providerId: string) => void
    onChangeThinkingMode?: (mode: string) => void
}

export function createChatTabSchema(params: ChatTabParams): ChatTabSchema {
    return {
        title: params.chat.title,
        messages: params.state.messages,
        loading: params.state.isLoading,
        providers: params.providers,
        modelId: params.chat.modelId,
        providerId: params.chat.providerId,
        thinkingMode: params.chat.thinkingMode,
        contentWidth: params.contentWidth,
        fontSize: params.fontSize,
        lineHeight: params.lineHeight,
        onSend: params.onSend,
        onStop: params.onStop,
        onSelectModel: params.onUpdateModel,
        onChangeThinkingMode: params.onChangeThinkingMode,
    }
}
