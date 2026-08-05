<script setup lang="ts">
import type { Priority } from '@/core/entities'

defineProps<{
    value: string
}>()

const emit = defineEmits<{
    change: [priority: Priority]
}>()

const OPTIONS: Priority[] = ['low', 'medium', 'high', 'critical']

function select(p: Priority) {
    emit('change', p)
}
</script>

<template>
    <div class="note-priority">
        <span class="note-priority__label">Priority</span>
        <div class="note-priority__seg">
            <button
                v-for="p in OPTIONS"
                :key="p"
                type="button"
                class="note-priority__opt"
                :class="[
                    `note-priority__opt--${p}`,
                    { 'note-priority__opt--active': value === p },
                ]"
                @click="select(p)"
            >
                {{ p }}
            </button>
        </div>
    </div>
</template>
