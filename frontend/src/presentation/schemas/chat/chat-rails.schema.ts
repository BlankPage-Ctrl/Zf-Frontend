import { ChatBubbleEmpty, Folder } from '@iconoir/vue'
import type { IconRailsSchema } from '@/presentation/components/icon-rails'

export interface ChatRailsParams {
    showFiles: boolean
    onChat: () => void
    onFiles: () => void
}

export function createChatRailsSchema(params: ChatRailsParams): IconRailsSchema {
    return {
        items: [
            {
                id: 'chat',
                icon: ChatBubbleEmpty,
                ariaLabel: 'Chat',
                tooltip: 'Chat',
                active: !params.showFiles,
                onClick: params.onChat,
            },
            {
                id: 'files',
                icon: Folder,
                ariaLabel: 'File Explorer',
                tooltip: 'File Explorer',
                active: params.showFiles,
                onClick: params.onFiles,
            },
        ],
    }
}
