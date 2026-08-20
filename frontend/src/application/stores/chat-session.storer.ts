import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { UIMessage } from 'ai'
import type { ChatSessionStatus } from '@/core/entities'

export interface ChatSessionState {
    messages: UIMessage[]
    status: ChatSessionStatus
    error: Error | undefined
    isLoading: boolean
}

export function createEmptyChatSessionState(): ChatSessionState {
    return {
        messages: [],
        status: 'ready',
        error: undefined,
        isLoading: false,
    }
}

export const useChatSessionStorer = defineStore('chat-session', () => {
    const sessions = ref<Record<string, ChatSessionState>>({})

    function upsertSession(chatId: string, state: ChatSessionState): void {
        sessions.value[chatId] = state
    }

    function patchSession(chatId: string, patch: Partial<ChatSessionState>): void {
        const current = sessions.value[chatId]
        if (!current) return
        sessions.value[chatId] = { ...current, ...patch }
    }

    function removeSession(chatId: string): void {
        delete sessions.value[chatId]
    }

    function clearSessions(): void {
        sessions.value = {}
    }

    return {
        sessions,
        upsertSession,
        patchSession,
        removeSession,
        clearSessions,
    }
})

export type ChatSessionStorer = ReturnType<typeof useChatSessionStorer>
