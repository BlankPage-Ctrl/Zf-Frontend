import { http, HttpResponse } from 'msw'
import type { UIMessage } from 'ai'
import { mockMessages } from '../data/seed'

function buildSSEStream(assistantMsg: UIMessage): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder()

    return new ReadableStream({
        async start(controller) {
            const send = (obj: Record<string, unknown>) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
            }

            send({ type: 'start', messageId: `msg_${crypto.randomUUID()}` })
            send({ type: 'start-step' })

            let textId = 0
            let reasoningId = 0

            for (const part of assistantMsg.parts) {
                switch (part.type) {
                    case 'step-start':
                        break

                    case 'reasoning': {
                        const id = `reasoning-${++reasoningId}`
                        send({ type: 'reasoning-start', id })
                        send({
                            type: 'reasoning-delta',
                            id,
                            delta: (part as { text: string }).text,
                        })
                        send({ type: 'reasoning-end', id })
                        break
                    }

                    case 'text': {
                        const id = `text-${++textId}`
                        send({ type: 'text-start', id })
                        send({ type: 'text-delta', id, delta: (part as { text: string }).text })
                        send({ type: 'text-end', id })
                        break
                    }

                    case 'tool-list_files':
                    case 'tool-read_file': {
                        const toolPart = part as {
                            type: string
                            toolCallId: string
                            input?: unknown
                            output?: unknown
                        }
                        const toolName = toolPart.type.replace('tool-', '')
                        send({
                            type: 'tool-input-start',
                            toolCallId: toolPart.toolCallId,
                            toolName,
                        })
                        if (toolPart.input != null) {
                            send({
                                type: 'tool-input-available',
                                toolCallId: toolPart.toolCallId,
                                toolName,
                                input: toolPart.input,
                            })
                        }
                        if (toolPart.output != null) {
                            send({
                                type: 'tool-output-available',
                                toolCallId: toolPart.toolCallId,
                                output: toolPart.output,
                            })
                        }
                        break
                    }

                    default:
                        break
                }
            }

            send({ type: 'finish-step' })
            send({ type: 'finish', finishReason: 'stop' })
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
        },
    })
}

function getAssistantMessage(): UIMessage | null {
    const assistantMsg = mockMessages.find((m) => m.role === 'assistant')
    return assistantMsg ?? null
}

export const messageHandlers = [
    http.get('/workspaces/:workspaceId/chats/:chatId/messages', () => {
        return HttpResponse.json(mockMessages)
    }),

    http.post('/workspaces/:workspaceId/chats/:chatId/messages', async ({ request }) => {
        const body = (await request.json().catch(() => null)) as { message?: UIMessage } | null
        const userMessage = body?.message

        if (!userMessage || userMessage.role !== 'user') {
            return HttpResponse.json(
                { message: 'body.message is required and must be a user message' },
                { status: 400 },
            )
        }

        const assistantMsg = getAssistantMessage()
        if (!assistantMsg) {
            return HttpResponse.json(
                { message: 'No mock assistant message available' },
                { status: 500 },
            )
        }

        const stream = buildSSEStream(assistantMsg)

        return new Response(stream, {
            status: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
                'X-Accel-Buffering': 'no',
            },
        })
    }),
]
