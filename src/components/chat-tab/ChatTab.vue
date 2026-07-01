<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import type { Chat } from '@/services/chat'
import { useChatSession } from '@/composables/useChatSession'
import { useChatStore } from '@/stores/chat'
import MessageList from './MessageList.vue'
import ChatInput from './ChatInput.vue'

const props = defineProps<{
    chat: Chat
}>()

const route = useRoute()
const chatStore = useChatStore()
const workspaceId = computed(() => route.params.id as string)

const { messages, isLoading, loadHistory, sendMessage, stop, cleanup } = useChatSession(
    workspaceId.value,
    props.chat.id,
)

onMounted(() => {
    loadHistory()
})

onUnmounted(() => {
    cleanup()
})

async function onModelChange(modelId: string, providerId: string) {
    try {
        await chatStore.updateChat(workspaceId.value, props.chat.id, {
            modelId,
            providerId,
        })
    } catch {
        // silently fail — store handles error state
    }
}
</script>

<template>
    <div class="chat-tab-content">
        <div class="chat-tab-header">
            <h2 class="chat-tab-title">{{ chat.title }}</h2>
        </div>
        <MessageList :messages="messages" :loading="isLoading" />
        <ChatInput
            :loading="isLoading"
            :model-id="chat.modelId"
            :provider-id="chat.providerId"
            @send="sendMessage"
            @stop="stop"
            @select-model="onModelChange"
        />
    </div>
</template>

<style scoped>
.chat-tab-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.chat-tab-header {
    flex-shrink: 0;
    padding: 12px 20px 8px;
    border-bottom: 1px solid rgba(var(--third-color), 0.12);
}

.chat-tab-title {
    font-family: var(--font-serif);
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: rgb(var(--text-color));
    margin: 0;
}
</style>
