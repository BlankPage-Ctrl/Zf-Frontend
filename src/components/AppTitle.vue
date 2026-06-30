<script setup lang="ts">
</script>

<template>
  <div class="app-title">
    <span class="app-title-text">Zf</span>
  </div>
</template>

<style scoped>
.app-title {
  height: 30px;
  display: flex;
  align-items: center;
  padding-left: 12px;
  background: rgb(var(--secondary-color));
  border-bottom: 1px solid rgba(var(--third-color), 0.12);
  flex-shrink: 0;
}

.app-title-text {
  font-family: var(--font-serif);
  font-size: 13px;
  font-weight: 700;
  color: rgb(var(--text-color));
  opacity: 0.55;
  letter-spacing: -0.01em;
  user-select: none;
  -webkit-app-region: no-drag;
}
</style>
