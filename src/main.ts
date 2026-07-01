import 'vue-code-layout/lib/vue-code-layout.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'


import App from './App.vue'
import router from './router'
import CodeLayout from 'vue-code-layout'

async function bootstrap() {
    if (import.meta.env.VITE_API_MOCKING === 'true') {
        const { worker } = await import('./mocks/browser')
        await worker.start({ onUnhandledRequest: 'bypass' })
    }

    const app = createApp(App)

    app.use(createPinia())
    app.use(router)
    app.use(CodeLayout)
    // eslint-disable-next-line vue/multi-word-component-names


    app.mount('#app')
}

bootstrap()
