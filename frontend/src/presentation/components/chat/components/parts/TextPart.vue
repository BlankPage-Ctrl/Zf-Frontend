<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStorer } from '@/application/stores'
import { Markdown } from '@/vendor/vue-stream-markdown/vue/src/index.ts'
import { createHtmlNodeRenderer } from '@/vendor/vue-stream-markdown/vue/src/html'
import { parseHtml } from '@/vendor/vue-stream-markdown/extensions/html/src/parse'
import type { TextPartSchema } from '../../types/schema'
import { resolveTextPartSchema } from '../../resolver/resolvePartsSchema'

const props = defineProps<{
    schema: TextPartSchema
}>()

const themeStorer = useThemeStorer()

const htmlRenderer = createHtmlNodeRenderer({ transform: parseHtml })

const resolved = computed(() => resolveTextPartSchema(props.schema))
const isDark = computed(() => themeStorer.activeThemeId === 'night')
</script>

<template>
    <div
        class="text-part"
        :style="{
            fontSize: resolved.fontSize + 'px',
            lineHeight: resolved.lineHeight,
        }"
    >
        <Markdown
            :content="resolved.text"
            :mode="resolved.state === 'streaming' ? 'streaming' : 'static'"
            :caret="resolved.state === 'streaming' ? 'block' : undefined"
            :is-dark="isDark"
            :node-renderers="{ html: htmlRenderer }"
        />
    </div>
</template>
