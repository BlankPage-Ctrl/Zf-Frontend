import { http } from 'msw'
import { store } from '../data/seed'
import { ok } from './helpers'

export const settingsHandlers = [
    http.get('/settings/default-provider', () => {
        const pid = store.settings.get('defaultProviderId')
        const mid = store.settings.get('defaultModelId')
        return ok({
            providerId: pid?.value ?? null,
            modelId: mid?.value ?? null,
        })
    }),

    http.put('/settings/default-provider', async ({ request }) => {
        const body = (await request.json()) as { providerId: string; modelId: string }
        store.settings.set('defaultProviderId', body.providerId)
        store.settings.set('defaultModelId', body.modelId)
        return ok({ providerId: body.providerId, modelId: body.modelId })
    }),

    http.get('/settings/:key', ({ params }) => {
        const setting = store.settings.get(params.key as string)
        return ok({
            key: params.key,
            value: setting?.value ?? null,
        })
    }),

    http.put('/settings/:key', async ({ params, request }) => {
        const body = (await request.json()) as { value: string }
        store.settings.set(params.key as string, body.value)
        return ok({ key: params.key, value: body.value })
    }),
]
