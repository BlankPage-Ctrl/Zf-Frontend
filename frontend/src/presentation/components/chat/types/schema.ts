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

export interface DataPartSchema {
    type: string
    data: unknown
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

export interface ListFilesDataPartSchema {
    id?: string
    data: ListFilesToolData
}

export interface ReadFileDataPartSchema {
    id?: string
    data: ReadFileToolData
}

export interface EditFileDataPartSchema {
    id?: string
    data: EditFileToolData
}

export interface RunShellDataPartSchema {
    id?: string
    data: RunShellToolData
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
    | ({ type: 'data-edit_file' } & EditFileDataPartSchema)
    | ({ type: 'data-run_shell' } & RunShellDataPartSchema)
    | ({ type: 'step-start' } & StepIndicatorSchema)

export const TOOL_DATA_PART_TYPES = [
    'data-list_files',
    'data-read_file',
    'data-edit_file',
    'data-run_shell',
] as const

export type ToolDataPartType = (typeof TOOL_DATA_PART_TYPES)[number]

export function isToolDataPartType(type: string): type is ToolDataPartType {
    return (TOOL_DATA_PART_TYPES as readonly string[]).includes(type)
}
