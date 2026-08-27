<script setup lang="ts">
import type { Code } from 'mdast'
import { computed, ref } from 'vue'
import { injectMarkdownContext } from '../../composables/markdown-context'
import { CodeRenderer } from '@/presentation/components/code-renderer'
import CodeToolbar from '../code/CodeToolbar.vue'

const props = defineProps<{ node: Code & { loading?: boolean } }>()

const ctx = injectMarkdownContext()

const lang = computed(() => props.node.lang || 'text')
const code = computed(() => props.node.value)
const status = computed(() => (props.node.loading ? 'streaming' : 'done'))

const rendererRef = ref<InstanceType<typeof CodeRenderer> | null>(null)

const codeRendererSchema = computed(() => ({
    code: code.value,
    lang: lang.value,
    status: status.value as 'streaming' | 'done',
    isDark: ctx.isDark.value,
    theme: ctx.codeTheme.value,
}))

function handleToolbarCopy(): void {
    void rendererRef.value?.copy()
}
</script>

<template>
    <div class="markdown-code" :class="{ 'markdown-code--loading': node.loading }">
        <CodeToolbar :lang="lang" :code="code" @copy="handleToolbarCopy" />
        <CodeRenderer ref="rendererRef" :schema="codeRendererSchema" class="markdown-code__renderer" />
    </div>
</template>
