<script setup lang="ts">
import { ref } from 'vue'
import { Cube, NavArrowDown, SendDiagonal, Xmark } from '@iconoir/vue'
import DropdownRoot from '@/components/dropdown/DropdownRoot.vue'
import type { ResolvedChatInput } from '../types/resolved'

const props = defineProps<{
    resolved: ResolvedChatInput
}>()

const input = ref('')

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
    const providerId = props.resolved.providerId
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
            <DropdownRoot
                :items="resolved.modelItems"
                placement="top"
                mode="select"
                :model-value="resolved.modelId"
                dense
                :offset="6"
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
</template>
