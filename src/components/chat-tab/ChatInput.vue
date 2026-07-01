<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Cube, NavArrowDown, SendDiagonal, Xmark } from '@iconoir/vue'
import DropdownRoot from '@/components/dropdown/DropdownRoot.vue'
import { useProviderStore } from '@/stores/provider'
import type { DropdownItemConfig } from '@/components/dropdown/types'

const props = defineProps<{
    loading?: boolean
    modelId?: string
    providerId?: string
}>()

const emit = defineEmits<{
    send: [text: string]
    stop: []
    'select-model': [modelId: string, providerId: string]
}>()

const input = ref('')
const providerStore = useProviderStore()

onMounted(() => {
    if (providerStore.providers.length === 0) {
        providerStore.fetchProviders()
    }
})

const modelItems = computed<DropdownItemConfig[]>(() => {
    const items: DropdownItemConfig[] = []
    const providers = providerStore.providers

    providers.forEach((provider, idx) => {
        items.push({
            id: `hdr-${provider.id}`,
            label: provider.name,
            type: 'label',
        })

        provider.models.forEach((model) => {
            items.push({
                id: model.id,
                label: model.displayName || model.modelId,
                value: model.id,
                selected: model.id === props.modelId,
            })
        })

        if (idx < providers.length - 1) {
            items.push({ id: `sep-${provider.id}`, type: 'separator' })
        }
    })

    if (items.length === 0) {
        items.push({
            id: 'no-models',
            label: 'No models available',
            enabled: false,
        })
    }

    return items
})

const selectedLabel = computed(() => {
    if (!props.modelId) return 'Select model'
    for (const provider of providerStore.providers) {
        const model = provider.models.find((m) => m.id === props.modelId)
        if (model) return model.displayName || model.modelId
    }
    return 'Select model'
})

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
    }
}

function handleSend() {
    const text = input.value.trim()
    if (!text || props.loading) return
    emit('send', text)
    input.value = ''
}

function handleStop() {
    emit('stop')
}

function onModelSelect(value: string) {
    for (const provider of providerStore.providers) {
        if (provider.models.some((m) => m.id === value)) {
            emit('select-model', value, provider.id)
            break
        }
    }
}
</script>

<template>
    <div class="chat-input">
        <div class="input-container">
            <textarea
                v-model="input"
                class="input-field"
                :placeholder="loading ? 'AI is responding...' : 'Type a message...'"
                :disabled="loading"
                rows="1"
                @keydown="onKeydown"
            />
            <div class="input-actions">
                <button
                    v-if="loading"
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
                :items="modelItems"
                placement="top"
                mode="select"
                :model-value="modelId"
                dense
                :offset="6"
                @select="onModelSelect"
            >
                <template #trigger="{ isOpen, toggle }">
                    <button
                        class="model-selector"
                        :class="{ 'model-selector--open': isOpen }"
                        :disabled="modelItems.length === 0"
                        @click="toggle"
                        type="button"
                    >
                        <Cube width="12" height="12" />
                        <span class="model-selector__label">{{ selectedLabel }}</span>
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

<style scoped>
.chat-input {
    flex-shrink: 0;
    padding: 8px 16px 12px;
    border-top: 1px solid rgba(var(--third-color), 0.1);
}

.input-container {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 8px 12px;
    border: 1px solid rgba(var(--third-color), 0.15);
    border-radius: 12px;
    background: rgba(var(--third-color), 0.04);
    transition: border-color 0.15s;
}

.input-container:focus-within {
    border-color: rgba(var(--third-color), 0.3);
}

.input-field {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.5;
    color: rgb(var(--text-color));
    resize: none;
    max-height: 200px;
    min-height: 24px;
}

.input-field::placeholder {
    opacity: 0.35;
}

.input-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
}

.action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition:
        background 0.15s,
        opacity 0.15s;
}

.send-btn {
    background: rgba(var(--third-color), 0.1);
    color: rgb(var(--text-color));
}

.send-btn:hover:not(:disabled) {
    background: rgba(var(--third-color), 0.2);
}

.send-btn:disabled {
    opacity: 0.3;
    cursor: default;
}

.stop-btn {
    background: rgba(239, 68, 68, 0.15);
    color: rgb(239, 68, 68);
}

.stop-btn:hover {
    background: rgba(239, 68, 68, 0.25);
}

.input-footer {
    display: flex;
    align-items: center;
    margin-top: 6px;
    padding: 0 2px;
}

.model-selector {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: rgba(var(--text-color), 0.4);
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s;
}

.model-selector:hover:not(:disabled) {
    background: rgba(var(--third-color), 0.08);
    color: rgba(var(--text-color), 0.65);
}

.model-selector--open {
    background: rgba(var(--third-color), 0.1);
    color: rgba(var(--text-color), 0.75);
}

.model-selector:disabled {
    opacity: 0.35;
    cursor: default;
}

.model-selector__label {
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.model-selector__chevron {
    transition: transform 0.15s;
}

.model-selector__chevron--open {
    transform: rotate(180deg);
}
</style>
