<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue'
import { Brain, Cube, NavArrowDown, SendDiagonal, Xmark } from '@iconoir/vue'
import DropdownRoot from '@/presentation/components/dropdown/DropdownRoot.vue'
import { MentionDropup } from '@/presentation/components/mention'
import type { ResolvedChatInput } from '../types/resolved'
import type { DropdownItemConfig, StyleConfig } from '@/presentation/components/dropdown/types'
import type { MentionItem, MentionTriggerRange } from '@/core/entities'
import { detectMentionTrigger, insertMentionAt } from '@/shared/utils/mention.utils'

const props = defineProps<{
    resolved: ResolvedChatInput
}>()

const THINKING_LEVELS: { value: string; label: string }[] = [
    { value: 'default', label: 'Default' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'xhigh', label: 'X-High' },
]

const modelDropdownStyle: StyleConfig = {
    menu: {
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '2px',
        shadow: '0 4px 14px rgba(0, 0, 0, 0.14)',
    },
    item: {
        padding: '3px 8px',
        fontSize: 'var(--type-xs)',
        borderRadius: '4px',
        hoverBackground: 'var(--border-color)',
        focusedBackground: 'var(--border-color)',
        selectedBackground: 'var(--border-color)',
    },
}

const input = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const mentionRange = ref<MentionTriggerRange | null>(null)
const mentionActiveIndex = ref(0)
const mentionDropupRef = ref<InstanceType<typeof MentionDropup> | null>(null)

const mentionVisible = computed(() => {
    if (!mentionRange.value) return false
    return true
})

const mentionSchema = computed(() => ({
    query: mentionRange.value?.prefix ?? '',
    items: props.resolved.mentionItems ?? [],
    visible: mentionVisible.value,
    activeIndex: mentionActiveIndex.value,
    loading: props.resolved.mentionLoading ?? false,
    grouped: false,
    emptyMessage: 'No files found',
}))

let searchDebounce: ReturnType<typeof setTimeout> | null = null

function triggerMentionSearch(query: string, range: MentionTriggerRange) {
    if (searchDebounce) clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => {
        props.resolved.onMentionSearch?.(query, range)
    }, 180)
}

function updateMentionState(text: string, caretPos: number) {
    const hit = detectMentionTrigger(text, caretPos)
    if (!hit) {
        mentionRange.value = null
        mentionActiveIndex.value = 0
        return
    }
    mentionRange.value = hit
    mentionActiveIndex.value = 0
    triggerMentionSearch(hit.prefix, hit)
}

function onInputWithMention(e: Event) {
    const target = e.target as HTMLTextAreaElement
    const caret = target.selectionStart ?? input.value.length
    updateMentionState(input.value, caret)
}

function onKeyupWithMention(e: KeyboardEvent) {
    const target = e.target as HTMLTextAreaElement
    const caret = target.selectionStart ?? input.value.length
    // Arrow keys should not reset mention unless trigger gone
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
        updateMentionState(input.value, caret)
    }
}

function onClickWithMention(e: MouseEvent) {
    const target = e.target as HTMLTextAreaElement
    const caret = target.selectionStart ?? input.value.length
    updateMentionState(input.value, caret)
}

function handleMentionSelect(item: MentionItem) {
    if (!mentionRange.value) return
    const result = insertMentionAt(input.value, mentionRange.value, item.insertText)
    input.value = result.text
    mentionRange.value = null
    mentionActiveIndex.value = 0
    nextTick(() => {
        if (textareaRef.value) {
            textareaRef.value.focus()
            textareaRef.value.selectionStart = result.caretPos
            textareaRef.value.selectionEnd = result.caretPos
        }
    })
}

function handleMentionClose() {
    mentionRange.value = null
    mentionActiveIndex.value = 0
}

function handleMentionNavigate(idx: number) {
    mentionActiveIndex.value = idx
}

watch(
    () => props.resolved.mentionItems,
    () => {
        // keep active index in bounds
        const len = props.resolved.mentionItems?.length ?? 0
        if (mentionActiveIndex.value >= len && len > 0) mentionActiveIndex.value = 0
    },
)

const thinkingEnabled = computed(
    () =>
        !!props.resolved.thinkingMode &&
        props.resolved.thinkingMode !== 'none' &&
        !!props.resolved.onChangeThinkingMode,
)

const currentLevel = computed(() =>
    thinkingEnabled.value ? (props.resolved.thinkingMode ?? 'default') : 'default',
)

const levelItems = computed<DropdownItemConfig<string>[]>(() =>
    THINKING_LEVELS.map(({ value, label }) => ({
        id: `lvl-${value}`,
        label,
        value,
        selected: value === currentLevel.value,
    })),
)

function toggleThinking() {
    if (props.resolved.onChangeThinkingMode) {
        props.resolved.onChangeThinkingMode(thinkingEnabled.value ? 'none' : 'default')
    }
}

