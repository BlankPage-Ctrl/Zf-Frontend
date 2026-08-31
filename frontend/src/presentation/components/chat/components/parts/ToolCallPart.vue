<script setup lang="ts">
import { computed } from 'vue'
import type { ToolCallPartSchema } from '../../types/schema'
import { resolveToolCallPartSchema } from '../../resolver/resolvePartsSchema'
import { useShellExecStorer, useThemeStorer } from '@/application/stores'
import { BlockPart } from '@/presentation/components/blockpart'
import { createToolCallSchema } from '@/presentation/schemas'
import { isKnownToolName } from '../../helpers/knownTools'
import { CodeRenderer } from '@/presentation/components/code-renderer'
import ShellTerminal from './ShellTerminal.vue'

const props = defineProps<{
    schema: ToolCallPartSchema
}>()

const resolved = computed(() => resolveToolCallPartSchema(props.schema))
const shellStore = useShellExecStorer()
const themeStore = useThemeStorer()
const isDark = computed(() => themeStore.activeThemeId === 'night')

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

interface ReadFileOutput {
    path?: string
    content?: string
    totalLines?: number
    truncated?: boolean
    encoding?: string
}

interface ReadFileInput {
    path?: string
}

function inferLangFromPath(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
    const map: Record<string, string> = {
        ts: 'typescript',
        tsx: 'tsx',
        js: 'javascript',
        jsx: 'jsx',
        vue: 'vue',
        json: 'json',
        md: 'markdown',
        py: 'python',
        go: 'go',
        rs: 'rust',
        java: 'java',
        css: 'css',
        html: 'html',
        yaml: 'yaml',
        yml: 'yaml',
        toml: 'toml',
        sh: 'bash',
        bash: 'bash',
        zsh: 'bash',
        sql: 'sql',
        graphql: 'graphql',
        gql: 'graphql',
        prisma: 'prisma',
        dockerfile: 'dockerfile',
    }
    if (map[ext]) return map[ext]
    if (filePath.toLowerCase().endsWith('dockerfile')) return 'dockerfile'
    return ext || 'plaintext'
}

const readFilePreview = computed(() => {
    if (resolved.value.toolName !== 'read_file') return null
    if (resolved.value.state !== 'output-available') return null
    const output = resolved.value.output as ReadFileOutput | undefined
    const content = output?.content
    if (typeof content !== 'string' || content === '') return null
    if (output?.encoding === 'base64') return null
    const input = resolved.value.input as ReadFileInput | undefined
    const filePath = input?.path ?? output?.path ?? ''
    const lang = inferLangFromPath(filePath)
    return {
        code: content,
        lang,
        path: filePath,
        truncated: output?.truncated,
        totalLines: output?.totalLines,
        isDark: isDark.value,
    }
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
        <template v-if="readFilePreview" #preview>
            <div class="read-file-preview">
                <div v-if="readFilePreview.path" class="read-file-preview__path">
                    {{ readFilePreview.path }}
                    <span v-if="readFilePreview.truncated" class="read-file-preview__truncated"
                        >(truncated)</span
                    >
                </div>
                <CodeRenderer
                    :schema="{
                        code: readFilePreview.code,
                        lang: readFilePreview.lang,
                        status: 'done',
                        isDark: readFilePreview.isDark,
                    }"
                />
            </div>
        </template>
        <template v-else-if="live" #preview>
            <ShellTerminal :lines="live.lines" />
        </template>
    </BlockPart>
</template>

<style scoped>
.read-file-preview {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    max-height: 420px;
    overflow: auto;
}

.read-file-preview__path {
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    opacity: 0.6;
    word-break: break-all;
}

.read-file-preview__truncated {
    margin-left: 6px;
    color: var(--text-warning, #d97706);
}
</style>
