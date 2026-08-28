export const KNOWN_TOOL_NAMES = ['list_files', 'read_file', 'run_shell'] as const

export type KnownToolName = (typeof KNOWN_TOOL_NAMES)[number]

export type ToolName = KnownToolName | (string & {})

export function isKnownToolName(value: string): value is KnownToolName {
    return (KNOWN_TOOL_NAMES as readonly string[]).includes(value)
}

export const TOOL_LABELS: Record<KnownToolName, string> = {
    list_files: 'List Files',
    read_file: 'Read File',
    run_shell: 'Run Shell',
}

export const TOOL_DESCRIPTIONS: Record<KnownToolName, string> = {
    list_files: 'List files and directories in workspace',
    read_file: 'Read file content',
    run_shell: 'Execute shell command',
}
