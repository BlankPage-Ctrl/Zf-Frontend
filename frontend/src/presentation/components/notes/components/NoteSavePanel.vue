<script setup lang="ts">
import { computed } from 'vue'
import { pButton } from '@/presentation/components/button'

const props = defineProps<{
    dirty: boolean
    saving: boolean
    savedAt: string | null
}>()

const emit = defineEmits<{
    save: []
}>()

const statusText = computed(() => {
    if (props.saving) return 'Saving...'
    if (props.dirty) return 'Unsaved changes'
    if (props.savedAt) return 'Saved'
    return ''
})
</script>

<template>
    <div class="note-save-panel">
        <span class="note-save-panel__status" :class="{ 'note-save-panel__status--dirty': dirty }">
            {{ statusText }}
        </span>
        <pButton
            :schema="{
                variant: 'solid',
                size: 'sm',
                radius: 'md',
                label: 'Save',
                loading: saving,
            }"
            @click="emit('save')"
        />
    </div>
</template>
