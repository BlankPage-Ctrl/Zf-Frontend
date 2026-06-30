import { http, HttpResponse } from 'msw'
import { store } from '../data/seed'

export const chatHandlers = [
    http.get('/workspaces/:workspaceId/chats', ({ params }) => {
        const chats = store.chats.filter((c) => c.workspaceId === params.workspaceId)
        return HttpResponse.json(chats)
    }),

    http.get('/workspaces/:workspaceId/chats/:id', ({ params }) => {
        const chat = store.chats.findById(params.id as string)
        if (!chat || chat.workspaceId !== params.workspaceId) {
            return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
        }
        return HttpResponse.json(chat)
    }),

    http.post('/workspaces/:workspaceId/chats', async ({ params, request }) => {
        const body = (await request.json()) as {
            title: string
            providerId?: string
            modelId?: string
            systemPrompt?: string
        }
        const chat = {
            id: crypto.randomUUID(),
            title: body.title,
            providerId: body.providerId ?? null,
            modelId: body.modelId ?? null,
            systemPrompt: body.systemPrompt ?? null,
            workspaceId: params.workspaceId as string,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        store.chats.create(chat)
        return HttpResponse.json(chat, { status: 201 })
    }),

    http.patch('/workspaces/:workspaceId/chats/:id', async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>
        const chat = store.chats.update(params.id as string, body)
        if (!chat) return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
        return HttpResponse.json(chat)
    }),

    http.delete('/workspaces/:workspaceId/chats/:id', ({ params }) => {
        const chat = store.chats.findById(params.id as string)
        if (!chat || chat.workspaceId !== params.workspaceId) {
            return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
        }
        store.chats.remove(params.id as string)
        return new HttpResponse(null, { status: 204 })
    }),
]
