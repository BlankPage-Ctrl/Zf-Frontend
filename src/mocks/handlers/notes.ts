import { http, HttpResponse } from 'msw'
import { store } from '../data/seed'
import { createNote, createCategory } from '../data/factories'

export const noteHandlers = [
    http.get('/notes', ({ request }) => {
        const url = new URL(request.url)
        const category = url.searchParams.get('category')
        const priority = url.searchParams.get('priority')
        const search = url.searchParams.get('search')
        const sort = url.searchParams.get('sort')
        const order = url.searchParams.get('order')
        const limit = url.searchParams.get('limit')
        const offset = url.searchParams.get('offset')

        let notes = store.notes.findAll()

        if (category) notes = notes.filter((n) => n.category_id === category)
        if (priority) notes = notes.filter((n) => n.priority === priority)
        if (search) {
            const q = search.toLowerCase()
            notes = notes.filter(
                (n) =>
                    n.name.toLowerCase().includes(q) ||
                    (n.desc && n.desc.toLowerCase().includes(q)) ||
                    (n.details && n.details.toLowerCase().includes(q)),
            )
        }

        if (sort === 'name') notes.sort((a, b) => a.name.localeCompare(b.name))
        else if (sort === 'priority') {
            const order = { critical: 0, high: 1, medium: 2, low: 3 }
            notes.sort((a, b) => order[a.priority] - order[b.priority])
        } else notes.sort((a, b) => a.position - b.position)

        if (order === 'desc') notes.reverse()

        const start = Number(offset) || 0
        const end = limit ? start + Number(limit) : undefined
        return HttpResponse.json(notes.slice(start, end))
    }),

    http.get('/notes/:id', ({ params }) => {
        const note = store.notes.findById(params.id as string)
        if (!note) return HttpResponse.json({ error: `Note ${params.id} not found` }, { status: 404 })
        return HttpResponse.json(note)
    }),

    http.post('/notes', async ({ request }) => {
        const body = (await request.json()) as {
            name: string
            category_id?: string
            desc?: string
            details?: string
            priority?: 'low' | 'medium' | 'high' | 'critical'
            position?: { before?: string; after?: string }
        }

        let position = store.notes.findAll().length
        if (body.position?.before) {
            const before = store.notes.findById(body.position.before)
            if (before) position = before.position
        } else if (body.position?.after) {
            const after = store.notes.findById(body.position.after)
            if (after) position = after.position + 1
        }

        const note = createNote({
            name: body.name,
            category_id: body.category_id ?? null,
            desc: body.desc ?? null,
            details: body.details ?? null,
            priority: body.priority ?? 'medium',
            position,
        })
        store.notes.create(note)
        return HttpResponse.json(note, { status: 201 })
    }),

    http.patch('/notes/:id', async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>
        const note = store.notes.update(params.id as string, body)
        if (!note) return HttpResponse.json({ error: `Note ${params.id} not found` }, { status: 400 })
        return HttpResponse.json(note)
    }),

    http.delete('/notes/:id', ({ params }) => {
        store.notes.remove(params.id as string)
        return new HttpResponse(null, { status: 204 })
    }),

    http.post('/notes/:id/move', async ({ params, request }) => {
        const body = (await request.json()) as { before?: string; after?: string }
        const note = store.notes.findById(params.id as string)
        if (!note) return HttpResponse.json({ error: `Note ${params.id} not found` }, { status: 400 })

        if (body.before) {
            const before = store.notes.findById(body.before)
            if (before) note.position = before.position
        } else if (body.after) {
            const after = store.notes.findById(body.after)
            if (after) note.position = after.position + 1
        }
        store.notes.update(note.id, { position: note.position })
        return HttpResponse.json(note)
    }),

    http.post('/notes-renumber', () => {
        const notes = store.notes.findAll().sort((a, b) => a.position - b.position)
        notes.forEach((n, i) => store.notes.update(n.id, { position: i }))
        return HttpResponse.json({ ok: true })
    }),

    http.get('/categories', () => {
        return HttpResponse.json(store.categories.findAll())
    }),

    http.post('/categories', async ({ request }) => {
        const body = (await request.json()) as { name: string; color?: string }
        const cat = createCategory({
            name: body.name,
            color: body.color ?? null,
        })
        store.categories.create(cat)
        return HttpResponse.json(cat, { status: 201 })
    }),

    http.patch('/categories/:id', async ({ params, request }) => {
        const body = (await request.json()) as { name: string }
        const cat = store.categories.update(params.id as string, { name: body.name })
        if (!cat) return HttpResponse.json({ error: `Category ${params.id} not found` }, { status: 400 })
        return HttpResponse.json(cat)
    }),

    http.delete('/categories/:id', ({ params }) => {
        store.categories.remove(params.id as string)
        return new HttpResponse(null, { status: 204 })
    }),
]
