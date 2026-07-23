import { getResponse } from 'msw'
import type { RequestHandler } from 'msw'

export function setupFallbackWorker(handlers: RequestHandler[]) {
    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input, init) => {
        const request = new Request(input, init)

        try {
            const response = await getResponse(handlers, request, { quiet: true })
            if (response) return response
        } catch {
            // ignore
        }

        return originalFetch(input, init)
    }

    return {
        start: () => {
            console.log('[MSW] Fallback mode started (fetch interception)')
        },
        stop: () => {
            window.fetch = originalFetch
        },
    }
}
