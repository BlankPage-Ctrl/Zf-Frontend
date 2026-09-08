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
    frontend?: ToolFrontendData
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

export interface FrontendFileNode {
    id: string
    name: string
    path: string
    type: string
    isDirectory: boolean
    size?: number
    lastModified?: number
    hasChildren?: boolean
    children?: FrontendFileNode[]
    meta?: {
        isSymlink?: boolean
        symlinkTarget?: string
    }
}

export interface ListFilesFrontendData {
    toolCallId: string
    requestedPath: string
    nodes: FrontendFileNode[]
    total: number
    limit?: number
}

export interface ReadFileFrontendData {
    toolCallId: string
    path: string
    content: string
    contentWithLineNumbers?: string
    encoding: string
    size: number
    truncated: boolean
    totalLines?: number
}

export interface RunShellFrontendData {
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

export type ToolFrontendData =
    | ListFilesFrontendData
    | ReadFileFrontendData
    | RunShellFrontendData

export interface ListFilesDataPartSchema {
    id?: string
    data: ListFilesFrontendData
}

export interface ReadFileDataPartSchema {
    id?: string
    data: ReadFileFrontendData
}

export interface RunShellDataPartSchema {
    id?: string
    data: RunShellFrontendData
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
    | ({ type: 'data-list_files' } & ListFilesDataPartSchema)
    | ({ type: 'data-read_file' } & ReadFileDataPartSchema)
    | ({ type: 'data-run_shell' } & RunShellDataPartSchema)
    | ({ type: 'step-start' } & StepIndicatorSchema)

export const FRONTEND_DATA_PART_TYPES = [
    'data-list_files',
    'data-read_file',
    'data-run_shell',
] as const

export type FrontendDataPartType = (typeof FRONTEND_DATA_PART_TYPES)[number]

export function isFrontendDataPartType(type: string): type is FrontendDataPartType {
    return (FRONTEND_DATA_PART_TYPES as readonly string[]).includes(type)
}
