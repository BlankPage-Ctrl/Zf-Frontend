import {
    useWorkspaceStorer,
    useChatStorer,
    useProviderStorer,
    useThemeStorer,
    useAppearanceStorer,
    useFileExplorerStorer,
    useNoteStorer,
} from '../stores'

import {
    workspacesRepository,
    chatsRepository,
    providersRepository,
    modelsRepository,
    settingsRepository,
    messagesRepository,
    filesRepository,
    notesRepository,
    categoriesRepository,
} from '@/data/services'
import { chatStream, fileWatch } from '@/data/stream'

import { createWorkspaceStoreLogic } from '../store-logic/workspace.logic'
import { createChatStoreLogic } from '../store-logic/chat.logic'
import { createProviderStoreLogic } from '../store-logic/provider.logic'
import { createThemeStoreLogic } from '../store-logic/theme.logic'
import { createAppearanceStoreLogic } from '../store-logic/appearance.logic'
import { createFileExplorerStoreLogic } from '../store-logic/file-explorer.logic'
import { createNoteStoreLogic } from '../store-logic/note.logic'

import { createWorkspaceBusinessLogic } from '../business-logic/workspace.logic'
import { createChatBusinessLogic } from '../business-logic/chat.logic'
import { createProviderBusinessLogic } from '../business-logic/provider.logic'
import { createThemeBusinessLogic } from '../business-logic/theme.logic'
import { createAppearanceBusinessLogic } from '../business-logic/appearance.logic'
import { createFileExplorerBusinessLogic } from '../business-logic/file-explorer.logic'
import { createNoteBusinessLogic } from '../business-logic/note.logic'

import { createWorkspaceActions } from './workspace.actions'
import { createChatActions } from './chat.actions'
import { createProviderActions } from './provider.actions'
import { createThemeActions } from './theme.actions'
import { createAppearanceActions } from './appearance.actions'
import { createFileExplorerActions } from './file-explorer.actions'
import { createChatSessionActions } from './chat-session.actions'
import { createNoteActions } from './note.actions'

const workspaceStoreLogic = createWorkspaceStoreLogic(() => useWorkspaceStorer())
const workspaceBusinessLogic = createWorkspaceBusinessLogic(workspacesRepository)

export const workspaceActions = createWorkspaceActions(workspaceStoreLogic, workspaceBusinessLogic)

const chatStoreLogic = createChatStoreLogic(() => useChatStorer())
const chatBusinessLogic = createChatBusinessLogic(chatsRepository)

export const chatActions = createChatActions(chatStoreLogic, chatBusinessLogic)

const providerStoreLogic = createProviderStoreLogic(() => useProviderStorer())
const providerBusinessLogic = createProviderBusinessLogic({
    providersRepo: providersRepository,
    modelsRepo: modelsRepository,
    settingsRepo: settingsRepository,
})

export const providerActions = createProviderActions(providerStoreLogic, providerBusinessLogic)

const themeStoreLogic = createThemeStoreLogic(() => useThemeStorer())
const themeBusinessLogic = createThemeBusinessLogic(settingsRepository)

export const themeActions = createThemeActions(themeStoreLogic, themeBusinessLogic)

const appearanceStoreLogic = createAppearanceStoreLogic(() => useAppearanceStorer())
const appearanceBusinessLogic = createAppearanceBusinessLogic(settingsRepository)

export const appearanceActions = createAppearanceActions(
    appearanceStoreLogic,
    appearanceBusinessLogic,
)

const fileExplorerStoreLogic = createFileExplorerStoreLogic(() => useFileExplorerStorer())
const fileExplorerBusinessLogic = createFileExplorerBusinessLogic({
    fileRepo: filesRepository,
    watch: fileWatch,
})

export const fileExplorerActions = createFileExplorerActions(
    fileExplorerStoreLogic,
    fileExplorerBusinessLogic,
)

export const chatSessionActions = createChatSessionActions({
    messagesRepo: messagesRepository,
    stream: chatStream,
})

const noteStoreLogic = createNoteStoreLogic(() => useNoteStorer())
const noteBusinessLogic = createNoteBusinessLogic({
    notes: notesRepository,
    categories: categoriesRepository,
})

export const noteActions = createNoteActions(noteStoreLogic, noteBusinessLogic)

export type { WorkspaceActions } from './workspace.actions'
export type { ChatActions } from './chat.actions'
export type { ProviderActions } from './provider.actions'
export type { ThemeActions } from './theme.actions'
export type { AppearanceActions } from './appearance.actions'
export type { FileExplorerActions } from './file-explorer.actions'
export type { ChatSessionActions } from './chat-session.actions'
export type { NoteActions } from './note.actions'
