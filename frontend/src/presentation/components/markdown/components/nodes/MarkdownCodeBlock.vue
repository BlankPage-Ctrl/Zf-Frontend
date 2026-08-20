<script setup lang="ts">
import type { Code } from 'mdast'
import { computed, ref, watch } from 'vue'
import type { ThemedToken } from 'shiki'
import { injectMarkdownContext } from '../../composables/markdown-context'
import { useCodeHighlighter } from '../../composables/useCodeHighlighter'
import CodeToolbar from '../code/CodeToolbar.vue'
import CodeTokenView from '../code/CodeTokenView.vue'

const props = defineProps<{ node: Code & { loading?: boolean } }>()

const ctx = injectMarkdownContext()
const { toTokens } = useCodeHighlighter()

const lang = computed(() => props.node.lang || 'text')
const code = computed(() => props.node.value)
const theme = computed(() =>
    ctx.isDark.value ? ctx.codeTheme.value.dark : ctx.codeTheme.value.light,
)

const tokens = ref<ThemedToken[][]>([])
let requestId = 0

watch(
    [code, theme],
    async () => {
        const id = ++requestId
        const result = await toTokens(code.value, lang.value, theme.value)
        if (id === requestId) tokens.value = result.tokens
    },
    { immediate: true },
)
</script>

<template>
    <div class="markdown-code" :class="{ 'markdown-code--loading': node.loading }">
        <CodeToolbar :lang="lang" :code="code" />
        <pre class="markdown-code-pre"><code class="markdown-code-inner"><CodeTokenView :lines="tokens" /></code></pre>
    </div>
</template>