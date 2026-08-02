<script setup lang="ts">
import type { FootnoteDefinitionNodeRendererProps } from '../../types/index.ts'
import {
    createFootnoteDefinitionModel,
    getDocumentBody,
    scrollToElement,
} from '@stream-markdown/core'
import { computed } from 'vue'
import { useContext, useI18n } from '../../composables/index.ts'
import NodeList from '../node-list.vue'

const props = withDefaults(defineProps<FootnoteDefinitionNodeRendererProps>(), {})

const { getContainer, uiComponents: UI } = useContext()

const { t } = useI18n()

const model = computed(() => createFootnoteDefinitionModel(props.node))
const id = computed(() => model.value.id)
const title = computed(() => model.value.title)

function scrollToReference() {
    const container = getContainer() || getDocumentBody()
    if (!container) return

    scrollToElement(container, `#footnote-reference-${id.value}`)
}
</script>

<template>
    <a
        :id="`footnote-definition-${id}`"
        data-stream-markdown="footnote-definition"
        class="block [&_p]:inline"
    >
        <span
            data-stream-markdown="footnote-definition-label"
            class="mr-1 align-middle inline-block"
            >{{ title }}</span
        >
        <NodeList v-bind="props" :parent-node="node" :nodes="node.children" />
        <component
            :is="UI.Button"
            data-stream-markdown="footnote-definition-button"
            class="ml-1 align-middle inline-block"
            :name="t('button.back')"
            icon="cornerDownLeft"
            :icon-style="{
                color: 'var(--markdown-primary)',
            }"
            :button-style="{
                padding: '0.25rem',
            }"
            @click="scrollToReference"
        />
    </a>
</template>

<style scoped>
a[data-stream-markdown='footnote-definition'] {
    color: var(--markdown-muted-foreground);
}
</style>
