<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Folder, Plus, Trash, NavArrowDown, Settings as SettingsIcon } from '@iconoir/vue'
import DropdownRoot from '@/components/dropdown/DropdownRoot.vue'
import type { DropdownItemConfig } from '@/components/dropdown/types'
import type { DialogGridSchema } from '@/components/dialog/types'
import { useDialog } from '@/composables/useDialog'
import { useWorkspaceStore } from '@/stores/workspace'
import { useSettingsDialog } from '@/composables/useSettingsDialog'

const router = useRouter()
const wsStore = useWorkspaceStore()
const dialog = useDialog()
const settingsDialog = useSettingsDialog()

const selectedWsName = computed(() => {
    if (!wsStore.selectedWorkspace) return 'Select workspace'
    return wsStore.selectedWorkspace.name
})

const wsFormSchema: DialogGridSchema = {
    ws: {
        columns: {
            name: {
                type: 'text-short',
                label: 'Name',
                placeholder: 'My workspace',
                metadata: { require: true },
            },
            description: {
                type: 'text-short',
                label: 'Description',
                placeholder: 'Optional description',
            },
            projectPath: {
                type: 'text-short',
                label: 'Project path',
                placeholder: '/path/to/project',
                metadata: { require: true },
            },
        },
    },
}

const wsDropdownItems = computed<DropdownItemConfig[]>(() => {
    const items: DropdownItemConfig[] = wsStore.workspaces.map((ws) => ({
        id: ws.id,
        label: ws.name,
        icon: Folder,
        value: ws.id,
        selected: ws.id === wsStore.selectedWorkspaceId,
        rightIcon: Trash,
        rightAction: { type: 'command', command: 'delete-workspace', args: { id: ws.id } },
    }))
    return items
})

function workspaceSelect(id: string) {
    wsStore.selectWorkspace(id)
    router.push({ name: 'workspace', params: { id } })
}

function handleSelect(value: string) {
    workspaceSelect(value)
}

async function handleAction(action: { type: 'command'; command: string; args?: Record<string, unknown> }) {
    if (action.command === 'add-workspace') {
        await dialog.spawn({
            title: 'New workspace',
            schema: wsFormSchema,
            confirmLabel: 'Create',
            submit: async (data) => {
                const d = data.ws!
                await wsStore.createWorkspace({
                    name: String(d.name ?? ''),
                    description: String(d.description ?? ''),
                    projectPath: String(d.projectPath ?? ''),
                })
                workspaceSelect(wsStore.selectedWorkspaceId!)
            },
        })
    } else if (action.command === 'delete-workspace') {
        const id = action.args?.id as string
        const ws = wsStore.workspaces.find((w) => w.id === id)
        if (ws) {
            await dialog.spawn({
                title: 'Delete workspace',
                message: `Delete "${ws.name}"?`,
                confirmLabel: 'Delete',
                confirmVariant: 'danger',
                submit: async () => {
                    await wsStore.deleteWorkspace(ws.id)
                    if (wsStore.selectedWorkspaceId !== ws.id) return
                    const first = wsStore.workspaces[0]
                    if (first) {
                        workspaceSelect(first.id)
                    } else {
                        wsStore.selectWorkspace('')
                        router.push({ name: 'home' })
                    }
                },
            })
        }
    }
}

function openSettings() {
    settingsDialog.show()
}

onMounted(() => {
    wsStore.fetchWorkspaces()
})
</script>

<template>
    <div class="app-title">
        <div class="ws-group">
            <DropdownRoot
                :items="wsDropdownItems"
                mode="menu"
                placement="bottom"
                :width="{ mode: 'fixed', width: 166 }"
                :offset="6"
                :dense="true"
                :style="{
                    menu: {
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        padding: '2px',
                    },
                    item: {
                        borderRadius: '4px',
                        hoverBackground: 'rgba(var(--raw-border-color), 0.3)',
                        selectedBackground: 'rgba(var(--raw-border-color), 0.3)',
                    },
                }"
                @select="handleSelect"
                @action="handleAction"
            >
                <template #trigger="{ isOpen, toggle }">
                    <div
                        class="ws-trigger"
                        :class="{ 'ws-trigger--open': isOpen }"
                        @click="toggle"
                        role="button"
                        tabindex="0"
                        aria-haspopup="true"
                        :aria-expanded="isOpen"
                    >
                        <span class="ws-trigger__label">{{ selectedWsName }}</span>
                        <NavArrowDown
                            width="12"
                            height="12"
                            class="ws-trigger__chevron"
                            :class="{ 'ws-trigger__chevron--open': isOpen }"
                        />
                    </div>
                </template>
            </DropdownRoot>

            <button
                class="ws-add-btn"
                @click="handleAction({ type: 'command', command: 'add-workspace', args: {} })"
                title="New workspace"
                aria-label="New workspace"
            >
                <Plus width="14" height="14" />
            </button>
        </div>

        <button
            class="ws-add-btn ws-settings-btn"
            @click="openSettings"
            title="Settings"
            aria-label="Settings"
        >
            <SettingsIcon width="14" height="14" />
        </button>
    </div>
</template>

<style scoped>
.app-title {
    height: 35px;
    display: flex;
    align-items: center;
    padding: 1px 5px;
    gap: 6px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
    -webkit-app-region: drag;
}

.ws-group {
    display: flex;
    align-items: center;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    -webkit-app-region: no-drag;
}

.ws-trigger {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    cursor: pointer;
    user-select: none;
    -webkit-app-region: no-drag;
    transition: background-color 80ms ease;
    width: 140px;
    flex-shrink: 0;
    border-radius: 4px 0 0 4px;
}

.ws-trigger:hover,
.ws-trigger--open {
    background: rgba(var(--raw-border-color), 0.3);
}

.ws-trigger__label {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-primary);
    opacity: 0.75;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ws-trigger__chevron {
    color: var(--text-primary);
    transition: transform 120ms ease;
}

.ws-trigger__chevron--open {
    transform: rotate(180deg);
}

.ws-add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-left: 1px solid var(--border-color);
    border-radius: 0 4px 4px 0;
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
    -webkit-app-region: no-drag;
    transition:
        background-color 80ms ease,
        color 80ms ease;
}

.ws-add-btn:hover {
    background: var(--border-color);
    color: var(--text-primary);
}

.ws-settings-btn {
    color: var(--text-primary);
}

.ws-settings-btn:hover {
    color: var(--text-primary);
}
</style>
