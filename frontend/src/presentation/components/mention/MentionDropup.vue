<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useFloating, offset, flip, shift, size, autoUpdate } from '@floating-ui/vue'
import type { MentionSchema } from './types/mention.types'
import { resolveMentionSchema } from './resolver/resolveMentionSchema'
import MentionList from './components/MentionList.vue'

const props = defineProps<{ schema: MentionSchema }>()
const emit = defineEmits<{
    (e: 'select', item: import('@/core/entities/mention').MentionItem): void
    (e: 'close'): void
    (e: 'navigate', index: number): void
}>()

const resolved = computed(() => resolveMentionSchema(props.schema))

const referenceEl = ref<HTMLElement | null>(null)
const floatingEl = ref<HTMLElement | null>(null)

const { floatingStyles } = useFloating(referenceEl, floatingEl, {
    placement: 'top-start',
    middleware: [
        offset(6),
        flip({ fallbackPlacements: ['bottom-start', 'top-start'] }),
        shift({ padding: 8 }),
        size({
            apply({ rects, elements }) {
                elements.floating.style.width = `${rects.reference.width}px`
            },
        }),
    ],
    whileElementsMounted: autoUpdate,
    open: computed(() => resolved.value.visible),
})

function onSelect(item: import('@/core/entities/mention').MentionItem) {
    emit('select', item)
}

function handleKeydown(e: KeyboardEvent) {
    if (!resolved.value.visible) return
    if (e.key === 'Escape') {
        e.preventDefault()
        emit('close')
        return
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = (resolved.value.activeIndex + 1) % resolved.value.items.length
        emit('navigate', next)
        return
    }
    if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = (resolved.value.activeIndex - 1 + resolved.value.items.length) % resolved.value.items.length
        emit('navigate', prev)
        return
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
        if (resolved.value.items.length === 0) return
        e.preventDefault()
        const item = resolved.value.items[resolved.value.activeIndex]
        if (item) emit('select', item)
    }
}

function onClickOutside(e: MouseEvent) {
    if (!resolved.value.visible) return
    const target = e.target as HTMLElement
    if (floatingEl.value?.contains(target)) return
    if (referenceEl.value?.contains(target)) return
    emit('close')
}

onMounted(() => {
    document.addEventListener('mousedown', onClickOutside)
})
onBeforeUnmount(() => {
    document.removeEventListener('mousedown', onClickOutside)
})

// expose anchor setter for parent
defineExpose({ referenceEl, handleKeydown })
</script>

<template>
    <div class="mention-dropup">
        <div ref="referenceEl" class="mention-dropup__anchor">
            <slot :handle-keydown="handleKeydown" />
        </div>

        <Transition name="mention-fade">
            <div
                v-if="resolved.visible"
                ref="floatingEl"
                class="mention-floating"
                :style="floatingStyles"
            >
                <MentionList
                    :items="resolved.items"
                    :active-index="resolved.activeIndex"
                    :grouped="resolved.grouped"
                    :empty-message="resolved.emptyMessage"
                    :loading="resolved.loading"
                    @select="onSelect"
                />
            </div>
        </Transition>
    </div>
</template>

<style scoped src="./styles/index.css"></style>
