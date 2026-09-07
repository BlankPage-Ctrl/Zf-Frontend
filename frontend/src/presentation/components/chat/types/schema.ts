import type { UIMessage } from 'ai'
import type { Provider, MentionItem, MentionTriggerRange, ChatMode } from '@/core/entities'
import type { HitlDockSchema } from '@/presentation/components/hitl'

export interface ChatTabSchema {
    title: string
    chatId: string
    hitl: HitlDockSchema | null
    messages: UIMessage[]
    loading?: boolean
    providers: Provider[]
    modelId?: string
    providerId?: string
    thinkingMode?: string
    mode?: ChatMode
    contentWidth?: number
    fontSize?: number
    lineHeight?: number
    emptyMessage?: string
    emptyHint?: string
    mentionItems?: MentionItem[]
    mentionLoading?: boolean
    onSend?: (text: string) => void
    onStop?: () => void
    onSelectModel?: (modelId: string, providerId: string) => void
    onChangeThinkingMode?: (mode: string) => void
    onChangeMode?: (mode: ChatMode) => void
    onMentionSearch?: (query: string, range: MentionTriggerRange) => void
}

export interface ChatInputSchema {
    disabled?: boolean
    modelId?: string
    providerId?: string
    thinkingMode?: string
    mode?: ChatMode
    providers: Provider[]
    placeholder?: string
    mentionItems?: MentionItem[]
    mentionLoading?: boolean
    onSend?: (text: string) => void
    onStop?: () => void
    onSelectModel?: (modelId: string, providerId: string) => void
    onChangeThinkingMode?: (mode: string) => void
    onChangeMode?: (mode: ChatMode) => void
    onMentionSearch?: (query: string, range: MentionTriggerRange) => void
}

export interface MessageBubbleSchema {
    role: 'user' | 'assistant'
    parts: UIMessage['parts']
    contentWidth?: number
}

export interface MessageListSchema {
    messages: UIMessage[]
    loading?: boolean
    contentWidth?: number
    fontSize?: number
    lineHeight?: number
    emptyMessage?: string
    emptyHint?: string
}

export interface TextPartSchema {
    text: string
    state?: string
    fontSize?: number
    lineHeight?: number
}

export interface ReasoningPartSchema {
    text: string
    state?: string
}

export interface ToolCallPartSchema {
    toolName: string
    toolCallId: string
    state: string
    input?: unknown
    output?: unknown
    errorText?: string
}

export interface SourcePartSchema {
    sourceId: string
    url?: string
    title?: string
    mediaType?: string
}

export interface FilePartSchema {
    mediaType: string
    url?: string
    filename?: string
}

export interface DataPartSchema {
    type: string
    data: unknown
}

export interface StepIndicatorSchema {
    label?: string
}

export type MessagePartSchema =
    | ({ type: 'text' } & TextPartSchema)
    | ({ type: 'reasoning' } & ReasoningPartSchema)
    | ({ type: 'tool-call' } & ToolCallPartSchema)
    | ({ type: 'source' } & SourcePartSchema)
    | ({ type: 'file' } & FilePartSchema)
    | ({ type: 'data' } & DataPartSchema)
    | ({ type: 'step-start' } & StepIndicatorSchema)
