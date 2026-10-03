<script setup lang="ts">
defineProps<{
  back?: {
    to: string
    label: string
  }
}>()
</script>

<template>
  <div class="page-header">
    <div class="header">
      <div class="breadcrumb" v-if="!!back">
        <RouterLink :to="back.to">&lsaquo; {{ back.label }}</RouterLink>
      </div>

      <slot name="header" />
    </div>

    <div class="actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-bottom: 2rem;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.actions {
  display: flex;
  align-items: center;
}
</style>
