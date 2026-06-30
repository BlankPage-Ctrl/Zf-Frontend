import { http, HttpResponse } from 'msw'
import { store } from '../data/seed'
import { createProvider, createModel, maskApiKey } from '../data/factories'

export const providerHandlers = [
  http.get('/providers', () => {
    const providers = store.providers.findAll().map((p) => ({
      ...p,
      apiKey: maskApiKey(p.apiKey),
      models: store.models.filter((m) => m.providerId === p.id),
    }))
    return HttpResponse.json(providers)
  }),

  http.get('/providers/:id', ({ params }) => {
    const p = store.providers.findById(params.id as string)
    if (!p) return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
    const models = store.models.filter((m) => m.providerId === p.id)
    return HttpResponse.json({ ...p, apiKey: maskApiKey(p.apiKey), models })
  }),

  http.post('/providers', async ({ request }) => {
    const body = (await request.json()) as {
      name: string
      type: string
      apiKey?: string
      baseURL?: string
    }
    const p = createProvider({
      name: body.name,
      type: body.type,
      apiKey: body.apiKey,
      baseURL: body.baseURL ?? null,
    })
    store.providers.create(p)
    return HttpResponse.json(p, { status: 201 })
  }),

  http.patch('/providers/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const p = store.providers.update(params.id as string, body)
    if (!p) return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
    return HttpResponse.json(p)
  }),

  http.delete('/providers/:id', ({ params }) => {
    const p = store.providers.findById(params.id as string)
    if (!p) return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
    store.providers.remove(params.id as string)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/providers/:providerId/models', ({ params }) => {
    const models = store.models.filter((m) => m.providerId === params.providerId)
    return HttpResponse.json(models)
  }),

  http.post('/providers/:providerId/models', async ({ params, request }) => {
    const body = (await request.json()) as { modelId: string; displayName?: string }
    const model = createModel({
      modelId: body.modelId,
      displayName: body.displayName ?? null,
      providerId: params.providerId as string,
    })
    store.models.create(model)
    return HttpResponse.json(model, { status: 201 })
  }),

  http.patch('/providers/:providerId/models/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const model = store.models.update(params.id as string, body)
    if (!model) return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
    return HttpResponse.json(model)
  }),

  http.delete('/providers/:providerId/models/:id', ({ params }) => {
    const model = store.models.findById(params.id as string)
    if (!model) return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
    store.models.remove(params.id as string)
    return new HttpResponse(null, { status: 204 })
  }),
]
