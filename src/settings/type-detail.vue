<script setup lang="ts">
defineProps<{
  label: string
  labelFor?: string
}>()
</script>

<template>
  <div class="type-detail">
    <label v-if="labelFor" class="detail-label" :for="labelFor">
      {{ label }}
    </label>
    <span v-else class="detail-label">{{ label }}</span>
    <div class="detail-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.type-detail {
  display: grid;
  grid-template-columns: 9rem minmax(0, 40rem);
  column-gap: 1rem;
  align-items: start;
}

.detail-label {
  color: var(--p-text-muted-color);
  font-size: 0.875rem;
  font-weight: 500;
  padding-top: 0.25rem;
}

.detail-content {
  min-width: 0;
}

@media (max-width: 640px) {
  .type-detail {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 0.25rem;
  }

  .detail-label {
    padding-top: 0;
  }
}
</style>
