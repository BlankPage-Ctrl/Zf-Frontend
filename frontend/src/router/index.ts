import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('@/views/Primary.vue'),
        },
        {
            path: '/primary',
            name: 'primary',
            component: () => import('@/views/Primary.vue'),
        },
        {
            path: '/workspace/:id',
            name: 'workspace',
            component: () => import('@/views/Workspace.vue'),
        },
        {
            path: '/settings',
            name: 'settings',
            component: () => import('@/views/Settings.vue'),
        },
    ],
})

export default router
