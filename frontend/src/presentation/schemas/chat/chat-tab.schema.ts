import type { ChatTabSchema } from '@/presentation/components/chat/types/schema'
import type { Provider } from '@/core/entities'
import type { Chat } from '@/core/entities'
import type { ChatSession } from '@/application/business-logic'

export interface ChatTabParams {
    chat: Chat
    session: ChatSession
    providers: Provider[]
    contentWidth?: number
    fontSize?: number
    lineHeight?: number
    onUpdateModel?: (modelId: string, providerId: string) => void
    onChangeThinkingMode?: (mode: string) => void
}

export function createChatTabSchema(params: ChatTabParams): ChatTabSchema {
    return {
        title: params.chat.title,
        messages: params.session.messages.value,
        loading: params.session.isLoading.value,
        providers: params.providers,
        modelId: params.chat.modelId,
        providerId: params.chat.providerId,
        thinkingMode: params.chat.thinkingMode,
        contentWidth: params.contentWidth,
        fontSize: params.fontSize,
        lineHeight: params.lineHeight,
        onSend: params.session.sendMessage,
        onStop: params.session.stop,
        onSelectModel: params.onUpdateModel,
        onChangeThinkingMode: params.onChangeThinkingMode,
    }
}
