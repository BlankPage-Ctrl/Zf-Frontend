import type { UIMessage } from 'ai'

type UnknownPart = Record<string, unknown>

function asRecord(part: unknown): UnknownPart | null {
    if (part === null || part === undefined) return null
    if (typeof part !== 'object') return null
    return part as UnknownPart
}

function getStringField(record: UnknownPart, keys: string[]): string | null {
    for (const key of keys) {
        const value = record[key]
        if (typeof value === 'string' && value.length > 0) return value
    }
    return null
}

export function parseToolName(part: unknown): string | null {
    const record = asRecord(part)
    if (!record) return null

    // 1. dynamic-tool or any part with explicit toolName string
    const toolNameField = getStringField(record, ['toolName'])
    const typeField = getStringField(record, ['type'])

    if (typeField === 'dynamic-tool' && toolNameField) {
        return toolNameField
    }

    // 2. AI SDK / generic tool-call with toolName
    if (toolNameField) {
        if (
            typeField === 'tool-call' ||
            typeField === 'dynamic-tool' ||
            (typeField !== null && typeField.startsWith('tool-'))
        ) {
            return toolNameField
        }
        if (hasToolCallId(record)) {
            return toolNameField
        }
    }

    // 3. Mock SSE prefix: `tool-list_files` -> `list_files`
    if (typeField !== null && typeField.startsWith('tool-')) {
        const sliced = typeField.slice(5)
        if (sliced.length > 0) return sliced
    }

    return null
}

function hasToolCallId(record: UnknownPart): boolean {
    return getStringField(record, ['toolCallId', 'ToolCallId', 'tool_call_id']) !== null
}

export function parseToolCallId(part: unknown): string | null {
    const record = asRecord(part)
    if (!record) return null
    return getStringField(record, ['toolCallId', 'ToolCallId', 'tool_call_id', 'id'])
}

export function parseToolCall(part: unknown): { toolName: string; toolCallId: string } | null {
    const toolName = parseToolName(part)
    if (toolName === null) return null
    const toolCallId = parseToolCallId(part)
    if (toolCallId === null) return null
    return { toolName, toolCallId }
}

export function isToolPart(part: unknown): boolean {
    return parseToolName(part) !== null
}

export function getToolNamesFromParts(parts: UIMessage['parts']): string[] {
    if (!Array.isArray(parts)) return []
    const names: string[] = []
    for (const part of parts) {
        const name = parseToolName(part)
        if (name !== null) names.push(name)
    }
    return names
}

export function getToolNamesFromMessage(message: UIMessage): string[] {
    return getToolNamesFromParts(message.parts as unknown as UIMessage['parts'])
}

export function getToolNamesFromMessages(messages: UIMessage[]): string[] {
    const seen = new Set<string>()
    const ordered: string[] = []
    for (const msg of messages) {
        for (const name of getToolNamesFromMessage(msg)) {
            if (!seen.has(name)) {
                seen.add(name)
                ordered.push(name)
            }
        }
    }
    return ordered
}

export function getToolCallsFromMessages(
    messages: UIMessage[],
): Array<{ toolName: string; toolCallId: string; state?: string }> {
    const seen = new Set<string>()
    const out: Array<{ toolName: string; toolCallId: string; state?: string }> = []
    for (const msg of messages) {
        const parts = (msg.parts ?? []) as unknown as unknown[]
        for (const part of parts) {
            const parsed = parseToolCall(part)
            if (!parsed) continue
            if (seen.has(parsed.toolCallId)) continue
            seen.add(parsed.toolCallId)
            const record = asRecord(part)
            const state = record ? (getStringField(record, ['state']) ?? undefined) : undefined
            out.push({ ...parsed, state: state ?? undefined })
        }
    }
    return out
}

export function getAllToolNamesFromMessages(messages: UIMessage[]): string[] {
    const out: string[] = []
    for (const msg of messages) {
        out.push(...getToolNamesFromMessage(msg))
    }
    return out
}
