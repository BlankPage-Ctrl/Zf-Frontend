import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router/index.ts'

async function bootstrap() {
    if (import.meta.env.VITE_API_MOCKING === 'true') {
        const { handlers } = await import('./mocks/handlers')

        try {
            const { worker } = await import('./mocks/browser.ts')
            await worker.start({ onUnhandledRequest: 'bypass' })
        } catch {
            const { setupFallbackWorker } = await import('./mocks/fallback')
            const worker = setupFallbackWorker(handlers)
            worker.start()
        }
    }

    const app = createApp(App)

    app.use(createPinia())
    app.use(router)

    app.mount('#app')
}

bootstrap()
