import type {
    TextPartSchema,
    ReasoningPartSchema,
    ToolCallPartSchema,
    SourcePartSchema,
    FilePartSchema,
    DataPartSchema,
    StepIndicatorSchema,
    MessagePartSchema,
} from '../types/schema'
import type {
    ResolvedTextPart,
    ResolvedReasoningPart,
    ResolvedToolCallPart,
    ResolvedSourcePart,
    ResolvedFilePart,
    ResolvedDataPart,
    ResolvedStepIndicator,
} from '../types/resolved'
import { isTextUIPart, isReasoningUIPart, isToolUIPart, isFileUIPart, isDataUIPart } from 'ai'
import type { UIMessage } from 'ai'

export function resolveTextPartSchema(schema: TextPartSchema, defaults?: { fontSize?: number; lineHeight?: number }): ResolvedTextPart {
    return {
        text: schema.text,
        state: schema.state,
        fontSize: schema.fontSize ?? defaults?.fontSize ?? 14,
        lineHeight: schema.lineHeight ?? defaults?.lineHeight ?? 1.7,
    }
}

export function resolveReasoningPartSchema(schema: ReasoningPartSchema): ResolvedReasoningPart {
    const isRunning = schema.state === 'streaming'
    const isDone = !schema.state || schema.state === 'done'

    return {
        text: schema.text,
        state: schema.state,
        isRunning,
        isDone,
        statusText: isRunning ? 'Running...' : 'Done',
    }
}

export function resolveToolCallPartSchema(schema: ToolCallPartSchema): ResolvedToolCallPart {
    const isRunning = schema.state === 'input-streaming' || schema.state === 'input-available'
    const isDone = schema.state === 'output-available'
    const isError = schema.state === 'output-error'

    return {
        toolName: schema.toolName,
        toolCallId: schema.toolCallId,
        state: schema.state,
        input: schema.input,
        output: schema.output,
        errorText: schema.errorText,
        isRunning,
        isDone,
        isError,
        statusText: isRunning ? 'Running...' : isError ? 'Failed' : 'Done',
    }
}

function getSourceIcon(mediaType?: string): string {
    if (mediaType) {
        if (mediaType.startsWith('image/')) return '\u{1F5BC}\uFE0F'
        if (mediaType.startsWith('text/')) return '\u{1F4C4}'
        if (mediaType.startsWith('application/pdf')) return '\u{1F4D5}'
    }
    return '\u{1F517}'
}

export function resolveSourcePartSchema(schema: SourcePartSchema): ResolvedSourcePart {
    return {
        sourceId: schema.sourceId,
        url: schema.url,
        title: schema.title,
        mediaType: schema.mediaType,
        icon: getSourceIcon(schema.mediaType),
        displayTitle: schema.title || schema.url || schema.sourceId,
        isLink: !!schema.url,
    }
}

function getFileIcon(mediaType: string): string {
    if (mediaType.startsWith('image/')) return '\u{1F5BC}\uFE0F'
    if (mediaType.startsWith('text/')) return '\u{1F4C4}'
    if (mediaType.startsWith('application/')) return '\u{1F4E6}'
    if (mediaType.startsWith('audio/')) return '\u{1F3B5}'
    if (mediaType.startsWith('video/')) return '\u{1F3AC}'
    return '\u{1F4CE}'
}

export function resolveFilePartSchema(schema: FilePartSchema): ResolvedFilePart {
    return {
        mediaType: schema.mediaType,
        url: schema.url,
        filename: schema.filename,
        icon: getFileIcon(schema.mediaType),
        displayName: schema.filename || schema.url || 'file',
        typeLabel: schema.mediaType.split('/').pop() || '',
        isLink: !!schema.url,
    }
}

export function resolveDataPartSchema(schema: DataPartSchema): ResolvedDataPart {
    return {
        type: schema.type,
        data: schema.data,
    }
}

export function resolveStepIndicatorSchema(schema: StepIndicatorSchema): ResolvedStepIndicator {
    return {
        label: schema.label,
    }
}

function isSourcePart(part: unknown): part is { type: 'source-url' | 'source-document'; sourceId: string; url?: string; title?: string; mediaType?: string } {
    const p = part as Record<string, unknown>
    return p.type === 'source-url' || p.type === 'source-document'
}

function isStepStart(part: unknown): part is { type: 'step-start' } {
    return (part as Record<string, unknown>).type === 'step-start'
}

function getToolToolName(part: unknown): string {
    const p = part as Record<string, unknown>
    if (p.type === 'dynamic-tool' && typeof p.toolName === 'string') {
        return p.toolName
    }
    if (typeof p.type === 'string' && p.type.startsWith('tool-')) {
        return p.type.split('-').slice(1).join('-')
    }
    return String(p.toolCallId ?? 'tool')
}

export function resolveMessagePart(part: UIMessage['parts'][number]): MessagePartSchema {
    if (isTextUIPart(part)) {
        return {
            type: 'text',
            text: part.text,
            state: 'state' in part ? (part.state as string | undefined) : undefined,
        }
    }
    if (isReasoningUIPart(part)) {
        return {
            type: 'reasoning',
            text: part.text,
            state: 'state' in part ? (part.state as string | undefined) : undefined,
        }
    }
    if (isToolUIPart(part)) {
        return {
            type: 'tool-call',
            toolName: getToolToolName(part),
            toolCallId: part.toolCallId,
            state: part.state,
            input: 'input' in part ? part.input : undefined,
            output: 'output' in part ? part.output : undefined,
            errorText: 'errorText' in part ? part.errorText : undefined,
        }
    }
    if (isSourcePart(part)) {
        return {
            type: 'source',
            sourceId: part.sourceId,
            url: part.url,
            title: part.title,
            mediaType: 'mediaType' in part ? (part as { mediaType?: string }).mediaType : undefined,
        }
    }
    if (isFileUIPart(part)) {
        return {
            type: 'file',
            mediaType: part.mediaType,
            url: part.url,
            filename: 'filename' in part ? part.filename : undefined,
        }
    }
    if (isDataUIPart(part)) {
        return {
            type: 'data',
            data: 'data' in part ? part.data : {},
        }
    }
    if (isStepStart(part)) {
        return { type: 'step-start' }
    }
    return { type: 'text', text: '' }
}
