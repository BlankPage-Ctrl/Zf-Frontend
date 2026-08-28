<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

watch(resolved, (val) => {
    expanded.value = val.expanded
    viewMode.value = val.viewMode
})

function toggleExpand() {
    expanded.value = !expanded.value
}

function toggleView(mode: BlockPartViewMode) {
    viewMode.value = mode
}
</script>

<template>
    <div
        class="block-part"
        :class="[
            `block-part--${resolved.variant}`,
            { 'block-part--streaming': status === 'streaming' },
            expanded ? 'block-part--expanded' : 'block-part--collapsed',
        ]"
    >
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
            <PreviewView v-if="viewMode === 'preview'" :config="resolved.preview">
                <slot name="preview" />
                <slot />
            </PreviewView>
            <SourceView v-else :config="resolved.source">
                <slot />
            </SourceView>
        </div>
    </div>
</template>

<style scoped>
@property --bp-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
}

.block-part {
    margin: 4px 0;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    overflow: hidden;
}

.block-part--compact .block-part__content {
    /* padding: 6px 10px; */
}

.block-part--detailed .block-part__content {
    /* padding: 12px 14px; */
}

.block-part__content {
    min-height: 0;
    position: relative;
    z-index: 1;
}

.block-part--streaming {
    position: relative;
    border-color: transparent;
    isolation: isolate;
}

.block-part--streaming :deep(.block-header) {
    z-index: 1;
}

.block-part--streaming::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.5px;
    background: conic-gradient(
        from var(--bp-angle),
        transparent 0deg,
        transparent 250deg,
        var(--stream-accent) 320deg,
        var(--stream-accent) 360deg
    );
    -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
    mask-composite: exclude;
    animation: bp-rotate 1.4s linear infinite;
    pointer-events: none;
    z-index: 0;
    opacity: 0;
    transition: opacity 0.35s ease;
}

.block-part--streaming::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow:
        0 0 0 1px color-mix(in srgb, var(--stream-accent) 18%, transparent),
        0 0 10px var(--stream-accent-soft, rgba(37, 99, 235, 0.14)),
        0 0 18px var(--stream-accent-glow, rgba(37, 99, 235, 0.08));
    opacity: 0;
    pointer-events: none;
    z-index: 0;
    transition: opacity 0.35s ease;
}

.block-part--streaming.block-part--expanded::before {
    opacity: 1;
}
.block-part--streaming.block-part--expanded::after {
    opacity: 0.85;
}
.block-part--streaming.block-part--expanded :deep(.block-header--streaming::after) {
    opacity: 0 !important;
}

.block-part--streaming.block-part--collapsed::before {
    opacity: 0;
}
.block-part--streaming.block-part--collapsed::after {
    opacity: 0;
}
.block-part--streaming.block-part--collapsed :deep(.block-header--streaming::after) {
    opacity: 0.9 !important;
}
@supports not ((mask-composite: exclude) or (-webkit-mask-composite: xor)) {
    .block-part--streaming::before {
        -webkit-mask: none;
        mask: none;
        padding: 0;
        inset: -1px;
        background: conic-gradient(
            from var(--bp-angle),
            transparent 0deg,
            transparent 250deg,
            var(--stream-accent) 320deg,
            var(--stream-accent) 360deg
        );
    }
    .block-part--streaming::after {
        inset: 1.5px;
        background: var(--bg-primary);
        box-shadow: none;
    }
    .block-part--streaming.block-part--expanded::after {
        opacity: 1;
    }
    .block-part--streaming.block-part--collapsed::after {
        opacity: 0;
    }
    /* markdown code bg beda */
    :global(.markdown) .block-part--streaming::after {
        background: var(--md-code-bg, var(--bg-primary));
    }
}

@supports not (background: conic-gradient(from 0deg, red, blue)) {
    .block-part--streaming::before {
        background: linear-gradient(
            90deg,
            transparent 0%,
            var(--stream-accent) 45%,
            var(--stream-accent) 55%,
            transparent 100%
        );
        background-size: 200% 100%;
        animation: bp-slide 1.2s linear infinite;
    }
}

@keyframes bp-rotate {
    to {
        --bp-angle: 360deg;
    }
}

@keyframes bp-slide {
    0% {
        background-position: 130% 0;
    }
    100% {
        background-position: -30% 0;
    }
}

@media (prefers-reduced-motion: reduce) {
    .block-part--streaming::before,
    .block-part--streaming::after,
    .block-part--streaming :deep(.block-header--streaming::after) {
        animation: none;
        transition: opacity 0.2s ease;
    }
    .block-part--streaming::before {
        background: transparent;
        border: 1.5px solid color-mix(in srgb, var(--stream-accent) 45%, transparent);
        padding: 0;
        -webkit-mask: none;
        mask: none;
    }
    .block-part--streaming::after {
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--stream-accent) 12%, transparent);
    }
    .block-part--streaming.block-part--expanded :deep(.block-header--streaming::after) {
        opacity: 0 !important;
    }
    .block-part--streaming.block-part--collapsed :deep(.block-header--streaming::after) {
        opacity: 0.45 !important;
    }
}
</style>
