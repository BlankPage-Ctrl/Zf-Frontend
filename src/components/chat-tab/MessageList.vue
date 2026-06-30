<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { UIMessage } from 'ai'
import MessageBubble from './MessageBubble.vue'

const props = defineProps<{
    messages: UIMessage[]
    loading?: boolean
}>()

const listRef = ref<HTMLElement | null>(null)
const autoScroll = ref(true)

function scrollToBottom() {
    if (listRef.value && autoScroll.value) {
        nextTick(() => {
            if (listRef.value) {
                listRef.value.scrollTop = listRef.value.scrollHeight
            }
        })
    }
}

function onScroll() {
    if (!listRef.value) return
    const el = listRef.value
    const threshold = 60
    autoScroll.value = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
}

watch(() => props.messages.length, scrollToBottom)
watch(
    () => props.messages,
    () => scrollToBottom(),
    { deep: true },
)
</script>

<template>
    <div ref="listRef" class="message-list" @scroll="onScroll">
        <div v-if="messages.length === 0" class="message-list-empty">
            <div class="empty-icon">
                <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    opacity="0.3"
                >
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
            </div>
            <span class="empty-label">Start a conversation</span>
            <span class="empty-hint">Ask a question or describe a task</span>
        </div>
        <MessageBubble v-for="msg in messages" :key="msg.id" :message="msg" />
        <div v-if="loading" class="message-list-loading">
            <div class="loading-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.message-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
}

.message-list-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 8px;
    color: rgb(var(--text-color));
    opacity: 0.5;
}

.empty-label {
    font-size: 14px;
    font-weight: 500;
}

.empty-hint {
    font-size: 12px;
    opacity: 0.6;
}

.message-list-loading {
    display: flex;
    justify-content: center;
    padding: 16px;
}

.loading-dots {
    display: flex;
    gap: 4px;
}

.dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(var(--text-color), 0.3);
    animation: dotPulse 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) {
    animation-delay: -0.32s;
}
.dot:nth-child(2) {
    animation-delay: -0.16s;
}
.dot:nth-child(3) {
    animation-delay: 0s;
}

@keyframes dotPulse {
    0%,
    80%,
    100% {
        opacity: 0.2;
        transform: scale(0.8);
    }
    40% {
        opacity: 1;
        transform: scale(1);
    }
}
</style>
