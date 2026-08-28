<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { RouterView } from 'vue-router'
import { IconoirProvider } from '@iconoir/vue'
import AppTitle from '@/presentation/components/AppTitle.vue'
import DialogContainer from '@/presentation/components/dialog/DialogContainer.vue'
import { useWorkspaceStorer } from '@/application/stores'
import {
    workspaceActions,
    appearanceActions,
    themeActions,
    providerActions,
} from '@/application/actions'
import { useSettingsTab } from '@/presentation/composables/useSettingsTab'
import { useDialog } from '@/presentation/composables/useDialog'
import { workspaceFormSchema } from '@/presentation/schemas'

const router = useRouter()
const wsStorer = useWorkspaceStorer()
const settingsTab = useSettingsTab()
const dialog = useDialog()

onMounted(async () => {
    appearanceActions.load()
    await themeActions.load()
    await providerActions.fetchProviders()
    await providerActions.fetchDefaultProvider()
    workspaceActions.fetchWorkspaces()
})

// --- AppTitle (title bar) orchestration ---
function onSelectWorkspace(id: string) {
    workspaceActions.selectWorkspace(id)
    router.push({ name: 'workspace', params: { id } })
}

async function onCreateWorkspace() {
    await dialog.spawn({
        title: 'New workspace',
        schema: workspaceFormSchema,
        confirmLabel: 'Create',
        submit: async (data) => {
            const d = data.ws!
            await workspaceActions.createWorkspace({
                name: String(d.name ?? ''),
                description: String(d.description ?? ''),
                projectPath: String(d.projectPath ?? ''),
            })
            if (wsStorer.selectedWorkspaceId) {
                router.push({
                    name: 'workspace',
                    params: { id: wsStorer.selectedWorkspaceId },
                })
            }
        },
    })
}

async function onDeleteWorkspace(id: string) {
    const ws = wsStorer.workspaces.find((w) => w.id === id)
    if (!ws) return
    await dialog.spawn({
        title: 'Delete workspace',
        message: `Delete "${ws.name}"?`,
        confirmLabel: 'Delete',
        confirmVariant: 'danger',
        submit: async () => {
            await workspaceActions.deleteWorkspace(id)
            if (wsStorer.selectedWorkspaceId !== id) return
            const first = wsStorer.workspaces[0]
            if (first) {
                workspaceActions.selectWorkspace(first.id)
                router.push({ name: 'workspace', params: { id: first.id } })
            } else {
                workspaceActions.selectWorkspace(null)
                router.push({ name: 'home' })
            }
        },
    })
}
</script>

<template>
    <IconoirProvider>
        <div class="app-shell">
            <AppTitle
                :workspaces="wsStorer.workspaces"
                :selected-workspace-id="wsStorer.selectedWorkspaceId"
                :loading="wsStorer.loading"
                @select-workspace="onSelectWorkspace"
                @create-workspace="onCreateWorkspace"
                @delete-workspace="onDeleteWorkspace"
                @open-settings="settingsTab.requestOpen()"
            />
            <RouterView v-slot="{ Component }">
                <div class="router-view">
                    <component :is="Component" />
                </div>
            </RouterView>
            <DialogContainer />
        </div>
    </IconoirProvider>
</template>

<style scoped>
.app-shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.router-view {
    flex: 1;
    min-height: 0;
}
</style>
