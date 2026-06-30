import { ref } from 'vue'
import type { Chat } from '@/services/chat'
import type { ChatTabState } from '@/components/chat-tab/types'

export function useChatTabs() {
  const openTabs = ref<Map<string, ChatTabState>>(new Map())
  const activeChatId = ref<string | null>(null)

  function openTab(chat: Chat) {
    if (!openTabs.value.has(chat.id)) {
      openTabs.value.set(chat.id, { chatId: chat.id, title: chat.title })
    }
    activeChatId.value = chat.id
  }

  function closeTab(chatId: string) {
    openTabs.value.delete(chatId)
    if (activeChatId.value === chatId) {
      const remaining = Array.from(openTabs.value.keys())
      activeChatId.value = remaining.length > 0 ? (remaining[remaining.length - 1] as string) : null
    }
  }

  function focusTab(chatId: string) {
    if (openTabs.value.has(chatId)) {
      activeChatId.value = chatId
    }
  }

  function isOpen(chatId: string): boolean {
    return openTabs.value.has(chatId)
  }

  function syncTitle(chatId: string, title: string) {
    const tab = openTabs.value.get(chatId)
    if (tab) {
      tab.title = title
    }
  }

  return {
    openTabs,
    activeChatId,
    openTab,
    closeTab,
    focusTab,
    isOpen,
    syncTitle,
  }
}
