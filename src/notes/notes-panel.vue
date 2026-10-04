<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { JSONContent } from '@tiptap/core'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient, url } from '../api'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import type { Node } from '../api/use-nodes-query.ts'
import {
  type NewNote,
  type Note,
  extractMentions,
  isEmptyNoteBody,
  useNotesQuery,
} from '../api/use-notes-query.ts'
import Spinner from '../design/spinner.vue'
import NoteEditor from './note-editor.vue'
import NoteBody from './note-body.vue'

defineProps<{
  nodes: Node[]
}>()

const workspaceId = useWorkspaceId()

const notesQuery = reactive(useNotesQuery())

const notes = computed<Note[]>(() => notesQuery.data?.items ?? [])

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
    },
  }),
)

const submit = () => {
  if (!noteBody.value || !canSubmit.value) {
    return
  }

  createNoteMutation.mutate({
    body: noteBody.value,
    mentions: extractMentions(noteBody.value),
  })
}
</script>

<template>
  <Panel header="Notes">
    <form class="note-form" @submit.prevent="submit">
      <NoteEditor
        ref="editorRef"
        v-model="noteBody"
        :nodes="nodes"
        placeholder="Write a note, use @ to mention a node"
      />

      <div v-if="createNoteMutation.isError" class="note-error">
        Could not save note
      </div>

      <div>
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

    <Spinner v-if="notesQuery.isPending" />

    <div v-else-if="notesQuery.isError">error</div>

    <div v-else-if="notes.length === 0"><em>No notes yet</em></div>

    <ul v-else class="note-list">
      <li v-for="note in notes" :key="note.id">
        <Card>
          <template #content>
            <NoteBody :body="note.body" :nodes="nodes" />
          </template>
        </Card>
      </li>
    </ul>
  </Panel>
</template>

<style scoped>
.note-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 1rem;
}

.note-error {
  color: var(--p-red-500);
}

.note-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
