<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient, url } from '../api'
import Spinner from '../design/spinner.vue'
import {
  type EdgeType,
  useEdgeTypesQuery,
} from '../api/use-edge-types-query.ts'
import { type Edge, useNodeEdgesQuery } from '../api/use-node-edges-query.ts'
import NewEdgeForm from './new-edge-form.vue'
import NodeProperties from './node-properties.vue'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import { type Note, useNodeNotesQuery } from '../api/use-notes-query.ts'
import NoteBody from '../notes/note-body.vue'
import NewNoteForm from '../notes/new-note-form.vue'
import EditNoteForm from '../notes/edit-note-form.vue'
import { getNodeTypeTitle } from './helpers.ts'
import { useNodeTypesQuery } from '../api/use-node-types-query.ts'
import { useNodeQuery } from '../api/use-node-query.ts'
import NodeTitleEditor from './node-title-editor.vue'

const props = defineProps<{
  nodeId: string
  onClose?: () => void
}>()

const visible = computed({
  get: () => true,
  set: (value: boolean) => {
    if (!value) {
      props.onClose?.()
    }
  },
})

const workspaceId = useWorkspaceId()

const nodePropertiesRef = ref<InstanceType<typeof NodeProperties> | null>(null)
const newNoteFormRef = ref<InstanceType<typeof NewNoteForm> | null>(null)
const editNoteFormRefs = ref<InstanceType<typeof EditNoteForm>[]>([])
const editingNoteId = ref<string | null>(null)
const skipUnsavedChangesPrompt = ref(false)

const hasUnsavedChanges = computed(
  () =>
    !!nodePropertiesRef.value?.hasUnsavedChanges ||
    !!newNoteFormRef.value?.hasUnsavedChanges ||
    editNoteFormRefs.value.some((form) => form?.hasUnsavedChanges),
)

const confirmDiscardChanges = () => {
  if (skipUnsavedChangesPrompt.value) {
    skipUnsavedChangesPrompt.value = false
    return true
  }

  return (
    !hasUnsavedChanges.value ||
    window.confirm('You have unsaved changes. Are you sure you want to leave?')
  )
}

onBeforeRouteLeave(confirmDiscardChanges)
onBeforeRouteUpdate(confirmDiscardChanges)

const warnBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!hasUnsavedChanges.value) {
    return
  }

  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => window.addEventListener('beforeunload', warnBeforeUnload))
onBeforeUnmount(() =>
  window.removeEventListener('beforeunload', warnBeforeUnload),
)

const nodeQuery = reactive(useNodeQuery(props.nodeId))
const node = computed(() => nodeQuery.data)

const edgesQuery = reactive(useNodeEdgesQuery(props.nodeId))
const edgeTypesQuery = reactive(useEdgeTypesQuery())
const nodeTypesQuery = reactive(useNodeTypesQuery())
const notesQuery = reactive(useNodeNotesQuery(props.nodeId))

const edges = computed<Edge[]>(() => edgesQuery.data?.items ?? [])
const edgeTypes = computed<EdgeType[]>(() => edgeTypesQuery.data?.items ?? [])
const notes = computed<Note[]>(() => notesQuery.data?.items ?? [])

const newEdgeVisible = ref(false)

const startEditingNote = (note: Note) => {
  const hasNoteChanges = editNoteFormRefs.value.some(
    (form) => form?.hasUnsavedChanges,
  )
  if (
    editingNoteId.value &&
    editingNoteId.value !== note.id &&
    hasNoteChanges &&
    !window.confirm('Discard your changes to the note you are editing?')
  ) {
    return
  }
  editingNoteId.value = note.id
}

const queryClient = useQueryClient()

const deleteEdgeMutation = reactive(
  useMutation({
    mutationKey: ['edges', 'delete'],
    mutationFn: (id: string) =>
      apiClient.post(url`/workspaces/${workspaceId}/graph/edges/delete`, {
        id,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['w', workspaceId, 'edges'],
      }),
  }),
)

const deleteEdge = (edge: Edge) => {
  const outgoing = edge.fromNode === props.nodeId
  const otherTitle = outgoing ? edge.toNodeTitle : edge.fromNodeTitle
  const relationshipTitle = outgoing
    ? edge.relationshipTitle
    : (edge.reverseRelationshipTitle ?? edge.relationshipTitle)
  if (
    window.confirm(
      `Delete connection "${relationshipTitle ?? '?'} ${otherTitle}"?`,
    )
  ) {
    deleteEdgeMutation.mutate(edge.id)
  }
}

const nodeTypeTitle = computed(() =>
  node.value && nodeTypesQuery.data?.items
    ? getNodeTypeTitle(nodeTypesQuery.data.items, node.value.nodeTypeId)
    : null,
)

const deleteNodeMutation = reactive(
  useMutation({
    mutationKey: ['nodes', 'delete'],
    mutationFn: (id: string) =>
      apiClient.post(url`/workspaces/${workspaceId}/graph/nodes/delete`, {
        id,
      }),
    onSuccess: () => {
      skipUnsavedChangesPrompt.value = !!props.onClose
      props.onClose?.()
      queryClient.invalidateQueries({ queryKey: ['w', workspaceId, 'nodes'] })
      queryClient.invalidateQueries({ queryKey: ['w', workspaceId, 'edges'] })
      queryClient.invalidateQueries({ queryKey: ['w', workspaceId, 'notes'] })
    },
  }),
)

