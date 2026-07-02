<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { ChatBubbleEmpty } from '@iconoir/vue'
import type { ResolvedMessageList } from '../types/resolved'
import BaseMessageBubble from './MessageBubble.vue'

defineProps<{
    resolved: ResolvedMessageList
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

watch(() => listRef.value, scrollToBottom)
</script>

<template>
    <div ref="listRef" class="message-list" @scroll="onScroll">
        <div v-if="resolved.messages.length === 0" class="message-list-empty">
            <div class="empty-icon">
                <ChatBubbleEmpty width="32" height="32" style="opacity: 0.3" />
            </div>
            <span class="empty-label">{{ resolved.emptyMessage }}</span>
            <span class="empty-hint">{{ resolved.emptyHint }}</span>
        </div>
        <BaseMessageBubble
            v-for="(msg, idx) in resolved.messages"
            :key="idx"
            :parts="msg.parts"
            :role="msg.role"
            :content-width="resolved.contentWidth"
        />
        <div v-if="resolved.loading" class="message-list-loading">
            <div class="loading-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
        </div>
    </div>
</template>
