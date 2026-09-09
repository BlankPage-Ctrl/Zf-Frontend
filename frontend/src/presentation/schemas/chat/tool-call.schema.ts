import { Wrench } from '@iconoir/vue'
import type { BlockPartSchema } from '@/presentation/components/blockpart'

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

export function createToolCallSchema(params: ToolCallSchemaParams): BlockPartSchema {
    const isRunning = params.state === 'input-streaming' || params.state === 'input-available'

    return {
        title: params.toolName,
        icon: Wrench,
        variant: 'default',
        collapsible: true,
        defaultExpanded: TOOL_EXPANDED[params.toolName] ?? false,
        viewToggle: TOOL_VIEW_TOGGLE[params.toolName] ?? false,
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
