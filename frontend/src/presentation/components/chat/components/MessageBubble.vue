<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { Check, Copy, EditPencil } from '@iconoir/vue'
import type { MessagePartSchema } from '../types/schema.ts'
import MessagePartSlot from './parts/MessagePartSlot.vue'

const props = defineProps<{
    parts: MessagePartSchema[]
    contentWidth?: number
    role?: 'user' | 'assistant'
    roleLabel?: string
    avatarLabel?: string
    messageId?: string
    onEditMessage?: (messageId: string) => void
    copyText?: string
    canCopy?: boolean
}>()

const canEdit = computed(
    () => props.role === 'user' && !!props.messageId && !!props.onEditMessage,
)

const showActions = computed(() => canEdit.value || props.canCopy === true)

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

onUnmounted(() => {
    if (copiedTimer !== undefined) clearTimeout(copiedTimer)
})

function handleEdit() {
    if (props.messageId && props.onEditMessage) props.onEditMessage(props.messageId)
}

async function copyFallback(text: string): Promise<void> {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    document.execCommand('copy')
    document.body.removeChild(area)
}

async function handleCopy() {
    const text = props.copyText ?? ''
    if (!text) return
    try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text)
        else await copyFallback(text)
    } catch {
        try {
            await copyFallback(text)
        } catch {
            return
        }
    }
    copied.value = true
    if (copiedTimer !== undefined) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
        copied.value = false
        copiedTimer = undefined
    }, 1500)
}

function partKey(part: MessagePartSchema, idx: number): string {
    const id = part.type === 'tool-call' ? part.toolCallId : ''
    return `${part.type}:${id}:${idx}`
}
</script>

<template>
    <div class="message-bubble" :class="[`role-${role ?? 'assistant'}`]">
        <div class="bubble-content">
            <div
                class="bubble-role-label"
                v-text="roleLabel ?? (role === 'user' ? 'You' : '')"
            ></div>
            <template v-for="(part, idx) in parts" :key="partKey(part, idx)">
                <MessagePartSlot :part="part" />
            </template>
        </div>
        <div v-if="showActions" class="bubble-actions">
            <button
                v-if="canCopy"
                class="bubble-action-btn"
                :class="{ 'is-copied': copied }"
                type="button"
                :title="copied ? 'Copied!' : 'Copy message'"
                :aria-label="copied ? 'Copied!' : 'Copy message'"
                @click="handleCopy"
            >
                <Check v-if="copied" width="14" height="14" />
                <Copy v-else width="14" height="14" />
            </button>
            <button
                v-if="canEdit"
                class="bubble-action-btn"
                type="button"
                title="Edit and resend from here"
                aria-label="Edit and resend from here"
                @click="handleEdit"
            >
                <EditPencil width="14" height="14" />
            </button>
        </div>
    </div>
</template>
