import { request } from './client.js';
import type { UIMessage } from 'ai';

export const messagesApi = {
  loadHistory: (workspaceId: string, chatId: string) =>
    request<UIMessage[]>(`/workspaces/${workspaceId}/chats/${chatId}/messages`),
};
