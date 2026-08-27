<script setup lang="ts">
import { computed } from 'vue'
import type { CodeRendererSchema } from './types/schema'
import { resolveCodeRendererSchema } from './resolver/resolveCodeRendererSchema'
import { useCodeRenderer } from './composables/useCodeRenderer'
import CodeTokens from './components/CodeTokens.vue'
import './styles/index.css'

defineOptions({ name: 'CodeRenderer' })

const props = defineProps<{ schema: CodeRendererSchema }>()

const resolved = computed(() => resolveCodeRendererSchema(props.schema))

const { tokens, isHighlighted, copy } = useCodeRenderer(resolved)

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
    ><code class="code-renderer__inner"><CodeTokens v-if="isHighlighted && tokens.length" :lines="tokens" /><template v-else>{{ resolved.code }}</template></code></pre>
</template>
