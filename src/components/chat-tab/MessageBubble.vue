<script setup lang="ts">
import type { UIMessage } from 'ai'
import { isTextUIPart, isReasoningUIPart, isToolUIPart, isFileUIPart, isDataUIPart } from 'ai'
import TextPart from './parts/TextPart.vue'
import ReasoningPart from './parts/ReasoningPart.vue'
import ToolCallPart from './parts/ToolCallPart.vue'
import SourcePart from './parts/SourcePart.vue'
import FilePart from './parts/FilePart.vue'
import DataPart from './parts/DataPart.vue'
import StepIndicator from './parts/StepIndicator.vue'
import { useAppearanceStore } from '@/stores/appearance'

defineProps<{
    message: UIMessage
}>()

const appearance = useAppearanceStore()

function isSourcePart(part: unknown): part is {
    type: 'source-url' | 'source-document'
    sourceId: string
    url?: string
    title?: string
    mediaType?: string
} {
    const p = part as Record<string, unknown>
    return p.type === 'source-url' || p.type === 'source-document'
}

function isStepStart(part: unknown): part is { type: 'step-start' } {
    return (part as Record<string, unknown>).type === 'step-start'
}

function getToolToolName(part: unknown): string {
    const p = part as Record<string, unknown>
    if (p.type === 'dynamic-tool' && typeof p.toolName === 'string') {
        return p.toolName
    }
    if (typeof p.type === 'string' && p.type.startsWith('tool-')) {
        return p.type.split('-').slice(1).join('-')
    }
    return String(p.toolCallId ?? 'tool')
}
</script>

<template>
    <div
        class="message-bubble"
        :class="[`role-${message.role}`]"
        :style="{ maxWidth: appearance.contentWidth + 'px' }"
    >
        <div class="bubble-avatar">
            <span v-if="message.role === 'user'" class="avatar-user">U</span>
            <span v-else class="avatar-ai">AI</span>
        </div>
        <div class="bubble-content">
            <div
                class="bubble-role-label"
                v-text="message.role === 'user' ? 'You' : 'Assistant'"
            ></div>
            <template v-for="(part, idx) in message.parts" :key="idx">
                <TextPart
                    v-if="isTextUIPart(part)"
                    :text="part.text"
                    :state="'state' in part ? (part.state as string | undefined) : undefined"
                />
                <ReasoningPart
                    v-else-if="isReasoningUIPart(part)"
                    :text="part.text"
                    :state="'state' in part ? (part.state as string | undefined) : undefined"
                />
                <ToolCallPart
                    v-else-if="isToolUIPart(part)"
                    :tool-name="getToolToolName(part)"
                    :tool-call-id="part.toolCallId"
                    :state="part.state"
                    :input="'input' in part ? part.input : undefined"
                    :output="'output' in part ? part.output : undefined"
                    :error-text="'errorText' in part ? part.errorText : undefined"
                />
                <SourcePart
                    v-else-if="isSourcePart(part)"
                    :source-id="part.sourceId"
                    :url="part.url"
                    :title="part.title"
                    :media-type="'mediaType' in part ? (part as any).mediaType : undefined"
                />
                <FilePart
                    v-else-if="isFileUIPart(part)"
                    :media-type="part.mediaType"
                    :url="part.url"
                    :filename="'filename' in part ? part.filename : undefined"
                />
                <DataPart
                    v-else-if="isDataUIPart(part)"
                    :type="part.type"
                    :data="'data' in part ? part.data : {}"
                />
                <StepIndicator v-else-if="isStepStart(part)" />
            </template>
        </div>
    </div>
</template>

<style scoped>
.message-bubble {
    display: flex;
    gap: 12px;
    padding: 12px 20px;
    margin: 0 auto;
    width: 100%;
}

.message-bubble.role-user {
    flex-direction: row-reverse;
}

.bubble-avatar {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.02em;
}

.role-user .bubble-avatar {
    background: rgba(var(--third-color), 0.15);
    color: rgb(var(--text-color));
}

.role-assistant .bubble-avatar {
    background: rgba(59, 130, 246, 0.15);
    color: rgb(59, 130, 246);
}

.bubble-content {
    flex: 1;
    min-width: 0;
}

.bubble-role-label {
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 4px;
    opacity: 0.5;
}

.role-user .bubble-role-label {
    text-align: right;
}
</style>
