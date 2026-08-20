<script setup lang="ts">
import type { Code } from 'mdast'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { ThemedToken } from 'shiki'
import { injectMarkdownContext } from '../../composables/markdown-context'
import { toTokensCached } from '../../composables/useCodeHighlighter'
import CodeToolbar from '../code/CodeToolbar.vue'
import CodeTokenView from '../code/CodeTokenView.vue'

const props = defineProps<{ node: Code & { loading?: boolean } }>()

const ctx = injectMarkdownContext()

const lang = computed(() => props.node.lang || 'text')
const code = computed(() => props.node.value)
const theme = computed(() =>
    ctx.isDark.value ? ctx.codeTheme.value.dark : ctx.codeTheme.value.light,
)

const tokens = ref<ThemedToken[][]>([])
const highlighted = ref(false)
let requestId = 0
let cancelIdle: (() => void) | undefined

function scheduleIdle(task: () => void): () => void {
    if (typeof requestIdleCallback === 'function') {
        const id = requestIdleCallback(task, { timeout: 250 })
        return () => cancelIdleCallback(id)
    }
    const id = setTimeout(task, 0)
    return () => clearTimeout(id)
}

watch(
    [code, theme, () => props.node.loading],
    () => {
        if (cancelIdle) cancelIdle()

        if (props.node.loading) {
            highlighted.value = false
            return
        }

        const id = ++requestId
        cancelIdle = scheduleIdle(() => {
            void toTokensCached(code.value, lang.value, theme.value).then((result) => {
                if (id === requestId) {
                    tokens.value = result.tokens
                    highlighted.value = true
                }
            })
        })
    },
    { immediate: true, flush: 'post' },
)

onBeforeUnmount(() => {
    cancelIdle?.()
})
</script>

<template>
    <div class="markdown-code" :class="{ 'markdown-code--loading': node.loading }">
        <CodeToolbar :lang="lang" :code="code" />
        <pre class="markdown-code-pre"><code class="markdown-code-inner">
            <CodeTokenView v-if="highlighted" :lines="tokens" />
            <template v-else>{{ code }}</template>
        </code></pre>
    </div>
</template>