<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { JSONContent } from '@tiptap/core'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient, url } from '../api'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import {
  type Note,
  type UpdateNote,
  extractMentions,
} from '../api/use-notes-query.ts'
import Spinner from '../design/spinner.vue'
import NoteEditor from '../design/rich-text-editor.vue'
import { isEmptyNoteBody } from '../design/rich-text-utils.ts'

const props = defineProps<{
  note: Pick<Note, 'id' | 'body'>
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const workspaceId = useWorkspaceId()

const cloneBody = (): JSONContent => JSON.parse(JSON.stringify(props.note.body))

const noteBody = ref<JSONContent | null>(cloneBody())

const hasUnsavedChanges = computed(
  () => JSON.stringify(noteBody.value) !== JSON.stringify(props.note.body),
)

const canSubmit = computed(
  () =>
    !!noteBody.value &&
    !isEmptyNoteBody(noteBody.value) &&
    hasUnsavedChanges.value,
)

defineExpose({ hasUnsavedChanges })

const queryClient = useQueryClient()
const updateNoteMutation = reactive(
  useMutation({
    mutationKey: ['notes', 'update'],
    // NOTE: the backend endpoint is not implemented yet, path and payload
    // are assumed from the existing conventions and may need adjusting
    mutationFn: (note: UpdateNote) =>
      apiClient.post(url`/workspaces/${workspaceId}/notes/update`, note),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['w', workspaceId, 'notes'],
      })
      emit('success')
    },
  }),
)

const submit = () => {
  if (!noteBody.value || !canSubmit.value) {
    return
  }

  updateNoteMutation.mutate({
    id: props.note.id,
    body: noteBody.value,
    mentions: extractMentions(noteBody.value),
  })
}

const cancel = () => {
  if (
    hasUnsavedChanges.value &&
    !window.confirm('Discard your changes to this note?')
  ) {
    return
  }
  emit('cancel')
}
</script>

<template>
  <form class="note-form" @submit.prevent="submit">
    <NoteEditor
      v-model="noteBody"
      autofocus="end"
      placeholder="Write a note, use @ to mention..."
    />

    <div v-if="updateNoteMutation.isError" class="note-error">
      Could not save note
    </div>

    <div class="note-actions">
      <Button
        type="button"
        size="small"
        severity="secondary"
        text
        :disabled="updateNoteMutation.isPending"
        @click="cancel"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        size="small"
        :disabled="!canSubmit"
        :loading="updateNoteMutation.isPending"
      >
        <Spinner v-if="updateNoteMutation.isPending" />

        Save
      </Button>
    </div>
  </form>
</template>

<style scoped>
.note-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.note-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.note-error {
  color: var(--p-red-500);
}
</style>
