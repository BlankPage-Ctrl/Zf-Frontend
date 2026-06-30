<script setup lang="ts">
defineProps<{
    label?: string
}>()
</script>

<template>
    <div class="step-indicator">
        <!-- <span class="step-dot"></span> -->
        <span class="step-label" v-if="label">{{ label }}</span>
    </div>
</template>

<style scoped>
.step-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
}

.step-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(var(--third-color), 0.2);
    flex-shrink: 0;
}

.step-label {
    font-size: 12px;
    font-weight: 500;
    opacity: 0.4;
}
</style>
