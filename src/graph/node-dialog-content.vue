<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
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
    : edge.reverseRelationshipTitle
  if (
    window.confirm(`Delete edge "${relationshipTitle ?? '?'} ${otherTitle}"?`)
  ) {
    deleteEdgeMutation.mutate(edge.id)
  }
}

const deleteNodeMutation = reactive(
  useMutation({
    mutationKey: ['nodes', 'delete'],
    mutationFn: (id: string) =>
      apiClient.post(url`/workspaces/${workspaceId}/graph/nodes/delete`, {
        id,
      }),
    onSuccess: () => {
      props.onClose?.()
      queryClient.invalidateQueries({ queryKey: ['w', workspaceId, 'nodes'] })
      queryClient.invalidateQueries({ queryKey: ['w', workspaceId, 'edges'] })
      queryClient.invalidateQueries({ queryKey: ['w', workspaceId, 'notes'] })
    },
  }),
)

const deleteNode = () => {
  const title = node.value?.title ?? props.nodeId
  if (window.confirm(`Delete node "${title}" and all its edges?`)) {
    deleteNodeMutation.mutate(props.nodeId)
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    dismissable-mask
    style="
      width: 40rem;
      max-width: calc(100vw - 2rem);
      max-height: calc(100vh - 2rem);
    "
  >
    <template #header>
      <NodeTitleEditor v-if="node" :node="node" />
    </template>

    <Spinner v-if="nodeQuery.isPending" />

    <div v-else-if="nodeQuery.isError">error</div>

    <div v-else-if="!node"><em>Node not found</em></div>

    <template v-else>
      <div v-if="nodeTypesQuery.data?.items" class="section-node-type">
        {{ getNodeTypeTitle(nodeTypesQuery.data.items, node.nodeTypeId) }}
      </div>

      <NodeProperties :node="node" />

      <section class="section">
        <div class="section-header">
          <h3>Edges</h3>
          <Button
            size="small"
            :disabled="edgeTypesQuery.isPending"
            @click="newEdgeVisible = !newEdgeVisible"
          >
            {{ newEdgeVisible ? 'Cancel' : 'Add Edge' }}
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

        <div v-else-if="edges.length === 0"><em>No edges</em></div>

        <ul v-else class="edge-list">
          <li v-for="edge in edges" :key="edge.id" class="edge-row">
            <span v-if="edge.fromNode === node.id">
              {{ edge.relationshipTitle ?? '?' }}
              <RouterLink
                v-if="edge.toNodeTitle"
                :to="`/w/${workspaceId}/nodes/${edge.toNode}`"
                >{{ edge.toNodeTitle }}</RouterLink
              >
              <em v-else>{{ edge.toNode }}</em>
            </span>
            <span v-else>
              {{ edge.reverseRelationshipTitle ?? '?' }}
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

        <div v-if="deleteEdgeMutation.isError">error deleting edge</div>
      </section>

      <section class="section">
        <div class="section-header">
          <h3>Notes</h3>
        </div>

        <Spinner v-if="notesQuery.isPending" />

        <div v-else-if="notesQuery.isError">error</div>

        <div v-else-if="notes.length === 0">
          <em>No notes mention this node</em>
        </div>

        <ul v-else class="note-list">
          <li v-for="note in notes" :key="note.id">
            <NoteBody :body="note.body" :created-at="note.createdAt" />
          </li>
        </ul>
      </section>

      <section class="danger-zone">
        <div v-if="deleteNodeMutation.isError">error deleting node</div>
        <Button
          severity="danger"
          outlined
          :loading="deleteNodeMutation.isPending"
          @click="deleteNode"
          size="small"
        >
          Delete Node
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
</style>
