import { http, HttpResponse } from 'msw'
import { store } from '../data/seed'

export const settingsHandlers = [
    http.get('/settings/default-provider', () => {
        const pid = store.settings.get('defaultProviderId')
        const mid = store.settings.get('defaultModelId')
        return HttpResponse.json({
            providerId: pid?.value ?? null,
            modelId: mid?.value ?? null,
        })
    }),

    http.put('/settings/default-provider', async ({ request }) => {
        const body = (await request.json()) as { providerId: string; modelId: string }
        store.settings.set('defaultProviderId', body.providerId)
        store.settings.set('defaultModelId', body.modelId)
        return HttpResponse.json({ providerId: body.providerId, modelId: body.modelId })
    }),

    http.get('/settings/:key', ({ params }) => {
        const setting = store.settings.get(params.key as string)
        return HttpResponse.json({
            key: params.key,
            value: setting?.value ?? null,
        })
    }),

    http.put('/settings/:key', async ({ params, request }) => {
        const body = (await request.json()) as { value: string }
        store.settings.set(params.key as string, body.value)
        return HttpResponse.json({ key: params.key, value: body.value })
    }),
]
