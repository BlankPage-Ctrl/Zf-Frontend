export const KNOWN_TOOL_NAMES = ['list_files', 'read_file', 'edit_file', 'run_shell'] as const

export type KnownToolName = (typeof KNOWN_TOOL_NAMES)[number]

export type ToolName = KnownToolName | (string & {})

export function isKnownToolName(value: string): value is KnownToolName {
    return (KNOWN_TOOL_NAMES as readonly string[]).includes(value)
}

export const HIDDEN_TOOL_NAMES = ['write_plan', 'edit_plan', 'read_plan'] as const

export type HiddenToolName = (typeof HIDDEN_TOOL_NAMES)[number]

export function isHiddenToolName(value: string): boolean {
    return (HIDDEN_TOOL_NAMES as readonly string[]).includes(value)
}

export const TOOL_LABELS: Record<KnownToolName, string> = {
    list_files: 'List Files',
    read_file: 'Read File',
    edit_file: 'Edit File',
    run_shell: 'Run Shell',
}

export const TOOL_DESCRIPTIONS: Record<KnownToolName, string> = {
    list_files: 'List files and directories in workspace',
    read_file: 'Read file content',
    edit_file: 'Edit file content with search/replace',
    run_shell: 'Execute shell command',
}
