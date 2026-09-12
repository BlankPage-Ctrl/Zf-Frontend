<script setup lang="ts">
import { computed } from 'vue'
import type { ToolCallPartSchema } from '../../types/schema'
import type { EditFileToolData, ListFilesToolData, ReadFileToolData } from '../../types/schema'
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
    if (resolved.value.state !== 'ok') return null
    const frontend = resolved.value.frontend as ReadFileToolData | undefined
    if (frontend && typeof frontend.content === 'string' && frontend.content !== '') {
        if (frontend.encoding === 'base64') return null
        const filePath = frontend.path ?? ''
        return {
            code: frontend.content,
            lang: inferLangFromPath(filePath),
            path: filePath,
            truncated: frontend.truncated,
            totalLines: frontend.totalLines,
            isDark: isDark.value,
        }
    }
    // Legacy fallback: object-shaped output (messages persisted before companions).
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

const listFilesPreview = computed(() => {
    if (resolved.value.toolName !== 'list_files') return null
    if (resolved.value.state !== 'ok') return null
    // Rich companion payload (notice body), stored AS IS.
    const frontend = resolved.value.frontend as ListFilesToolData | undefined
    if (!frontend || !Array.isArray(frontend.nodes)) return null
    const shown = frontend.nodes.slice(0, 50)
    return {
        path: frontend.requestedPath,
        total: frontend.total,
        nodes: shown.map((n) => ({
            name: n.name,
            isDirectory: n.isDirectory,
            isSymlink: n.meta?.isSymlink === true,
            target: n.meta?.symlinkTarget,
            empty: n.hasChildren === false,
            size: typeof n.size === 'number' ? formatSize(n.size) : null,
        })),
        hidden: frontend.total - shown.length,
    }
})

const editFilePreview = computed(() => {
    if (resolved.value.toolName !== 'edit_file') return null
    if (resolved.value.state !== 'ok') return null
    const frontend = resolved.value.frontend as EditFileToolData | undefined
    let diff: string | undefined
    let diffTruncated: boolean | undefined
    let filePath = ''
    let appliedEdits: number | undefined
    if (frontend && typeof frontend.diff === 'string') {
        diff = frontend.diff
        diffTruncated = frontend.diffTruncated
        filePath = frontend.path ?? ''
        appliedEdits = frontend.appliedEdits
    } else {
        const output = resolved.value.output as
            | { diff?: string; diffTruncated?: boolean; path?: string }
            | undefined
        if (typeof output?.diff === 'string') {
            diff = output.diff
            diffTruncated = output.diffTruncated
            filePath = output.path ?? ''
            const input = resolved.value.input as unknown
            if (!filePath && input && typeof input === 'object' && 'path' in (input as Record<string, unknown>)) {
                const p = (input as Record<string, unknown>).path
                if (typeof p === 'string') filePath = p
            }
            if (!filePath && input && typeof input === 'object' && 'raw' in (input as Record<string, unknown>)) {
                const raw = (input as Record<string, unknown>).raw
                if (typeof raw === 'string') filePath = raw.split('\n')[0]?.trim() ?? ''
            }
        }
    }
    if (typeof diff !== 'string' || diff.trim() === '') return null
    return {
        diff,
        path: filePath,
        lang: inferLangFromPath(filePath),
        truncated: !!diffTruncated,
        isDark: isDark.value,
        appliedEdits,
    }
})

function formatSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '0B'
    if (bytes < 1024) return `${Math.trunc(bytes)}B`
    const kb = bytes / 1024
    if (kb < 1024) return `${Math.round(kb * 10) / 10}kb`
    const mb = kb / 1024
    if (mb < 1024) return `${Math.round(mb * 10) / 10}mb`
    return `${Math.round((mb / 1024) * 10) / 10}gb`
}

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
        <template v-else-if="editFilePreview" #preview>
            <div class="edit-file-preview">
                <div v-if="editFilePreview.path" class="edit-file-preview__path">
                    {{ editFilePreview.path }}
                    <span v-if="editFilePreview.appliedEdits != null" class="edit-file-preview__meta"
                        >· {{ editFilePreview.appliedEdits }} edit{{ editFilePreview.appliedEdits === 1 ? '' : 's' }}</span
                    >
                    <span v-if="editFilePreview.truncated" class="edit-file-preview__truncated"
                        >(diff truncated)</span
                    >
                </div>
                <CodeRenderer
                    :schema="{
                        code: editFilePreview.diff,
                        lang: editFilePreview.lang,
                        variant: 'diff',
                        status: 'done',
                        isDark: editFilePreview.isDark,
                    }"
                />
            </div>
        </template>
        <template v-else-if="listFilesPreview" #preview>
            <div class="list-files-preview">
                <div class="list-files-preview__path">{{ listFilesPreview.path }}</div>
                <ul class="list-files-preview__nodes">
                    <li
                        v-for="(node, i) in listFilesPreview.nodes"
                        :key="i"
                        class="list-files-preview__node"
                        :class="{
                            'is-dir': node.isDirectory && !node.isSymlink,
                            'is-link': node.isSymlink,
                        }"
                    >
                        <span class="node-icon">{{
                            node.isSymlink ? '🔗' : node.isDirectory ? '📁' : '📄'
                        }}</span>
                        <span class="node-name"
                            >{{ node.name }}{{ node.isDirectory && !node.isSymlink ? '/' : ''
                            }}<span v-if="node.isSymlink && node.target" class="node-target">
                                → {{ node.target }}</span
                            ><span v-if="node.empty" class="node-empty"> (empty)</span></span
                        >
                        <span v-if="node.size" class="node-size">{{ node.size }}</span>
                    </li>
                </ul>
                <div v-if="listFilesPreview.hidden > 0" class="list-files-preview__more">
                    +{{ listFilesPreview.hidden }} more of {{ listFilesPreview.total }}
                </div>
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

.list-files-preview {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    max-height: 420px;
    overflow: auto;
    font-family: var(--font-mono);
    font-size: var(--type-xs);
}

.list-files-preview__path {
    opacity: 0.6;
    word-break: break-all;
}

.list-files-preview__nodes {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.list-files-preview__node {
    display: flex;
    align-items: baseline;
    gap: 6px;
    word-break: break-all;
}

.node-icon {
    flex-shrink: 0;
}

.node-target {
    opacity: 0.6;
}

.node-empty {
    opacity: 0.5;
}

.node-size {
    margin-left: auto;
    opacity: 0.5;
    flex-shrink: 0;
}

.list-files-preview__more {
    opacity: 0.6;
}

.edit-file-preview {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    max-height: 420px;
    overflow: auto;
}

.edit-file-preview__path {
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    opacity: 0.6;
    word-break: break-all;
}

.edit-file-preview__meta {
    margin-left: 6px;
    opacity: 0.8;
}

.edit-file-preview__truncated {
    margin-left: 6px;
    color: var(--text-warning, #d97706);
}
</style>
