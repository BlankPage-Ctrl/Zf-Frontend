import { Chat } from '@ai-sdk/vue'
import type { UIMessage } from 'ai'
import type { MessageRepository, ChatStreamPort, RunRepository } from '@/core/repositories'
import type { ChatSessionStatus } from '@/core/entities'
import type { RunFetchHooks } from '@/data/stream/run.transport'

export interface ChatSessionStatePatch {
    messages?: UIMessage[]
    status?: ChatSessionStatus
    error?: Error | undefined
    isLoading?: boolean
    activeRunId?: string | undefined
}

export interface ChatSessionDeps {
    messagesRepo: MessageRepository
    runsRepo: RunRepository
    stream: ChatStreamPort
    onState: (chatId: string, patch: ChatSessionStatePatch) => void
}

export interface ChatSessionEngine {
    loadHistory(workspaceId: string, chatId: string): Promise<void>
    sendMessage(workspaceId: string, chatId: string, text: string): Promise<void>
    stop(chatId: string): Promise<void>
    regenerate(chatId: string): Promise<void>
    dispose(chatId: string): void
    clear(): void
}

export interface ChatSessionEngineBundle {
    engine: ChatSessionEngine
    runHooks: RunFetchHooks
}

export function createChatSessionEngine(deps: ChatSessionDeps): ChatSessionEngineBundle {
    const engines = new Map<string, Chat<UIMessage>>()
    const intervals = new Map<string, ReturnType<typeof setInterval>>()
    const chatWorkspaces = new Map<string, string>()
    const activeRuns = new Map<string, { runId: string; workspaceId: string }>()
    const lastSeq = new Map<string, number>()
    const resumeTargets = new Map<string, { runId: string; afterSeq: number }>()

    const runHooks: RunFetchHooks = {
        onRunStarted: (chatId, runId) => {
            const workspaceId = chatWorkspaces.get(chatId)
            if (workspaceId) activeRuns.set(chatId, { runId, workspaceId })
            deps.onState(chatId, { activeRunId: runId })
        },
        onSeq: (chatId, seq) => {
            lastSeq.set(chatId, seq)
        },
        getResumeTarget: (chatId) => resumeTargets.get(chatId),
        clearResumeTarget: (chatId) => {
            resumeTargets.delete(chatId)
        },
    }

    function ensureEngine(
        workspaceId: string,
        chatId: string,
        initialMessages?: UIMessage[],
    ): Chat<UIMessage> {
        chatWorkspaces.set(chatId, workspaceId)
        let chat = engines.get(chatId)
        if (!chat) {
            const transport = deps.stream.createTransport(workspaceId, chatId)
            chat = new Chat({
                id: chatId,
                messages: initialMessages ?? [],
                transport,
                onFinish: () => {
                    activeRuns.delete(chatId)
                    deps.onState(chatId, { status: 'ready', isLoading: false, activeRunId: undefined })
                    stopPolling(chatId)
                },
                onError: (e: Error) => {
                    activeRuns.delete(chatId)
                    deps.onState(chatId, { error: e, status: 'error', isLoading: false, activeRunId: undefined })
                    stopPolling(chatId)
                },
            })
            engines.set(chatId, chat)
        }
        return chat
    }

    function syncChat(chatId: string): void {
        const chat = engines.get(chatId)
        if (!chat) return
        const patch: ChatSessionStatePatch = { status: chat.status }
        if (chat.messages) {
            patch.messages = [...chat.messages]
        }
        patch.isLoading = chat.status === 'submitted' || chat.status === 'streaming'
        deps.onState(chatId, patch)
    }

    function startPolling(chatId: string): void {
        if (intervals.has(chatId)) return
        syncChat(chatId)
        intervals.set(
            chatId,
            setInterval(() => {
                const chat = engines.get(chatId)
                if (!chat) {
                    stopPolling(chatId)
                    return
                }
                syncChat(chatId)
                if (chat.status !== 'submitted' && chat.status !== 'streaming') {
                    stopPolling(chatId)
                }
            }, 100),
        )
    }

    function stopPolling(chatId: string): void {
        const interval = intervals.get(chatId)
        if (interval) {
            clearInterval(interval)
            intervals.delete(chatId)
        }
    }

    async function loadHistory(workspaceId: string, chatId: string): Promise<void> {
        if (engines.has(chatId)) return
        try {
            const history = await deps.messagesRepo.loadHistory(workspaceId, chatId)
            const runs = await deps.runsRepo.list(workspaceId, chatId).catch(() => [])
            const running = (runs ?? []).filter((r) => r.status === 'running')
            if (running.length === 0) {
                ensureEngine(workspaceId, chatId, history ?? [])
                deps.onState(chatId, { messages: history ?? [], status: 'ready', isLoading: false })
                return
            }
            // Resume the newest running run,drop its partial assistant
            // message from history (the resumed stream rebuilds it), then
            // reattach from seq 0.
            const target = running[0]
            if (!target) {
                ensureEngine(workspaceId, chatId, history ?? [])
                deps.onState(chatId, { messages: history ?? [], status: 'ready', isLoading: false })
                return
            }
            const initial = (history ?? []).filter((m) => m.id !== target.assistantMessageId)
            const chat = ensureEngine(workspaceId, chatId, initial)
            activeRuns.set(chatId, { runId: target.runId, workspaceId })
            resumeTargets.set(chatId, { runId: target.runId, afterSeq: 0 })
            deps.onState(chatId, {
                messages: initial,
                error: undefined,
                isLoading: true,
                activeRunId: target.runId,
            })
            startPolling(chatId)
            try {
                await chat.resumeStream()
            } catch (e: unknown) {
                deps.onState(chatId, {
                    error: e instanceof Error ? e : new Error('Failed to resume stream'),
                    isLoading: false,
                })
                stopPolling(chatId)
            }
        } catch (e: unknown) {
            deps.onState(chatId, {
                error: e instanceof Error ? e : new Error('Failed to load messages'),
            })
        }
    }

    async function sendMessage(workspaceId: string, chatId: string, text: string): Promise<void> {
        if (!text.trim()) return
        const chat = ensureEngine(workspaceId, chatId)
        deps.onState(chatId, { error: undefined, isLoading: true })
        startPolling(chatId)
        try {
            await chat.sendMessage({ text })
        } catch (e: unknown) {
            deps.onState(chatId, {
                error: e instanceof Error ? e : new Error('Failed to send message'),
                isLoading: false,
            })
            stopPolling(chatId)
        }
    }

    async function stop(chatId: string): Promise<void> {
        const active = activeRuns.get(chatId)
        if (active) {
            // top cancels the run server-side (kills the agent).
            // The terminal frame closes the SSE stream; Chat then finishes.
            try {
                await deps.runsRepo.cancel(active.workspaceId, chatId, active.runId)
            } catch (e: unknown) {
                deps.onState(chatId, {
                    error: e instanceof Error ? e : new Error('Failed to cancel run'),
                })
            }
            activeRuns.delete(chatId)
        }
        const chat = engines.get(chatId)
        if (chat) {
            try {
                await chat.stop()
            } catch {
                /* settling local state only */
            }
        }
        stopPolling(chatId)
        deps.onState(chatId, { status: 'ready', isLoading: false, activeRunId: undefined })
    }

    async function regenerate(chatId: string): Promise<void> {
        const chat = engines.get(chatId)
        if (!chat) return
        deps.onState(chatId, { error: undefined, isLoading: true })
        startPolling(chatId)
        try {
            await chat.regenerate()
        } catch (e: unknown) {
            deps.onState(chatId, {
                error: e instanceof Error ? e : new Error('Failed to regenerate'),
                isLoading: false,
            })
            stopPolling(chatId)
        }
    }

    function detach(chatId: string): void {
        // Locked R2: closing a tab only detaches the local watcher — the
        // run keeps going on the backend and can be resumed later.
        const chat = engines.get(chatId)
        if (chat) {
            chat.stop().catch(() => {})
        }
        stopPolling(chatId)
        engines.delete(chatId)
        activeRuns.delete(chatId)
        lastSeq.delete(chatId)
        resumeTargets.delete(chatId)
        chatWorkspaces.delete(chatId)
    }

    function dispose(chatId: string): void {
        detach(chatId)
    }

    function clear(): void {
        for (const chatId of engines.keys()) {
            detach(chatId)
        }
        intervals.forEach((interval) => clearInterval(interval))
        intervals.clear()
    }

    return {
        engine: {
            loadHistory,
            sendMessage,
            stop,
            regenerate,
            dispose,
            clear,
        },
        runHooks,
    }
}
