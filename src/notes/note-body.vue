<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { JSONContent } from '@tiptap/core'
import { format, formatDistance, isValid, parseISO } from 'date-fns'
import RichText from '../design/rich-text.vue'
import type { NoteNode } from '../api/use-notes-query.ts'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import OiPencil from '@openvue/openicons-vue/icons/OiPencil'

const props = defineProps<{
  body: JSONContent | string
  createdAt?: string
  updatedAt?: string | null
  node?: NoteNode | null
  editable?: boolean
}>()

const emit = defineEmits<{
  edit: []
}>()

const workspaceId = useWorkspaceId()

// Refresh the relative timestamp every minute
const now = ref(new Date())
const nowTimer = window.setInterval(() => {
  now.value = new Date()
}, 60_000)
onBeforeUnmount(() => window.clearInterval(nowTimer))

const createdAtDate = computed(() => {
  if (!props.createdAt) {
    return null
  }
  const date = parseISO(props.createdAt)
  return isValid(date) ? date : null
})

const createdAtRelative = computed(() =>
  createdAtDate.value
    ? formatDistance(createdAtDate.value, now.value, { addSuffix: true })
    : null,
)

const updatedAtDate = computed(() => {
  if (!props.updatedAt || props.updatedAt === props.createdAt) {
    return null
  }
  const date = parseISO(props.updatedAt)
  return isValid(date) ? date : null
})

const updatedAtRelative = computed(() =>
  updatedAtDate.value
    ? formatDistance(updatedAtDate.value, now.value, { addSuffix: true })
    : null,
)
</script>

<template>
  <Card class="card">
    <template #content>
      <div v-if="node" class="note-origin">
        Note on
        <RouterLink :to="`/w/${workspaceId}/nodes/${node.id}`">{{
          node.title
        }}</RouterLink>
      </div>
      <RichText :content="body" />
      <div class="note-footer">
        <time
          v-if="createdAtDate"
          class="note-created-at"
          :datetime="createdAtDate.toISOString()"
          :title="format(createdAtDate, 'PPpp')"
        >
          {{ createdAtRelative }}
        </time>
        <time
          v-if="updatedAtDate"
          class="note-updated-at"
          :datetime="updatedAtDate.toISOString()"
          :title="format(updatedAtDate, 'PPpp')"
        >
          (edited {{ updatedAtRelative }})
        </time>
        <Button
          v-if="editable"
          type="button"
          size="small"
          text
          rounded
          severity="secondary"
          class="note-edit"
          aria-label="Edit note"
          title="Edit note"
          @click="emit('edit')"
        >
          <OiPencil />
        </Button>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.card {
  border: 1px solid var(--p-content-border-color);
}

.note-origin {
  padding-bottom: 0.5rem;
  color: var(--p-text-muted-color);
  font-size: 0.875rem;
}

.note-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.5rem;
}

.note-edit {
  margin-left: auto;
}

.note-created-at,
.note-updated-at {
  display: block;
  color: var(--p-text-muted-color);
  font-size: 0.875rem;
}

.note-updated-at {
  font-style: italic;
}
</style>
