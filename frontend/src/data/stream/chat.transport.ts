import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { StartStream, CancelStream } from '../../../wailsjs/go/stream/ChatStreamService'
import { EventsOn } from '../../../wailsjs/runtime'
import { createChatStreamDispatcher, type ChatStreamDispatcher } from './chat.dispatcher'
import type { ChatStreamPort } from '@/core/repositories'

const GLOBAL_KEY = '__wailsChatStreamDispatcher__'

export function createChatFetch(workspaceId: string, chatId: string) {
    return async (_url: RequestInfo | URL, options?: RequestInit) => {
        const bodyRaw = JSON.parse((options?.body as string) ?? '{}')
        const messages: UIMessage[] = bodyRaw.messages ?? []
        const last = messages[messages.length - 1]
        const messageBody = JSON.stringify({ message: last })

        let sid: string | null = null
        let unsubscribe: (() => void) | null = null

        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                const encoder = new TextEncoder()
                sid = crypto.randomUUID()
                unsubscribe = getGlobalDispatcher().subscribe(sid, {
                    onChunk: (line) => controller.enqueue(encoder.encode(line + '\n')),
                    onDone: () => controller.close(),
                    onError: (err) => controller.error(new Error(err)),
                })
                StartStream(sid, workspaceId, chatId, messageBody).catch((err: Error) => {
                    controller.error(err)
                })
            },
            cancel() {
                unsubscribe?.()
                if (sid) CancelStream(sid)
            },
        })

        return new Response(stream)
    }
}

export function createWailsChatTransport(workspaceId: string, chatId: string) {
    return new DefaultChatTransport({
        api: '',
        fetch: createChatFetch(workspaceId, chatId),
    })
}

function getGlobalDispatcher(): ChatStreamDispatcher {
    const g = globalThis as Record<string, unknown>
    let dispatcher = g[GLOBAL_KEY] as ChatStreamDispatcher | undefined
    if (!dispatcher) {
        dispatcher = createChatStreamDispatcher(EventsOn)
        g[GLOBAL_KEY] = dispatcher
    }
    return dispatcher
}

export function resetChatDispatcherGlobal(): void {
    const g = globalThis as Record<string, unknown>
    const dispatcher = g[GLOBAL_KEY] as ChatStreamDispatcher | undefined
    if (dispatcher) {
        dispatcher.destroy()
        delete g[GLOBAL_KEY]
    }
}

if (
    import.meta.hot &&
    typeof import.meta.hot.dispose === 'function' &&
    typeof import.meta.hot.accept === 'function'
) {
    import.meta.hot.dispose(() => {
        resetChatDispatcherGlobal()
    })
    import.meta.hot.accept()
}

export const chatStream: ChatStreamPort = {
    createTransport: createWailsChatTransport,
}
