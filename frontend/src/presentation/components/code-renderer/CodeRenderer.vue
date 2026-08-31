<script setup lang="ts">
import { computed } from 'vue'
import type { CodeRendererSchema } from './types/schema'
import { resolveCodeRendererSchema } from './resolver/resolveCodeRendererSchema'
import { useCodeRenderer } from './composables/useCodeRenderer'
import { parseCodeLines } from './utils/parseLineNumbers'
import CodeTokens from './components/CodeTokens.vue'
import './styles/index.css'

defineOptions({ name: 'CodeRenderer' })

const props = defineProps<{ schema: CodeRendererSchema }>()

const resolved = computed(() => resolveCodeRendererSchema(props.schema))

const parsedLines = computed(() => parseCodeLines(resolved.value.code))

const lineNumbers = computed(() => parsedLines.value.map((p) => p.lineNumber))

const codeForHighlight = computed(() => parsedLines.value.map((p) => p.text).join('\n'))

const highlightResolved = computed(() => ({
    ...resolved.value,
    code: codeForHighlight.value,
}))

const { tokens, isHighlighted, copy } = useCodeRenderer(highlightResolved)

defineExpose({ copy })
</script>

<template>
    <pre
        class="code-renderer"
        :class="{
            'code-renderer--idle': resolved.status === 'idle',
            'code-renderer--streaming': resolved.status === 'streaming',
            'code-renderer--done': resolved.status === 'done',
            'code-renderer--highlighted': isHighlighted,
        }"
        :data-lang="resolved.lang"
        :data-status="resolved.status"
    ><code class="code-renderer__inner"><CodeTokens
            v-if="isHighlighted && tokens.length"
            :lines="tokens"
            :line-numbers="lineNumbers"
        /><template v-else
            ><span
                v-for="(line, idx) in parsedLines"
                :key="idx"
                class="code-renderer__line code-renderer__plain"
                ><span class="code-renderer__gutter">{{ line.lineNumber }}</span
                ><span class="code-renderer__content">{{ line.text }}<template v-if="!line.text">&#8203;</template></span></span
            ><span v-if="parsedLines.length === 0" class="code-renderer__line code-renderer__plain"
                ><span class="code-renderer__gutter">1</span
                ><span class="code-renderer__content">&#8203;</span></span></template></code></pre>
</template>
