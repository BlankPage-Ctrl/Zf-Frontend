import { http, HttpResponse } from 'msw'
import { store } from '../data/seed'
import { createWorkspace } from '../data/factories'
import { ok, fail } from './helpers'

export const workspaceHandlers = [
    http.get('/workspaces', () => {
        return ok(store.workspaces.findAll())
    }),

    http.get('/workspaces/:id', ({ params }) => {
        const ws = store.workspaces.findById(params.id as string)
        if (!ws) return fail('NOT_FOUND', `Workspace ${params.id} not found`, { status: 404 })
        return ok(ws)
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
        return ok(ws, { status: 201 })
    }),

    http.patch('/workspaces/:id', async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>
        const ws = store.workspaces.update(params.id as string, body)
        if (!ws) return fail('NOT_FOUND', `Workspace ${params.id} not found`, { status: 404 })
        return ok(ws)
    }),

    http.delete('/workspaces/:id', ({ params }) => {
        const ws = store.workspaces.findById(params.id as string)
        if (!ws) return fail('NOT_FOUND', `Workspace ${params.id} not found`, { status: 404 })
        store.workspaces.remove(params.id as string)
        return new HttpResponse(null, { status: 204 })
    }),
]
