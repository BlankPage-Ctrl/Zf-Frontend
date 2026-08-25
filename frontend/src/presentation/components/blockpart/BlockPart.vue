<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BlockPartSchema, BlockPartViewMode, BlockPartStatus } from './types/schema'
import { resolveBlockPartSchema } from './resolver/resolveBlockPartSchema'
import BlockHeader from './components/BlockHeader.vue'
import PreviewView from './components/PreviewView.vue'
import SourceView from './components/SourceView.vue'

const props = defineProps<{
    schema: BlockPartSchema
}>()

const resolved = computed(() => resolveBlockPartSchema(props.schema))

const expanded = ref(resolved.value.expanded)
const viewMode = ref<BlockPartViewMode>(resolved.value.viewMode)
const status = computed<BlockPartStatus>(() => resolved.value.status)

function toggleExpand() {
    expanded.value = !expanded.value
}

function toggleView(mode: BlockPartViewMode) {
    viewMode.value = mode
}
</script>

<template>
    <div class="block-part" :class="[`block-part--${resolved.variant}`]">
        <BlockHeader
            :title="resolved.title"
            :icon="resolved.icon"
            :collapsible="resolved.collapsible"
            :expanded="expanded"
            :view-toggle="resolved.viewToggle"
            :view-mode="viewMode"
            :status="status"
            :has-preview="resolved.hasPreview"
            :has-source="resolved.hasSource"
            @toggle-expand="toggleExpand"
            @toggle-view="toggleView"
        />
        <div v-show="expanded" class="block-part__content">
            <template v-if="resolved.viewToggle">
                <PreviewView v-if="viewMode === 'preview'" :config="resolved.preview">
                    <slot name="preview" />
                </PreviewView>
                <SourceView v-else :config="resolved.source" />
            </template>
            <slot v-else />
        </div>
    </div>
</template>

<style scoped>
.block-part {
    margin: 4px 0;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    overflow: hidden;
}

.block-part--compact .block-part__content {
    padding: 6px 10px;
}

.block-part--detailed .block-part__content {
    padding: 12px 14px;
}

.block-part__content {
    min-height: 0;
}
</style>
