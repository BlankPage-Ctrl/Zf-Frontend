import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

async function bootstrap() {
    if (import.meta.env.VITE_API_MOCKING === 'true') {
        const { worker } = await import('./mocks/browser')
        await worker.start({ onUnhandledRequest: 'bypass' })
    }

    const app = createApp(App)

    app.use(createPinia())
    app.use(router)

    app.mount('#app')
}

bootstrap()
