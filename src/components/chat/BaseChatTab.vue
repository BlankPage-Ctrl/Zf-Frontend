<script setup lang="ts">
import type { ResolvedChatTab } from './types/resolved'
import BaseMessageList from './components/MessageList.vue'
import BaseChatInput from './components/ChatInput.vue'

defineProps<{
    resolved: ResolvedChatTab
}>()
</script>

<template>
    <div class="chat-tab-content">
        <div class="chat-tab-header">
            <h2 class="chat-tab-title">{{ resolved.header.title }}</h2>
        </div>
        <BaseMessageList :resolved="resolved.messageList" />
        <BaseChatInput :resolved="resolved.input" />
    </div>
</template>

<style src="./styles/index.css"></style>
