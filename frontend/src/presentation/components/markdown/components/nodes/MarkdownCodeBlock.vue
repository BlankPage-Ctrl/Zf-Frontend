<script setup lang="ts">
import type { Code } from 'mdast'
import { computed } from 'vue'
import { injectMarkdownContext } from '../../composables/markdown-context'
import { CodeRenderer } from '@/presentation/components/code-renderer'
import { BlockPart } from '@/presentation/components/blockpart'
import type { BlockPartSchema } from '@/presentation/components/blockpart'

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

const blockSchema = computed<BlockPartSchema>(() => ({
    title: lang.value,
    variant: 'compact',
    collapsible: true,
    status: status.value,
}))
</script>

<template>
    <BlockPart :schema="blockSchema" class="markdown-code">
        <template #preview>
            <CodeRenderer :schema="codeRendererSchema" class="markdown-code__renderer" />
        </template>
    </BlockPart>
</template>
