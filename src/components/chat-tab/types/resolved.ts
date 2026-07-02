import type { DropdownItemConfig } from '@/components/dropdown/types'
import type { MessagePartSchema } from './schema'

export type {
    ChatTabSchema,
    ChatInputSchema,
    MessageBubbleSchema,
    MessageListSchema,
    TextPartSchema,
    ReasoningPartSchema,
    ToolCallPartSchema,
    SourcePartSchema,
    FilePartSchema,
    DataPartSchema,
    StepIndicatorSchema,
    MessagePartSchema,
} from './schema'

export interface ResolvedChatTab {
    header: { title: string }
    messageList: ResolvedMessageList
    input: ResolvedChatInput
}

export interface ResolvedChatInput {
    placeholder: string
    disabled: boolean
    modelId?: string
    providerId?: string
    modelItems: DropdownItemConfig[]
    selectedLabel: string
    onSend?: (text: string) => void
    onStop?: () => void
    onSelectModel?: (modelId: string, providerId: string) => void
}

export interface ResolvedMessageBubble {
    role: 'user' | 'assistant'
    roleLabel: string
    avatarLabel: string
    parts: MessagePartSchema[]
    contentWidth?: number
}

export interface ResolvedMessageList {
    messages: { role: 'user' | 'assistant'; parts: MessagePartSchema[] }[]
    loading: boolean
    contentWidth?: number
    emptyMessage: string
    emptyHint: string
}

export interface ResolvedTextPart {
    text: string
    state?: string
    fontSize: number
    lineHeight: number
}

export interface ResolvedReasoningPart {
    text: string
    state?: string
    isRunning: boolean
    isDone: boolean
    statusText: string
}

export interface ResolvedToolCallPart {
    toolName: string
    toolCallId: string
    state: string
    input?: unknown
    output?: unknown
    errorText?: string
    isRunning: boolean
    isDone: boolean
    isError: boolean
    statusText: string
}

export interface ResolvedSourcePart {
    sourceId: string
    url?: string
    title?: string
    mediaType?: string
    icon: string
    displayTitle: string
    isLink: boolean
}

export interface ResolvedFilePart {
    mediaType: string
    url?: string
    filename?: string
    icon: string
    displayName: string
    typeLabel: string
    isLink: boolean
}

export interface ResolvedDataPart {
    type: string
    data: unknown
}

export interface ResolvedStepIndicator {
    label?: string
}
