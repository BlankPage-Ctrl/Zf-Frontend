<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, h } from 'vue';
import { useRoute } from 'vue-router';
import { Icon } from '@iconify/vue';
import DialogGrid from '@/components/dialog/GridDialog.vue';
import type { DialogGridSchema, DynamicGridDataOutput } from '@/components/dialog/types';
import { DynamicList } from '@/components/list';
import type { ListSchema } from '@/components/list';
import { useWorkspaceStore } from '@/stores/workspace';
import { useChatStore } from '@/stores/chat';
import type { Chat, ChatDto } from '@/services/chat';
import { SplitLayout, CodeLayoutSplitNRootGrid } from 'vue-code-layout';
import type { CodeLayoutSplitNPanelInternal } from 'vue-code-layout';
import ChatTab from '@/components/chat-tab/ChatTab.vue';
import { useChatTabs } from '@/composables/useChatTabs';
import AppSidebar from '@/components/sidebar/Sidebar.vue';
import { useSidebarKeyboard } from '@/composables/useSidebarKeyboard';
import { FileExplorer } from '@/components/file-explorer';
import type { FEListDirData, FEMeta } from '@/components/file-explorer';
import { filesApi } from '@/services/files';

const route = useRoute();
const wsStore = useWorkspaceStore();
const chatStore = useChatStore();

const workspaceId = computed(() => route.params.id as string);
const workspace = computed(() =>
  wsStore.workspaces.find((w) => w.id === workspaceId.value) ?? null,
);

const splitLayoutRef = ref<typeof SplitLayout | null>(null)
const splitLayoutData = ref(new CodeLayoutSplitNRootGrid())

const sidebarCollapsed = ref(false)
const sidebarWidth = ref(240)
const showFileExplorer = ref(false)

const fileExplorerRef = ref<InstanceType<typeof FileExplorer> | null>(null)
const fileExplorerInitialData = ref<FEListDirData>({ requestedPath: '.', nodes: [] })
const fileExplorerMeta = computed<FEMeta | undefined>(() => {
  if (!workspace.value) return undefined
  return { workspaceRoot: workspace.value.projectPath }
})
const watchCleanup = ref<(() => void) | null>(null)

useSidebarKeyboard(() => {
  sidebarCollapsed.value = !sidebarCollapsed.value
})

function showPanel(view: 'chat' | 'files') {
  showFileExplorer.value = view === 'files'
  sidebarCollapsed.value = false
}

const {
  activeChatId,
  openTab,
  closeTab,
  focusTab,
  syncTitle,
} = useChatTabs()

const EditIcon = () => h(Icon, { icon: 'lucide:pencil' })
const TrashIcon = () => h(Icon, { icon: 'lucide:trash-2' })

function chatIcon() {
  return h('span', {
    style: {
      width: '16px',
      height: '16px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      lineHeight: '1',
      color: 'rgb(var(--text-color))',
      opacity: '0.5',
    }
  }, '💬')
}

function openChatTab(chat: Chat) {
  const panelName = `chat-${chat.id}`
  const existing = splitLayoutData.value.getPanelByName(panelName)
  if (existing) {
    splitLayoutRef.value?.activePanel(panelName)
    focusTab(chat.id)
    return
  }
  openTab(chat)
  splitLayoutData.value.addPanel({
    name: panelName,
    title: chat.title,
    tooltip: chat.title,
    closeType: 'close',
    iconSmall: () => chatIcon(),
  })
  splitLayoutRef.value?.activePanel(panelName)
}

function getChatById(chatId: string): Chat | undefined {
  return chatStore.chats.find((c) => c.id === chatId)
}

function onPanelClose(panel: CodeLayoutSplitNPanelInternal, resolve: () => void) {
  const chatId = panel.name.replace('chat-', '')
  closeTab(chatId)
  resolve()
}

function onPanelActive(panel: CodeLayoutSplitNPanelInternal | null) {
  if (!panel) return
  const chatId = panel.name.replace('chat-', '')
  focusTab(chatId)
}

const chatFormSchema: DialogGridSchema = {
  chat: {
    columns: {
      title: { type: 'text-short', label: 'Title', placeholder: 'Chat title', metadata: { require: true } },
    },
  },
};

