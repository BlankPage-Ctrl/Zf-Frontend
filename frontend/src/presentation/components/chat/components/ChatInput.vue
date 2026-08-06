<script setup lang="ts">
import { computed, ref } from 'vue'
import { Brain, Cube, NavArrowDown, SendDiagonal, Xmark } from '@iconoir/vue'
import DropdownRoot from '@/presentation/components/dropdown/DropdownRoot.vue'
import type { ResolvedChatInput } from '../types/resolved'
import type { DropdownItemConfig, StyleConfig } from '@/presentation/components/dropdown/types'

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
        <div class="input-container">
            <textarea
                v-model="input"
                class="input-field"
                :placeholder="resolved.disabled ? 'AI is responding...' : resolved.placeholder"
                :disabled="resolved.disabled"
                rows="1"
                @keydown="onKeydown"
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
