<script setup lang="ts">
import { computed } from 'vue'
import type { ToolCallPartSchema } from '../../types/schema'
import { resolveToolCallPartSchema } from '../../resolver/resolvePartsSchema'
import { useShellExecStorer } from '@/application/stores'
import { BlockPart } from '@/presentation/components/blockpart'
import { createToolCallSchema } from '@/presentation/schemas'
import { isKnownToolName } from '../../helpers/knownTools'
import ShellTerminal from './ShellTerminal.vue'

const props = defineProps<{
    schema: ToolCallPartSchema
}>()

const resolved = computed(() => resolveToolCallPartSchema(props.schema))
const shellStore = useShellExecStorer()

interface RunShellOutput {
    executionId?: string
    stdout?: string
    stderr?: string
    exitCode?: number
}

const isKnownTool = computed(() => isKnownToolName(resolved.value.toolName))

const live = computed(() => {
    if (!isKnownTool.value || resolved.value.toolName !== 'run_shell') return undefined
    const id =
        props.schema.toolCallId ?? (props.schema.output as RunShellOutput | undefined)?.executionId
    if (!id) return undefined
    return shellStore.byToolCall[id]
})

const blockSchema = computed(() =>
    createToolCallSchema({
        toolName: resolved.value.toolName,
        state: resolved.value.state,
        input: resolved.value.input,
        output: resolved.value.output,
        errorText: resolved.value.errorText,
    }),
)
</script>

<template>
    <BlockPart :schema="blockSchema">
        <template v-if="live" #preview>
            <ShellTerminal :lines="live.lines" />
        </template>
    </BlockPart>
</template>
