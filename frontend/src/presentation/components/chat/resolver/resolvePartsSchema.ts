import type {
    TextPartSchema,
    ReasoningPartSchema,
    ToolCallPartSchema,
    SourcePartSchema,
    FilePartSchema,
    ToolData,
    StepIndicatorSchema,
    MessagePartSchema,
} from '../types/schema'
import type {
    ResolvedTextPart,
    ResolvedReasoningPart,
    ResolvedToolCallPart,
    ResolvedSourcePart,
    ResolvedFilePart,
    ResolvedStepIndicator,
} from '../types/resolved'
import type { FeedBlock, FeedMessage } from '@/core/entities'
import { isHiddenToolName } from '../helpers/knownTools'

export function resolveTextPartSchema(
    schema: TextPartSchema,
    defaults?: { fontSize?: number; lineHeight?: number },
): ResolvedTextPart {
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
    const isRunning = schema.state === 'queued' || schema.state === 'active'
    const isDone = schema.state === 'ok'
    const isError = schema.state === 'bad'

    return {
        toolName: schema.toolName,
        toolCallId: schema.toolCallId,
        state: schema.state,
        input: schema.input,
        output: schema.output,
        errorText: schema.errorText,
        ...(schema.frontend !== undefined ? { frontend: schema.frontend } : {}),
        isRunning,
        isDone,
        isError,
        statusText: isRunning ? 'Running...' : isError ? 'Failed' : 'Done',
    }
}

function getSourceIcon(mediaType?: string): string {
    if (mediaType) {
        if (mediaType.startsWith('image/')) return '🖼️'
        if (mediaType.startsWith('text/')) return '📄'
        if (mediaType.startsWith('application/pdf')) return '📕'
    }
    return '🔗'
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
    if (mediaType.startsWith('image/')) return '🖼️'
    if (mediaType.startsWith('text/')) return '📄'
    if (mediaType.startsWith('application/')) return '📦'
    if (mediaType.startsWith('audio/')) return '🎵'
    if (mediaType.startsWith('video/')) return '🎬'
    return '📎'
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

export function resolveStepIndicatorSchema(schema: StepIndicatorSchema): ResolvedStepIndicator {
    return {
        label: schema.label,
    }
}

function firstToolData(notices: unknown[]): ToolData | undefined {
    for (const notice of notices) {
        if (notice !== null && typeof notice === 'object' && 'toolCallId' in notice) {
            return notice as ToolData
        }
    }
    return undefined
}

function blockToPart(
    block: FeedBlock,
    defaults?: { fontSize?: number; lineHeight?: number },
): MessagePartSchema | null {
    switch (block.kind) {
        case 'text':
            if (block.text === '') return null
            return {
                type: 'text',
                text: block.text,
                state: block.closed ? 'done' : 'streaming',
                fontSize: defaults?.fontSize,
                lineHeight: defaults?.lineHeight,
            }
        case 'think':
            if (block.text === '') return null
            return {
                type: 'reasoning',
                text: block.text,
                state: block.closed ? 'done' : 'streaming',
            }
        case 'work': {
            if (isHiddenToolName(block.implement)) return null
            return {
                type: 'tool-call',
                toolName: block.implement,
                toolCallId: block.callId,
                state: block.state,
                ...(block.input !== undefined ? { input: block.input } : {}),
                ...(block.output !== undefined ? { output: block.output } : {}),
                ...(block.errorText !== undefined ? { errorText: block.errorText } : {}),
                ...(firstToolData(block.notices) !== undefined
                    ? { frontend: firstToolData(block.notices) }
                    : {}),
            }
        }
        case 'asset':
            if (block.assetKind === 'blob') {
                return {
                    type: 'file',
                    mediaType: block.mediaType ?? 'application/octet-stream',
                    ...(block.url !== undefined ? { url: block.url } : {}),
                    ...(block.filename !== undefined ? { filename: block.filename } : {}),
                }
            }
            return {
                type: 'source',
                sourceId: block.sliceId,
                ...(block.url !== undefined ? { url: block.url } : {}),
                ...(block.title !== undefined ? { title: block.title } : {}),
                ...(block.mediaType !== undefined ? { mediaType: block.mediaType } : {}),
            }
        case 'stage':
            return {
                type: 'step-start',
                ...(block.landed !== undefined
                    ? { label: `Stage ${block.stage} · ${block.landed}` }
                    : { label: `Stage ${block.stage}` }),
            }
    }
}

export function resolveMessagePart(
    block: FeedBlock,
    defaults?: { fontSize?: number; lineHeight?: number },
): MessagePartSchema | null {
    return blockToPart(block, defaults)
}

export function resolveMessageParts(
    blocks: FeedBlock[] | undefined,
    defaults?: { fontSize?: number; lineHeight?: number },
): MessagePartSchema[] {
    const out: MessagePartSchema[] = []
    for (const block of blocks ?? []) {
        const part = blockToPart(block, defaults)
        if (part !== null) out.push(part)
    }
    return out
}

export function resolveMessageBlocks(
    message: FeedMessage,
    defaults?: { fontSize?: number; lineHeight?: number },
): MessagePartSchema[] {
    return resolveMessageParts(message.blocks, defaults)
}
