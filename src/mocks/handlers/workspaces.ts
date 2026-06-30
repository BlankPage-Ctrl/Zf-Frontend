import { http, HttpResponse } from 'msw'
import { store } from '../data/seed'
import { createWorkspace } from '../data/factories'

export const workspaceHandlers = [
    http.get('/workspaces', () => {
        return HttpResponse.json(store.workspaces.findAll())
    }),

    http.get('/workspaces/:id', ({ params }) => {
        const ws = store.workspaces.findById(params.id as string)
        if (!ws) return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
        return HttpResponse.json(ws)
    }),

    http.post('/workspaces', async ({ request }) => {
        const body = (await request.json()) as {
            name: string
            description?: string
            projectPath: string
        }
        const ws = createWorkspace({
            name: body.name,
            description: body.description ?? null,
            projectPath: body.projectPath,
        })
        store.workspaces.create(ws)
        return HttpResponse.json(ws, { status: 201 })
    }),

    http.patch('/workspaces/:id', async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>
        const ws = store.workspaces.update(params.id as string, body)
        if (!ws) return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
        return HttpResponse.json(ws)
    }),

    http.delete('/workspaces/:id', ({ params }) => {
        const ws = store.workspaces.findById(params.id as string)
        if (!ws) return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
        store.workspaces.remove(params.id as string)
        return new HttpResponse(null, { status: 204 })
    }),
]
