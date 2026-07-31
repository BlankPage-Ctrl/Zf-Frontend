<script setup lang="ts">
import type { MessagePartSchema } from '../types/schema.ts'
import MessagePartSlot from './parts/MessagePartSlot.vue'

defineProps<{
    parts: MessagePartSchema[]
    contentWidth?: number
    role?: 'user' | 'assistant'
    roleLabel?: string
    avatarLabel?: string
}>()
</script>

<template>
    <div
        class="message-bubble"
        :class="[`role-${role ?? 'assistant'}`]"
        :style="contentWidth ? { maxWidth: contentWidth + 'px' } : undefined"
    >
        <div class="bubble-avatar">
            <span v-if="role === 'user'" class="avatar-user">{{ avatarLabel ?? 'U' }}</span>
            <span v-else class="avatar-ai">{{ avatarLabel ?? 'AI' }}</span>
        </div>
        <div class="bubble-content">
            <div
                class="bubble-role-label"
                v-text="roleLabel ?? (role === 'user' ? 'You' : 'Assistant')"
            ></div>
            <template v-for="(part, idx) in parts" :key="idx">
                <MessagePartSlot :part="part" />
            </template>
        </div>
    </div>
</template>
