<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DataPartSchema } from '../../types/schema'
import { resolveDataPartSchema } from '../../resolver/resolvePartsSchema'

const props = defineProps<{
    schema: DataPartSchema
}>()

const expanded = ref(false)
const resolved = computed(() => resolveDataPartSchema(props.schema))

function toggle() {
    expanded.value = !expanded.value
}
</script>

<template>
    <div class="data-part">
        <button class="data-toggle" @click="toggle" type="button">
            <span v-text="expanded ? '\u25BC' : '\u25B6'"></span>
            <span class="data-label">{{ resolved.type }}</span>
            <span class="data-badge">data</span>
        </button>
        <div v-show="expanded" class="data-content">
            <pre class="data-json">{{ JSON.stringify(resolved.data, null, 2) }}</pre>
        </div>
    </div>
</template>
