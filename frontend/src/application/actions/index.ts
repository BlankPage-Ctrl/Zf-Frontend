import {
    useWorkspaceStorer,
    useChatStorer,
    useProviderStorer,
    useThemeStorer,
    useAppearanceStorer,
    useFileExplorerStorer,
} from '../stores'

import {
    workspacesRepository,
    chatsRepository,
    providersRepository,
    modelsRepository,
    settingsRepository,
    messagesRepository,
    filesRepository,
} from '@/data/services'
import { chatStream, fileWatch } from '@/data/stream'

import { createWorkspaceLogic } from '../store-logic/workspace.logic'
import { createChatLogic } from '../store-logic/chat.logic'
import { createProviderLogic } from '../store-logic/provider.logic'
import { createThemeLogic } from '../store-logic/theme.logic'
import { createAppearanceLogic } from '../store-logic/appearance.logic'
import { createFileExplorerLogic } from '../store-logic/file-explorer.logic'

import { createWorkspaceActions } from './workspace.actions'
import { createChatActions } from './chat.actions'
import { createProviderActions } from './provider.actions'
import { createThemeActions } from './theme.actions'
import { createAppearanceActions } from './appearance.actions'
import { createFileExplorerActions } from './file-explorer.actions'
import { createChatSessionActions } from './chat-session.actions'

export const workspaceActions = createWorkspaceActions(
    createWorkspaceLogic(() => useWorkspaceStorer(), workspacesRepository),
)

export const chatActions = createChatActions(createChatLogic(() => useChatStorer(), chatsRepository))

export const providerActions = createProviderActions(
    createProviderLogic(() => useProviderStorer(), {
        providersRepo: providersRepository,
        modelsRepo: modelsRepository,
        settingsRepo: settingsRepository,
    }),
)

export const themeActions = createThemeActions(
    createThemeLogic(() => useThemeStorer(), settingsRepository),
)

export const appearanceActions = createAppearanceActions(
    createAppearanceLogic(() => useAppearanceStorer(), settingsRepository),
)

export const fileExplorerActions = createFileExplorerActions(
    createFileExplorerLogic(() => useFileExplorerStorer(), {
        fileRepo: filesRepository,
        watch: fileWatch,
    }),
)

export const chatSessionActions = createChatSessionActions({
    messagesRepo: messagesRepository,
    stream: chatStream,
})

export type { WorkspaceActions } from './workspace.actions'
export type { ChatActions } from './chat.actions'
export type { ProviderActions } from './provider.actions'
export type { ThemeActions } from './theme.actions'
export type { AppearanceActions } from './appearance.actions'
export type { FileExplorerActions } from './file-explorer.actions'
export type { ChatSessionActions } from './chat-session.actions'
