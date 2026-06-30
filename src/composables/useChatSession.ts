import { ref, type Ref } from 'vue';
import { Chat } from '@ai-sdk/vue';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import { messagesApi } from '@/services/messages';

export function useChatSession(workspaceId: string, chatId: string) {
  const messages = ref<UIMessage[]>([]) as Ref<UIMessage[]>;
  const status = ref<'submitted' | 'streaming' | 'ready' | 'error'>('ready');
  const error = ref<Error | undefined>();
  const isLoading = ref(false);

  let chat: Chat<UIMessage> | null = null;
  let statusInterval: ReturnType<typeof setInterval> | null = null;

  async function loadHistory() {
    try {
      const history = await messagesApi.loadHistory(workspaceId, chatId);
      messages.value = history;
      initChat(history);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e : new Error('Failed to load messages');
    }
  }

  function initChat(initialMessages: UIMessage[]) {
    const transport = new DefaultChatTransport({
      api: `/workspaces/${workspaceId}/chats/${chatId}/messages`,
      prepareSendMessagesRequest: ({ messages: msgs }) => {
        const last = msgs[msgs.length - 1];
        return {
          body: { message: last },
        };
      },
    });

    chat = new Chat({
      id: chatId,
      messages: initialMessages,
      transport,
      onFinish: () => {
        status.value = 'ready';
        isLoading.value = false;
      },
      onError: (e: Error) => {
        error.value = e;
        status.value = 'error';
        isLoading.value = false;
      },
    });

    statusInterval = setInterval(() => {
      if (chat) {
        status.value = chat.status;
        messages.value = [...chat.messages];
        isLoading.value = chat.status === 'submitted' || chat.status === 'streaming';
      }
    }, 100);
  }

  async function sendMessage(text: string) {
    if (!chat || !text.trim()) return;
    error.value = undefined;
    isLoading.value = true;
    try {
      await chat.sendMessage({ text });
    } catch (e: unknown) {
      error.value = e instanceof Error ? e : new Error('Failed to send message');
      isLoading.value = false;
    }
  }

  async function stop() {
    if (chat) {
      await chat.stop();
      isLoading.value = false;
      status.value = 'ready';
    }
  }

  async function regenerate() {
    if (!chat) return;
    error.value = undefined;
    isLoading.value = true;
    try {
      await chat.regenerate();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e : new Error('Failed to regenerate');
      isLoading.value = false;
    }
  }

  function cleanup() {
    if (statusInterval) clearInterval(statusInterval);
    chat = null;
  }

  return {
    messages,
    status,
    error,
    isLoading,
    loadHistory,
    sendMessage,
    stop,
    regenerate,
    cleanup,
  };
}
