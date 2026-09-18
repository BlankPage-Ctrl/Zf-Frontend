<script setup lang="ts">
import { Header } from '@/presentation/components/header'
import type { ResolvedSettingsTab } from './types/resolved'
import ProviderSection from './components/ProviderSection.vue'
import AppearanceSection from './components/AppearanceSection.vue'
import ThemeSection from './components/ThemeSection.vue'
import TerminalSection from './components/TerminalSection.vue'
import InsightSection from './components/InsightSection.vue'

defineProps<{
    resolved: ResolvedSettingsTab
}>()
</script>

<template>
    <div class="settings-tab-content">
        <section class="settings-section">
            <Header
                :schema="{
                    title: 'Model and Provider',
                    height: 'auto',
                    padding: 'none',
                    border: true,
                }"
            />
            <ProviderSection :resolved="resolved.provider" />
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
            <AppearanceSection :resolved="resolved.appearance" />
            <ThemeSection :resolved="resolved.theme" />
        </section>

        <section class="settings-section section-terminal">
            <Header
                :schema="{
                    title: 'Terminal',
                    height: 'auto',
                    padding: 'none',
                    border: true,
                }"
            />
            <TerminalSection :resolved="resolved.terminal" />
        </section>

        <section class="settings-section section-insight">
            <Header
                :schema="{
                    title: 'Insight',
                    height: 'auto',
                    padding: 'none',
                    border: true,
                }"
            />
            <InsightSection :resolved="resolved.insight" />
        </section>
    </div>
</template>

<style src="./styles/index.css"></style>
