import type { DropdownItemConfig } from '@/presentation/components/dropdown/types'
import type { MessagePartSchema, ToolData } from './schema'
import type { MentionItem, MentionTriggerRange, ChatMode } from '@/core/entities'
import type { HitlDockSchema } from '@/presentation/components/hitl'

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
    ListFilesDataPartSchema,
    ReadFileDataPartSchema,
    EditFileDataPartSchema,
    RunShellDataPartSchema,
    ListFilesToolData,
    ReadFileToolData,
    EditFileToolData,
    RunShellToolData,
    ToolData,
    ToolFileNode,
    ToolDataPartType,
    StepIndicatorSchema,
    MessagePartSchema,
} from './schema'

export interface ResolvedChatTab {
    header: { title: string }
    chatId: string
    hitl: HitlDockSchema | null
    messageList: ResolvedMessageList
    input: ResolvedChatInput
}

export interface ResolvedChatInput {
    placeholder: string
    disabled: boolean
    modelId?: string
    providerId?: string
    thinkingMode?: string
    mode: ChatMode
    modelItems: DropdownItemConfig[]
    selectedLabel: string
    mentionItems: MentionItem[]
    mentionLoading: boolean
    onSend?: (text: string) => void
    onStop?: () => void
    onSelectModel?: (modelId: string, providerId: string) => void
    onChangeThinkingMode?: (mode: string) => void
    onChangeMode?: (mode: ChatMode) => void
    onMentionSearch?: (query: string, range: MentionTriggerRange) => void
}

export interface ResolvedMessageBubble {
    role: 'user' | 'assistant'
    roleLabel: string
    avatarLabel: string
    parts: MessagePartSchema[]
    contentWidth?: number
}

export interface ResolvedMessage {
    id: string
    role: 'user' | 'assistant'
    parts: MessagePartSchema[]
}

export interface ResolvedMessageList {
    messages: ResolvedMessage[]
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
    frontend?: ToolData
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
