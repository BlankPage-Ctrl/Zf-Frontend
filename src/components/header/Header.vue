<script setup lang="ts">
import type { HeaderSchema } from './types'
import HeaderTitle from './components/HeaderTitle.vue'
import HeaderActions from './components/HeaderActions.vue'

const props = defineProps<{
    schema: HeaderSchema
}>()

const widthClass = props.schema.width === 'full' ? 'header--full' : 'header--auto'
const heightClass = `header--h-${props.schema.height ?? 'md'}`
const paddingClass = `header--p-${props.schema.padding ?? 'md'}`
const borderClass = props.schema.border ? 'header--border' : ''
</script>

<template>
    <div
        class="header"
        :class="[widthClass, heightClass, paddingClass, borderClass, props.schema.class]"
    >
        <HeaderTitle :title="props.schema.title" :subtitle="props.schema.subtitle" />
        <HeaderActions v-if="props.schema.actions?.length" :actions="props.schema.actions" />
    </div>
</template>

<style scoped>
.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
}

.header--auto {
    width: auto;
}

.header--full {
    width: 100%;
}

.header--h-sm {
    min-height: 32px;
}

.header--h-md {
    min-height: 40px;
}

.header--h-lg {
    min-height: 48px;
}

.header--p-none {
    padding: 0;
}

.header--p-sm {
    padding: 6px 8px;
}

.header--p-md {
    padding: 10px 12px;
}

.header--p-lg {
    padding: 14px 16px;
}

.header--border {
    border-bottom: 1px solid rgba(var(--third-color), 0.12);
}
</style>
