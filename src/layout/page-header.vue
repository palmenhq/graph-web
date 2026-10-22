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
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  padding-bottom: 2rem;
  gap: 1rem;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1 1 auto;
  min-width: 0;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 1rem;
  flex: 0 1 auto;
  margin-left: auto;
}

@media (max-width: 640px) {
  .page-header {
    padding-bottom: 1rem;
    gap: 0.75rem;
  }

  .actions {
    gap: 0.5rem;
  }
}
</style>