const showChatCreate = ref(false);
const chatCreateLoading = ref(false);

function openChatCreate() {
  showChatCreate.value = true;
}

function cancelChatCreate() {
  showChatCreate.value = false;
}

async function submitChatCreate(data: DynamicGridDataOutput) {
  const d = data.chat!;
  const payload: ChatDto = { title: String(d.title ?? '') };
  chatCreateLoading.value = true;
  try {
    await chatStore.createChat(workspaceId.value, payload);
    showChatCreate.value = false;
  } catch { /* handled by store */ }
  finally { chatCreateLoading.value = false; }
}

const editChatFormSchema: DialogGridSchema = {
  chat: {
    columns: {
      title: { type: 'text-short', label: 'Title', placeholder: 'Chat title', metadata: { require: true } },
    },
  },
};

const chatListSchema = computed<ListSchema<Chat>>(() => ({
  variant: 'sidebar',
  size: 'sm',
  activeKey: 'id',
  activeId: activeChatId.value,
  fields: [
    { key: 'title', class: 'title' },
    // { key: 'createdAt', class: 'date', format: fmtDate },
  ],
  actions: [
    { icon: EditIcon, ariaLabel: 'Edit', variant: 'ghost', size: 'xs', onClick: openChatEdit },
    { icon: TrashIcon, ariaLabel: 'Delete', variant: 'danger', size: 'xs', onClick: confirmDeleteChat },
  ],
  emptyMessage: 'No chats yet',
  emptyAction: { label: 'Create your first chat', onClick: openChatCreate },
  onSelect: (chat) => openChatTab(chat),
}));

const showChatEdit = ref(false);
const editingChat = ref<Chat | null>(null);
const chatEditLoading = ref(false);

const editChatInitialData = computed<DynamicGridDataOutput | undefined>(() => {
  if (!editingChat.value) return undefined;
  return { chat: { title: editingChat.value.title } };
});

function openChatEdit(chat: Chat) {
  editingChat.value = chat;
  showChatEdit.value = true;
}

function cancelChatEdit() {
  showChatEdit.value = false;
  editingChat.value = null;
}

async function submitChatEdit(data: DynamicGridDataOutput) {
  if (!editingChat.value) return;
  const d = data.chat!;
  const payload: Partial<ChatDto> = { title: String(d.title ?? '') };
  chatEditLoading.value = true;
  try {
    await chatStore.updateChat(workspaceId.value, editingChat.value.id, payload);
    const newTitle = editingChat.value.title
    syncTitle(editingChat.value.id, newTitle)
    const panel = splitLayoutData.value.getPanelByName(`chat-${editingChat.value.id}`)
    if (panel) {
      panel.title = newTitle
    }
    showChatEdit.value = false;
    editingChat.value = null;
  } catch { /* handled by store */ }
  finally { chatEditLoading.value = false; }
}

const showChatDelete = ref(false);
const deletingChat = ref<Chat | null>(null);

function confirmDeleteChat(chat: Chat) {
  deletingChat.value = chat;
  showChatDelete.value = true;
}

function cancelChatDelete() {
  showChatDelete.value = false;
  deletingChat.value = null;
}

async function executeChatDelete() {
  if (!deletingChat.value) return;
  await chatStore.deleteChat(workspaceId.value, deletingChat.value.id);
  showChatDelete.value = false;
  deletingChat.value = null;
}

async function onRequestChildren(path: string) {
  try {
    const data = await filesApi.listDir(workspaceId.value, path)
    fileExplorerRef.value?.loadChildren(data)
  } catch (e) {
    console.error('[FileExplorer] failed to list dir:', path, e)
  }
}

function onFileSelect(path: string | null) {
  console.log('[FileExplorer] selected:', path)
}

async function setupFileExplorer() {
  if (!workspaceId.value) return
  try {
    const data = await filesApi.listDir(workspaceId.value, '.')
    fileExplorerInitialData.value = data
  } catch (e) {
    console.error('[FileExplorer] failed to load root:', e)
  }
}

function setupWatchEvents() {
  watchCleanup.value = filesApi.createWatchConnection(
    workspaceId.value,
    (event) => {
      fileExplorerRef.value?.applyWatchEvent(event)
    },
    () => {
      console.error('[FileExplorer] watch connection error')
    },
  )
}