const deleteNode = () => {
  const title = node.value?.title ?? props.nodeId
  const typeLabel = nodeTypeTitle.value
    ? nodeTypeTitle.value.toLowerCase()
    : 'item'
  if (
    window.confirm(`Delete ${typeLabel} "${title}" and all its connections?`)
  ) {
    deleteNodeMutation.mutate(props.nodeId)
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    dismissable-mask
    :draggable="false"
    class="node-dialog"
  >
    <template #header>
      <NodeTitleEditor v-if="node" :node="node" />
    </template>

    <Spinner v-if="nodeQuery.isPending" />

    <div v-else-if="nodeQuery.isError">error</div>

    <div v-else-if="!node"><em>Item not found</em></div>

    <template v-else>
      <div v-if="nodeTypesQuery.data?.items" class="section-node-type">
        {{ getNodeTypeTitle(nodeTypesQuery.data.items, node.nodeTypeId) }}
      </div>

      <NodeProperties ref="nodePropertiesRef" :node="node" />

      <section class="section">
        <div class="section-header">
          <h3>Connections</h3>
          <Button
            size="small"
            :disabled="edgeTypesQuery.isPending"
            :outlined="newEdgeVisible"
            @click="newEdgeVisible = !newEdgeVisible"
          >
            {{ newEdgeVisible ? 'Cancel' : 'Add Connection' }}
          </Button>
        </div>

        <div v-if="newEdgeVisible" class="sub-form">
          <NewEdgeForm
            :node="node"
            :edge-types="edgeTypes"
            @success="newEdgeVisible = false"
          />
        </div>

        <Spinner v-if="edgesQuery.isPending" />

        <div v-else-if="edgesQuery.isError">error</div>

        <div v-else-if="edges.length === 0"><em>No connections</em></div>

        <ul v-else class="edge-list">
          <li v-for="edge in edges" :key="edge.id" class="edge-row">
            <span v-if="edge.fromNode === node.id">
              {{ edge.relationshipTitle }}
              <RouterLink
                v-if="edge.toNodeTitle"
                :to="`/w/${workspaceId}/nodes/${edge.toNode}`"
                >{{ edge.toNodeTitle }}</RouterLink
              >
              <em v-else>{{ edge.toNode }}</em>
            </span>
            <span v-else>
              {{ edge.reverseRelationshipTitle ?? edge.relationshipTitle }}
              <RouterLink
                v-if="edge.fromNode"
                :to="`/w/${workspaceId}/nodes/${edge.fromNode}`"
                >{{ edge.fromNodeTitle }}</RouterLink
              >
              <em v-else>{{ edge.fromNode }}</em>
            </span>

            <Button
              size="small"
              severity="danger"
              text
              :loading="
                deleteEdgeMutation.isPending &&
                deleteEdgeMutation.variables === edge.id
              "
              :disabled="deleteEdgeMutation.isPending"
              @click="deleteEdge(edge)"
            >
              Delete
            </Button>
          </li>
        </ul>

        <div v-if="deleteEdgeMutation.isError">error deleting connection</div>
      </section>

      <section class="section">
        <div class="section-header">
          <h3>Notes</h3>
        </div>

        <div class="section">
          <NewNoteForm ref="newNoteFormRef" :node-id="node.id" />
        </div>

        <Spinner v-if="notesQuery.isPending" />

        <div v-else-if="notesQuery.isError">error</div>

        <div v-else-if="notes.length === 0">
          <em>No notes yet</em>
        </div>

        <ul v-else class="note-list">
          <li v-for="note in notes" :key="note.id">
            <EditNoteForm
              v-if="editingNoteId === note.id"
              ref="editNoteFormRefs"
              :note="note"
              @success="editingNoteId = null"
              @cancel="editingNoteId = null"
            />
            <NoteBody
              v-else
              :body="note.body"
              :created-at="note.createdAt"
              :updated-at="note.updatedAt"
              :node="note.node?.id !== node.id ? note.node : null"
              editable
              @edit="startEditingNote(note)"
            />
          </li>
        </ul>
      </section>

      <section class="danger-zone">
        <div v-if="deleteNodeMutation.isError">
          error deleting {{ (nodeTypeTitle ?? 'item').toLowerCase() }}
        </div>
        <Button
          severity="danger"
          outlined
          :loading="deleteNodeMutation.isPending"
          @click="deleteNode"
          size="small"
        >
          Delete {{ nodeTypeTitle ?? 'Item' }}
        </Button>
      </section>
    </template>
  </Dialog>
</template>

<style scoped>
.section {
  padding-bottom: 1.5rem;
}

.section-node-type {
  color: var(--p-text-color-secondary);
  padding-bottom: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
}

.edge-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.edge-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.danger-zone {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
}

.sub-form {
  padding: 1rem;
  margin: 1rem 0;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.5rem;
}

.note-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (max-width: 640px) {
  .sub-form {
    padding: 0;
    margin: 0.5rem 0 1rem;
    border: none;
    border-radius: 0;
  }

  .edge-list {
    gap: 0.5rem;
  }
}
</style>

<!-- Not scoped: the dialog is teleported to the body -->
<style>
body .node-dialog {
  width: 40rem;
  max-width: calc(100vw - 2rem);
  max-height: calc(100vh - 2rem);
}

@media (max-width: 640px) {
  body .node-dialog {
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    border: none;
    border-radius: 0;
  }
}
</style>
