import { workspaceHandlers } from './workspaces'
import { chatHandlers } from './chats'
import { messageHandlers } from './messages'
import { providerHandlers } from './providers'
import { settingsHandlers } from './settings'
import { fileHandlers } from './files'

export const handlers = [
    ...workspaceHandlers,
    ...chatHandlers,
    ...messageHandlers,
    ...providerHandlers,
    ...settingsHandlers,
    ...fileHandlers,
]
