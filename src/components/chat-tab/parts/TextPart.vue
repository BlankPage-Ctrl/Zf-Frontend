<script setup lang="ts">
import { Markdown } from '@/vendor/vue-stream-markdown/vue/src/index.ts'
import { createHtmlNodeRenderer } from '@/vendor/vue-stream-markdown/vue/src/html'
import { parseHtml } from '@/vendor/vue-stream-markdown/extensions/html/src/parse'
import { useAppearanceStore } from '@/stores/appearance'

defineProps<{
    text: string
    state?: string
}>()

const htmlRenderer = createHtmlNodeRenderer({ transform: parseHtml })
const appearance = useAppearanceStore()
</script>

<template>
    <div
        class="text-part"
        :style="{
            fontSize: appearance.fontSize + 'px',
            lineHeight: appearance.lineHeight,
        }"
    >
        <Markdown
            :content="text"
            :mode="state === 'streaming' ? 'streaming' : 'static'"
            :caret="state === 'streaming' ? 'block' : undefined"
            :node-renderers="{ html: htmlRenderer }"
        />
    </div>
</template>

<style scoped>
.text-part {
    color: rgb(var(--text-color));
}

.text-part :deep(a) {
    color: rgb(59, 130, 246);
    text-decoration: underline;
    text-underline-offset: 2px;
}

.text-part :deep(img) {
    max-width: 100%;
    border-radius: 8px;
}
</style>
