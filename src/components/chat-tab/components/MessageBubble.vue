<script setup lang="ts">
import type { MessagePartSchema } from '../types/schema'
import TextPart from './parts/TextPart.vue'
import ReasoningPart from './parts/ReasoningPart.vue'
import ToolCallPart from './parts/ToolCallPart.vue'
import SourcePart from './parts/SourcePart.vue'
import FilePart from './parts/FilePart.vue'
import DataPart from './parts/DataPart.vue'
import StepIndicator from './parts/StepIndicator.vue'

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
            <div class="bubble-role-label" v-text="roleLabel ?? (role === 'user' ? 'You' : 'Assistant')"></div>
            <template v-for="(part, idx) in parts" :key="idx">
                <TextPart v-if="part.type === 'text'" :schema="part" />
                <ReasoningPart v-else-if="part.type === 'reasoning'" :schema="part" />
                <ToolCallPart v-else-if="part.type === 'tool-call'" :schema="part" />
                <SourcePart v-else-if="part.type === 'source'" :schema="part" />
                <FilePart v-else-if="part.type === 'file'" :schema="part" />
                <DataPart v-else-if="part.type === 'data'" :schema="part" />
                <StepIndicator v-else-if="part.type === 'step-start'" :schema="part" />
            </template>
        </div>
    </div>
</template>