onMounted(async () => {
  if (workspaceId.value) {
    wsStore.selectWorkspace(workspaceId.value);
    chatStore.fetchChats(workspaceId.value);
    await setupFileExplorer();
    setupWatchEvents();
  }
});

onUnmounted(() => {
  watchCleanup.value?.()
})
</script>

<template>
  <div class="ws-layout" v-if="workspace">
    <AppSidebar
      v-model:collapsed="sidebarCollapsed"
      v-model:width="sidebarWidth"
    >
      <template #iconRail>
        <button
          class="ws-sidebar__rail-icon"
          :class="{ 'ws-sidebar__rail-icon--active': !showFileExplorer }"
          title="Chat"
          @click="showPanel('chat')"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        </button>
        <button
          class="ws-sidebar__rail-icon"
          :class="{ 'ws-sidebar__rail-icon--active': showFileExplorer }"
          title="File Explorer"
          @click="showPanel('files')"
        >
          <Icon icon="lucide:folder-tree" class="w-5 h-5" />
        </button>
      </template>

      <template #header>
        <template v-if="!showFileExplorer">
          <h2 class="ws-sidebar__title">{{ workspace.name }}</h2>
          <button class="ws-btn-icon" @click="openChatCreate" title="New chat">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <line x1="8" y1="3" x2="8" y2="13"/>
              <line x1="3" y1="8" x2="13" y2="8"/>
            </svg>
          </button>
        </template>
      </template>

      <template v-if="!showFileExplorer">
        <DynamicList
          :schema="chatListSchema"
          :items="chatStore.chats"
        />
      </template>

      <FileExplorer
        v-else
        ref="fileExplorerRef"
        :initial-data="fileExplorerInitialData"
        :meta="fileExplorerMeta"
        @request-children="onRequestChildren"
        @select="onFileSelect"
      />
    </AppSidebar>

    <!-- CONTENT -->
    <div class="ws-content">
      <SplitLayout
        ref="splitLayoutRef"
        :layoutData="(splitLayoutData as CodeLayoutSplitNRootGrid)"
        @panelClose="onPanelClose"
        @panelActive="onPanelActive"
        @update:layoutData="(v: any) => splitLayoutData = v"
      >
        <template #tabContentRender="{ panel }">
          <ChatTab
            v-if="getChatById(panel.name.replace('chat-', ''))"
            :key="panel.name"
            :chat="getChatById(panel.name.replace('chat-', ''))!"
          />
        </template>
        <template #tabEmptyContentRender>
          <div class="ws-content__empty">
            <div class="ws-empty__icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.3">
                <path d="M42 30a4 4 0 01-4 4H14l-8 8V10a4 4 0 014-4h24a4 4 0 014 4z"/>
              </svg>
            </div>
            <h2 class="ws-empty__title">Select a chat</h2>
            <p class="ws-empty__desc">Choose a chat from the sidebar or create a new one to get started.</p>
          </div>
        </template>
      </SplitLayout>
    </div>
  </div>

  <div v-else class="ws-layout ws-layout--not-found">
    <span class="text-muted">Workspace not found</span>
  </div>

  <!-- Chat Create Dialog -->
  <DialogGrid
    v-model="showChatCreate"
    :schema="chatFormSchema"
    title="New chat"
    confirm-label="Create"
    :loading="chatCreateLoading"
    @submit="submitChatCreate"
    @cancel="cancelChatCreate"
  />

  <!-- Chat Edit Dialog -->
  <DialogGrid
    v-model="showChatEdit"
    :schema="editChatFormSchema"
    title="Edit chat"
    confirm-label="Save"
    :initial-data="editChatInitialData"
    :loading="chatEditLoading"
    @submit="submitChatEdit"
    @cancel="cancelChatEdit"
  />

  <!-- Chat Delete Dialog -->
  <DialogGrid
    v-model="showChatDelete"
    title="Delete chat"
    confirm-label="Delete"
    confirm-variant="danger"
    @submit="executeChatDelete"
    @cancel="cancelChatDelete"
  >
    <span class="confirm-message">Delete "{{ deletingChat?.title }}"?</span>
  </DialogGrid>
</template>

<style>
@import url('@/assets/workspace.css');
</style>
