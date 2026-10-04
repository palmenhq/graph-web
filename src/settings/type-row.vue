<script setup lang="ts">
defineProps<{
  editing: boolean
  saving: boolean
  deleting: boolean
  saveError: boolean
  deleteError: boolean
  canSave: boolean
}>()

const emit = defineEmits<{
  edit: []
  save: []
  cancel: []
  delete: []
}>()
</script>

<template>
  <div class="type-row">
    <form
      v-if="editing"
      class="row-content"
      @submit.prevent="emit('save')"
      @keydown.esc.stop.prevent="emit('cancel')"
    >
      <slot name="fields" />
      <Button type="submit" size="small" :loading="saving" :disabled="!canSave">
        Save
      </Button>
      <Button
        type="button"
        size="small"
        severity="secondary"
        text
        :disabled="saving"
        @click="emit('cancel')"
      >
        Cancel
      </Button>
    </form>

    <div v-else class="row-content">
      <span class="row-title">
        <slot name="title" />
      </span>
      <Button
        type="button"
        size="small"
        severity="secondary"
        text
        @click="emit('edit')"
      >
        Edit
      </Button>
      <Button
        type="button"
        size="small"
        severity="danger"
        text
        :loading="deleting"
        @click="emit('delete')"
      >
        Delete
      </Button>
    </div>

    <span v-if="saveError" class="error">error saving</span>
    <span v-if="deleteError" class="error">error deleting</span>

    <slot />
  </div>
</template>

<style scoped>
.type-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 0;

  &:not(:last-child) {
    border-bottom: 1px solid var(--p-content-border-color);
  }
}

.row-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.row-title,
:slotted(.row-input) {
  flex: 1;
  min-width: 0;
}

.error {
  color: var(--p-red-500);
  font-size: 0.875rem;
}
</style>
