import { ref } from 'vue'
import { defineStore } from 'pinia'
import { chatsApi, type Chat, type ChatDto } from '@/services/chat'

function toMessage(e: unknown): string {
    return e instanceof Error ? e.message : 'An error occurred'
}

export const useChatStore = defineStore('chat', () => {
    const chats = ref<Chat[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    function clearError() {
        error.value = null
    }

    async function fetchChats(workspaceId: string) {
        loading.value = true
        error.value = null
        try {
            chats.value = await chatsApi.list(workspaceId)
        } catch (e: unknown) {
            error.value = toMessage(e) || 'Failed to load chats'
        } finally {
            loading.value = false
        }
    }

    async function createChat(workspaceId: string, dto: ChatDto) {
        error.value = null
        try {
            const chat = await chatsApi.create(workspaceId, dto)
            chats.value.push(chat)
        } catch (e: unknown) {
            error.value = toMessage(e) || 'Failed to create chat'
            throw e
        }
    }

    async function updateChat(workspaceId: string, chatId: string, dto: Partial<ChatDto>) {
        error.value = null
        try {
            const updated = await chatsApi.update(workspaceId, chatId, dto)
            const idx = chats.value.findIndex((c) => c.id === chatId)
            if (idx !== -1) {
                chats.value[idx] = { ...chats.value[idx], ...updated }
            }
        } catch (e: unknown) {
            error.value = toMessage(e) || 'Failed to update chat'
            throw e
        }
    }

    async function deleteChat(workspaceId: string, chatId: string) {
        error.value = null
        try {
            await chatsApi.remove(workspaceId, chatId)
            chats.value = chats.value.filter((c) => c.id !== chatId)
        } catch (e: unknown) {
            error.value = toMessage(e) || 'Failed to delete chat'
            throw e
        }
    }

    return {
        chats,
        loading,
        error,
        clearError,
        fetchChats,
        createChat,
        updateChat,
        deleteChat,
    }
})
