import type { UIMessage } from 'ai'
import type { Provider } from '@/services/provider'

export interface ChatTabSchema {
    title: string
    messages: UIMessage[]
    loading?: boolean
    providers: Provider[]
    modelId?: string
    providerId?: string
    contentWidth?: number
    fontSize?: number
    lineHeight?: number
    emptyMessage?: string
    emptyHint?: string
    onSend?: (text: string) => void
    onStop?: () => void
    onSelectModel?: (modelId: string, providerId: string) => void
}

export interface ChatInputSchema {
    disabled?: boolean
    modelId?: string
    providerId?: string
    providers: Provider[]
    placeholder?: string
    onSend?: (text: string) => void
    onStop?: () => void
    onSelectModel?: (modelId: string, providerId: string) => void
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
