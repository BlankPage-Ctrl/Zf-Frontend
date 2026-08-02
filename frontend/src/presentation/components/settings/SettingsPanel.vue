<script setup lang="ts">
import { Header } from '@/presentation/components/header'
import ProviderSection from './components/ProviderSection.vue'
import AppearanceSection from './components/AppearanceSection.vue'
import ThemeSection from './components/ThemeSection.vue'
import type { Provider } from '@/core/entities'
import type { SettingsTheme } from './types'

defineProps<{
    providers: Provider[]
    loading: boolean
    error: string | null
    defaultProviderId: string | null
    defaultModelId: string | null
    preset: string
    fontSize: number
    themes: SettingsTheme[]
    activeThemeId: string | null
    presets: readonly { readonly label: string; readonly fontSize: number }[]
}>()

const emit = defineEmits<{
    'add-provider': []
    'edit-provider': [provider: Provider]
    'delete-provider': [id: string]
    'add-model': [providerId: string]
    'edit-model': [
        providerId: string,
        modelId: string,
        data: { modelId: string; displayName?: string },
    ]
    'delete-model': [providerId: string, modelId: string]
    'set-default': [providerId: string, modelId: string]
    'update-preset': [preset: string]
    'update-font-size': [size: number]
    'set-active-theme': [id: string]
    close: []
}>()
</script>

<template>
    <div class="settings-panel">
        <section class="settings-section">
            <Header
                :schema="{
                    title: 'Model and Provider',
                    height: 'auto',
                    padding: 'none',
                    border: true,
                }"
            />
            <ProviderSection
                :providers="providers"
                :loading="loading"
                :error="error"
                :default-provider-id="defaultProviderId"
                :default-model-id="defaultModelId"
                @add-provider="emit('add-provider')"
                @edit-provider="(provider) => emit('edit-provider', provider)"
                @delete-provider="(id) => emit('delete-provider', id)"
                @add-model="(id) => emit('add-model', id)"
                @edit-model="(pid, mid, data) => emit('edit-model', pid, mid, data)"
                @delete-model="(pid, mid) => emit('delete-model', pid, mid)"
                @set-default="(pid, mid) => emit('set-default', pid, mid)"
            />
        </section>

        <section class="settings-section section-appearance">
            <Header
                :schema="{
                    title: 'Appearance & Theme',
                    height: 'auto',
                    padding: 'none',
                    border: true,
                }"
            />
            <AppearanceSection
                :preset="preset"
                :font-size="fontSize"
                :presets="presets"
                @update-preset="(v) => emit('update-preset', v)"
                @update-font-size="(v) => emit('update-font-size', v)"
            />
            <ThemeSection
                :themes="themes"
                :active-theme-id="activeThemeId"
                @set-active-theme="(id) => emit('set-active-theme', id)"
            />
        </section>
    </div>
</template>

<style scoped>
.settings-panel {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.settings-section {
    max-width: 100%;
}

.section-appearance {
    margin-top: 0;
}
</style>
