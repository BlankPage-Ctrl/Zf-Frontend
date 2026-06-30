<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppTitle from '@/components/AppTitle.vue'
import { useAppearanceStore } from '@/stores/appearance'

onMounted(() => {
  useAppearanceStore().load()
})
</script>

<template>
  <div class="app-shell">
    <AppTitle />
    <RouterView v-slot="{ Component }">
      <div class="router-view">
        <component :is="Component" />
      </div>
    </RouterView>
  </div>
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
