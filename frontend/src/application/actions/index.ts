import {
    useWorkspaceStorer,
    useChatStorer,
    useProviderStorer,
    useThemeStorer,
    useAppearanceStorer,
    useFileExplorerStorer,
    useNoteStorer,
    useChatSessionStorer,
    useHitlStorer,
} from '../stores'

import {
    workspacesRepository,
    chatsRepository,
    providersRepository,
    modelsRepository,
    settingsRepository,
    messagesRepository,
    runsRepository,
    filesRepository,
    notesRepository,
    categoriesRepository,
    hitlRepository,
} from '@/data/services'
import { fileWatch, createRunStreamPort, hitlWatch } from '@/data/stream'
import type { RunFetchHooks } from '@/data/stream/run.transport'

import { createWorkspaceStoreLogic } from '../store-logic/workspace.logic'
import { createChatStoreLogic } from '../store-logic/chat.logic'
import { createProviderStoreLogic } from '../store-logic/provider.logic'
import { createThemeStoreLogic } from '../store-logic/theme.logic'
import { createAppearanceStoreLogic } from '../store-logic/appearance.logic'
import { createFileExplorerStoreLogic } from '../store-logic/file-explorer.logic'
import { createNoteStoreLogic } from '../store-logic/note.logic'
import { createChatSessionStoreLogic } from '../store-logic/chat-session.logic'
import { createHitlStoreLogic } from '../store-logic/hitl.logic'

import { createWorkspaceBusinessLogic } from '../business-logic/workspace.logic'
import { createChatBusinessLogic } from '../business-logic/chat.logic'
import { createProviderBusinessLogic } from '../business-logic/provider.logic'
import { createThemeBusinessLogic } from '../business-logic/theme.logic'
import { createAppearanceBusinessLogic } from '../business-logic/appearance.logic'
import { createFileExplorerBusinessLogic } from '../business-logic/file-explorer.logic'
import { createNoteBusinessLogic } from '../business-logic/note.logic'
import { createChatSessionEngine } from '../business-logic/chat-session.logic'
import { createHitlBusinessLogic } from '../business-logic/hitl.logic'

import { createWorkspaceActions } from './workspace.actions'
import { createChatActions } from './chat.actions'
import { createProviderActions } from './provider.actions'
import { createThemeActions } from './theme.actions'
import { createAppearanceActions } from './appearance.actions'
import { createFileExplorerActions } from './file-explorer.actions'
import { createChatSessionActions } from './chat-session.actions'
import { createNoteActions } from './note.actions'
import { createHitlActions } from './hitl.actions'

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

const chatSessionStoreLogic = createChatSessionStoreLogic(() => useChatSessionStorer())
// The run transport needs engine hooks, but the engine needs the transport,
// both are only used lazily (per chat, after wiring), so forward via ref.
const runHooksRef: { current?: RunFetchHooks } = {}
const forwardHooks: RunFetchHooks = {
    onRunStarted: (chatId, runId) => runHooksRef.current?.onRunStarted(chatId, runId),
    onSeq: (chatId, seq) => runHooksRef.current?.onSeq(chatId, seq),
    getResumeTarget: (chatId) => runHooksRef.current?.getResumeTarget(chatId),
    clearResumeTarget: (chatId) => runHooksRef.current?.clearResumeTarget(chatId),
}
const runStreamPort = createRunStreamPort({ runs: runsRepository, hooks: forwardHooks })
const chatSessionBundle = createChatSessionEngine({
    messagesRepo: messagesRepository,
    runsRepo: runsRepository,
    stream: runStreamPort,
    onState: (chatId, patch) => chatSessionStoreLogic.patch(chatId, patch),
})
runHooksRef.current = chatSessionBundle.runHooks
const chatSessionEngine = chatSessionBundle.engine

export const chatSessionActions = createChatSessionActions(chatSessionStoreLogic, chatSessionEngine)

const noteStoreLogic = createNoteStoreLogic(() => useNoteStorer())
const noteBusinessLogic = createNoteBusinessLogic({
    notes: notesRepository,
    categories: categoriesRepository,
})

export const noteActions = createNoteActions(noteStoreLogic, noteBusinessLogic)

const hitlStoreLogic = createHitlStoreLogic(() => useHitlStorer())
const hitlBusinessLogic = createHitlBusinessLogic({ repo: hitlRepository, watch: hitlWatch })

export const hitlActions = createHitlActions(hitlStoreLogic, hitlBusinessLogic)

export type { WorkspaceActions } from './workspace.actions'
export type { ChatActions } from './chat.actions'
export type { ProviderActions } from './provider.actions'
export type { ThemeActions } from './theme.actions'
export type { AppearanceActions } from './appearance.actions'
export type { FileExplorerActions } from './file-explorer.actions'
export type { ChatSessionActions } from './chat-session.actions'
export type { NoteActions } from './note.actions'
export type { HitlActions } from './hitl.actions'
