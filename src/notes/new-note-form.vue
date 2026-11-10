<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { JSONContent } from '@tiptap/core'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient, url } from '../api'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import {
  type NewNote,
  type Note,
  extractMentions,
} from '../api/use-notes-query.ts'
import Spinner from '../design/spinner.vue'
import NoteEditor from '../design/rich-text-editor.vue'
import { isEmptyNoteBody } from '../design/rich-text-utils.ts'

const props = defineProps<{
  nodeId: string
}>()

const emit = defineEmits<{
  success: []
}>()

const workspaceId = useWorkspaceId()

const noteBody = ref<JSONContent | null>(null)
const editorRef = ref<InstanceType<typeof NoteEditor> | null>(null)

const canSubmit = computed(
  () => !!noteBody.value && !isEmptyNoteBody(noteBody.value),
)

const queryClient = useQueryClient()
const createNoteMutation = reactive(
  useMutation({
    mutationKey: ['notes', 'new'],
    mutationFn: (newNote: NewNote) =>
      apiClient
        .post<Note>(url`/workspaces/${workspaceId}/notes/create`, newNote)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['w', workspaceId, 'notes'],
      })
      editorRef.value?.clear()
      noteBody.value = null
      emit('success')
    },
  }),
)

const submit = () => {
  if (!noteBody.value || !canSubmit.value) {
    return
  }

  createNoteMutation.mutate({
    nodeId: props.nodeId,
    body: noteBody.value,
    mentions: extractMentions(noteBody.value),
  })
}
</script>

<template>
  <form class="note-form" @submit.prevent="submit">
    <NoteEditor
      ref="editorRef"
      v-model="noteBody"
      placeholder="Write a note, use @ to mention..."
    />

    <div v-if="createNoteMutation.isError" class="note-error">
      Could not save note
    </div>

    <div style="display: flex; justify-content: flex-end">
      <Button
        type="submit"
        :disabled="!canSubmit"
        :loading="createNoteMutation.isPending"
      >
        <Spinner v-if="createNoteMutation.isPending" />

        Add Note
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

.note-error {
  color: var(--p-red-500);
}
</style>