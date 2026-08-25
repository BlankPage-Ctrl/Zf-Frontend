import { Wrench } from '@iconoir/vue'
import type { BlockPartSchema } from '@/presentation/components/blockpart'

export interface ToolCallSchemaParams {
    toolName: string
    state: string
    input?: unknown
    output?: unknown
    errorText?: string
}

export function createToolCallSchema(params: ToolCallSchemaParams): BlockPartSchema {
    const isRunning = params.state === 'input-streaming' || params.state === 'input-available'
    const isError = params.state === 'output-error'

    return {
        title: params.toolName,
        icon: Wrench,
        variant: 'default',
        collapsible: true,
        defaultExpanded: true,
        viewToggle: true,
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
