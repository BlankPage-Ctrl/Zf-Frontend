import { Wrench, Eye, EditPencil, Folder, Terminal, Book } from '@iconoir/vue'
import type { Component } from 'vue'
import type { BlockPartSchema } from '@/presentation/components/blockpart'
import { TOOL_LABELS } from '@/presentation/components/chat/helpers/knownTools'

export interface ToolCallSchemaParams {
    toolName: string
    state: string
    input?: unknown
    output?: unknown
    errorText?: string
}

const TOOL_VIEW_TOGGLE: Record<string, boolean> = {
    list_files: true,
    read_file: false,
    run_shell: false,
}

const TOOL_EXPANDED: Record<string, boolean> = {
    list_files: false,
    read_file: false,
    run_shell: true,
}

const TOOL_ICONS: Record<string, Component> = {
    read_file: Eye,
    edit_file: EditPencil,
    list_files: Folder,
    run_shell: Terminal,
    skill: Book,
}

function getSkillTitle(input: unknown): string {
    if (input && typeof input === 'object' && 'name' in input) {
        const name = (input as Record<string, unknown>).name
        if (typeof name === 'string' && name.trim().length > 0) {
            return `Reading ${name.trim()}`
        }
    }
    return 'Reading Skill'
}

export function createToolCallSchema(params: ToolCallSchemaParams): BlockPartSchema {
    // Feed work states: queued | active (running) vs ok | bad (settled).
    const isRunning = params.state === 'queued' || params.state === 'active'
    const isSkill = params.toolName === 'skill'

    return {
        title: isSkill
            ? getSkillTitle(params.input)
            : ((TOOL_LABELS as Record<string, string>)[params.toolName] ?? params.toolName),
        icon: TOOL_ICONS[params.toolName] ?? Wrench,
        variant: 'default',
        collapsible: isSkill ? false : true,
        defaultExpanded: isSkill ? false : (TOOL_EXPANDED[params.toolName] ?? false),
        viewToggle: isSkill ? false : (TOOL_VIEW_TOGGLE[params.toolName] ?? false),
        defaultView: 'preview',
        status: isRunning ? 'streaming' : 'done',
        source: {
            data: {
                ...(params.input !== undefined && { input: params.input }),
                ...(params.output !== undefined && { output: params.output }),
                ...(params.errorText && { errorText: params.errorText }),
            },
            format: 'json',
        },
    }
}