function onLevelSelect(value: string) {
    props.resolved.onChangeThinkingMode?.(value)
}

function onKeydown(e: KeyboardEvent) {
    // Mention navigation takes precedence when visible
    if (mentionVisible.value) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Escape') {
            mentionDropupRef.value?.handleKeydown(e)
            if (e.defaultPrevented) return
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
            if ((props.resolved.mentionItems?.length ?? 0) > 0) {
                e.preventDefault()
                const item = props.resolved.mentionItems![mentionActiveIndex.value]
                if (item) handleMentionSelect(item)
                return
            }
        }
        if (e.key === 'Escape') {
            e.preventDefault()
            handleMentionClose()
            return
        }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
    }
}

function handleSend() {
    const text = input.value.trim()
    if (!text || props.resolved.disabled) return
    props.resolved.onSend?.(text)
    input.value = ''
    mentionRange.value = null
}

function handleStop() {
    props.resolved.onStop?.()
}

function onModelSelect(value: string) {
    if (!props.resolved.onSelectModel) return
    const item = props.resolved.modelItems.find((i) => i.value === value)
    const providerId = item?.providerId ?? props.resolved.providerId
    if (providerId) {
        props.resolved.onSelectModel(value, providerId)
    }
}
</script>

<template>
    <div class="chat-input">
        <MentionDropup
            ref="mentionDropupRef"
            :schema="mentionSchema"
            @select="handleMentionSelect"
            @close="handleMentionClose"
            @navigate="handleMentionNavigate"
        >
            <template #default>
                <div class="input-container">
                    <textarea
                        ref="textareaRef"
                        v-model="input"
                        class="input-field"
                        :placeholder="
                            resolved.disabled ? 'AI is responding...' : resolved.placeholder
                        "
                        :disabled="resolved.disabled"
                        rows="1"
                        @keydown="onKeydown"
                        @input="onInputWithMention"
                        @keyup="onKeyupWithMention"
                        @click="onClickWithMention"
                    />
                    <div class="input-actions">
                        <button
                            v-if="resolved.disabled"
                            class="action-btn stop-btn"
                            @click="handleStop"
                            title="Stop generating"
                            type="button"
                        >
                            <Xmark width="16" height="16" />
                        </button>
                        <button
                            v-else
                            class="action-btn send-btn"
                            :disabled="!input.trim()"
                            @click="handleSend"
                            title="Send message"
                            type="button"
                        >
                            <SendDiagonal width="16" height="16" />
                        </button>
                    </div>
                </div>
            </template>
        </MentionDropup>
        <div class="input-footer">
            <div class="input-footer__left">
                <button
                    class="thinking-toggle"
                    :class="{ 'thinking-toggle--active': thinkingEnabled }"
                    :title="thinkingEnabled ? 'Thinking enabled' : 'Thinking disabled'"
                    @click="toggleThinking"
                    type="button"
                >
                    <Brain width="11" height="11" />
                    <span>Thinking</span>
                </button>
                <DropdownRoot
                    v-if="thinkingEnabled"
                    :items="levelItems"
                    placement="top"
                    mode="select"
                    :model-value="currentLevel"
                    dense
                    :offset="4"
                    :width="{ mode: 'match-trigger' }"
                    :style="modelDropdownStyle"
                    @select="onLevelSelect"
                >
                    <template #trigger="{ isOpen, toggle }">
                        <button
                            class="thinking-level"
                            :class="{ 'thinking-level--open': isOpen }"
                            @click="toggle"
                            type="button"
                        >
                            <span>{{ currentLevel }}</span>
                            <NavArrowDown
                                width="10"
                                height="10"
                                stroke-width="2.5"
                                class="model-selector__chevron"
                                :class="{ 'model-selector__chevron--open': isOpen }"
                            />
                        </button>
                    </template>
                </DropdownRoot>
            </div>
            <div class="input-footer__right">
                <DropdownRoot
                    :items="resolved.modelItems"
                    placement="top"
                    mode="select"
                    :model-value="resolved.modelId"
                    dense
                    :offset="4"
                    :width="{ mode: 'match-trigger' }"
                    :style="modelDropdownStyle"
                    @select="onModelSelect"
                >
                    <template #trigger="{ isOpen, toggle }">
                        <button
                            class="model-selector"
                            :class="{ 'model-selector--open': isOpen }"
                            :disabled="resolved.modelItems.length === 0"
                            @click="toggle"
                            type="button"
                        >
                            <Cube width="12" height="12" />
                            <span class="model-selector__label">{{ resolved.selectedLabel }}</span>
                            <NavArrowDown
                                width="10"
                                height="10"
                                stroke-width="2.5"
                                class="model-selector__chevron"
                                :class="{ 'model-selector__chevron--open': isOpen }"
                            />
                        </button>
                    </template>
                </DropdownRoot>
            </div>
        </div>
    </div>
</template>
