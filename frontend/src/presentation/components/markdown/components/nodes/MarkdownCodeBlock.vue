<script setup lang="ts">
import type { Code } from 'mdast'
import { computed, ref } from 'vue'
import { Code as CodeIcon, Copy } from '@iconoir/vue'
import { injectMarkdownContext } from '../../composables/markdown-context'
import { CodeRenderer } from '@/presentation/components/code-renderer'
import { BlockPart } from '@/presentation/components/blockpart'
import type { BlockPartSchema, BlockPartAction } from '@/presentation/components/blockpart'

const props = defineProps<{ node: Code & { loading?: boolean } }>()

const ctx = injectMarkdownContext()

const lang = computed(() => props.node.lang || 'text')
const code = computed(() => props.node.value)
const status = computed(() => (props.node.loading ? 'streaming' : 'done'))

const codeRendererSchema = computed(() => ({
    code: code.value,
    lang: lang.value,
    status: status.value as 'streaming' | 'done',
    isDark: ctx.isDark.value,
    theme: ctx.codeTheme.value,
}))

const codeRef = ref<InstanceType<typeof CodeRenderer> | null>(null)
const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

function setCopiedTooltip() {
    copied.value = true
    if (resetTimer) clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
        copied.value = false
    }, 1500)
}

async function handleCopy() {
    let ok = false
    try {
        if (codeRef.value?.copy) {
            ok = await codeRef.value.copy()
        } else {
            await navigator.clipboard.writeText(code.value)
            ok = true
        }
    } catch {
        ok = false
    }
    if (!ok && code.value) {
        try {
            await navigator.clipboard.writeText(code.value)
            ok = true
        } catch {
            ok = false
        }
    }
    if (ok) setCopiedTooltip()
}

const copyAction = computed<BlockPartAction>(() => ({
    id: 'copy',
    icon: Copy,
    ariaLabel: 'Copy code',
    tooltip: copied.value ? 'Copied!' : 'Copy',
    disabled: !code.value,
    onClick: handleCopy,
}))

const blockSchema = computed<BlockPartSchema>(() => ({
    title: lang.value,
    variant: 'default',
    icon: CodeIcon,
    defaultExpanded: true,
    collapsible: true,
    viewToggle: true,
    defaultView: 'preview',
    status: status.value,
    actions: [copyAction.value],
}))
</script>

<template>
    <BlockPart :schema="blockSchema" class="markdown-code">
        <template #preview>
            <CodeRenderer ref="codeRef" :schema="codeRendererSchema" class="markdown-code__renderer" />
        </template>
    </BlockPart>
</template>
