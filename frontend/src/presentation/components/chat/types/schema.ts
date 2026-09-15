import type {
    FeedMessage,
    Provider,
    MentionItem,
    MentionTriggerRange,
    ChatMode,
} from '@/core/entities'
import type { HitlDockSchema } from '@/presentation/components/hitl'

export interface ChatTabSchema {
    title: string
    chatId: string
    hitl: HitlDockSchema | null
    messages: FeedMessage[]
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
    blocks: FeedMessage['blocks']
    contentWidth?: number
}

export interface MessageListSchema {
    messages: FeedMessage[]
    loading?: boolean
    contentWidth?: number
    fontSize?: number
    lineHeight?: number
    emptyMessage?: string
    emptyHint?: string
}

export interface TextPartSchema {
    text: string
    /** 'streaming' while the slice is open, 'done' after close. */
    state?: string
    fontSize?: number
    lineHeight?: number
}

export interface ReasoningPartSchema {
    text: string
    /** 'streaming' while the slice is open, 'done' after close. */
    state?: string
}

export type FeedWorkPartState = 'queued' | 'active' | 'ok' | 'bad'

export interface ToolCallPartSchema {
    toolName: string
    toolCallId: string
    state: FeedWorkPartState
    input?: unknown
    output?: unknown
    errorText?: string
    frontend?: ToolData
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

export interface ToolFileNode {
    id: string
    name: string
    path: string
    type: string
    isDirectory: boolean
    size?: number
    lastModified?: number
    hasChildren?: boolean
    children?: ToolFileNode[]
    meta?: {
        isSymlink?: boolean
        symlinkTarget?: string
    }
}

export interface ListFilesToolData {
    toolCallId: string
    requestedPath: string
    nodes: ToolFileNode[]
    total: number
    limit?: number
}

export interface ReadFileToolData {
    toolCallId: string
    path: string
    content: string
    contentWithLineNumbers?: string
    encoding: string
    size: number
    truncated: boolean
    totalLines?: number
}

export interface EditFileToolData {
    toolCallId: string
    path: string
    appliedEdits: number
    content: string
    contentWithLineNumbers?: string
    encoding: string
    size: number
    totalLines: number
    diff?: string
    diffTruncated?: boolean
}

export interface RunShellToolData {
    toolCallId: string
    executionId: string
    command: string
    cwd: string
    exitCode: number
    stdout: string
    stderr: string
    truncated: boolean
    spillPath: string | null
    durationMs: number
    timedOut: boolean
    signal: string | null
}

export type ToolData = ListFilesToolData | ReadFileToolData | EditFileToolData | RunShellToolData

export interface StepIndicatorSchema {
    label?: string
}

export type MessagePartSchema =
    | ({ type: 'text' } & TextPartSchema)
    | ({ type: 'reasoning' } & ReasoningPartSchema)
    | ({ type: 'tool-call' } & ToolCallPartSchema)
    | ({ type: 'source' } & SourcePartSchema)
    | ({ type: 'file' } & FilePartSchema)
    | ({ type: 'step-start' } & StepIndicatorSchema)
