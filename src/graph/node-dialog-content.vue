<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient, url } from '../api'
import Spinner from '../design/spinner.vue'
import { type Node, useNodesQuery } from '../api/use-nodes-query.ts'
import {
  type EdgeType,
  useEdgeTypesQuery,
} from '../api/use-edge-types-query.ts'
import { type Edge, useNodeEdgesQuery } from '../api/use-node-edges-query.ts'
import NewEdgeForm from './new-edge-form.vue'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import { type Note, useNodeNotesQuery } from '../api/use-notes-query.ts'
import NoteBody from '../notes/note-body.vue'

const props = defineProps<{
  node: Node
  onDeleted?: () => void
}>()

const workspaceId = useWorkspaceId()

const edgesQuery = reactive(useNodeEdgesQuery(props.node.id))
const edgeTypesQuery = reactive(useEdgeTypesQuery())
const nodesQuery = reactive(useNodesQuery())
const notesQuery = reactive(useNodeNotesQuery(props.node.id))

const edges = computed<Edge[]>(() => edgesQuery.data?.items ?? [])
const edgeTypes = computed<EdgeType[]>(() => edgeTypesQuery.data?.items ?? [])
const nodes = computed<Node[]>(() => nodesQuery.data?.items ?? [])
const notes = computed<Note[]>(() => notesQuery.data?.items ?? [])

const edgeRows = computed(() =>
  edges.value.map((edge) => {
    const outgoing = edge.fromNode === props.node.id
    const otherNodeId = outgoing ? edge.toNode : edge.fromNode
    return {
      edge,
      relationship: outgoing
        ? edge?.relationshipTitle
        : edge?.reverseRelationshipTitle,
      otherNodeId,
      otherNode: nodes.value.find((n) => n.id === otherNodeId),
    }
  }),
)

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

const deleteEdge = (row: (typeof edgeRows.value)[number]) => {
  const otherTitle = row.otherNode?.title ?? row.otherNodeId
  if (
    window.confirm(`Delete edge "${row.relationship ?? '?'} ${otherTitle}"?`)
  ) {
    deleteEdgeMutation.mutate(row.edge.id)
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
      props.onDeleted?.()
      queryClient.invalidateQueries({ queryKey: ['w', workspaceId, 'nodes'] })
      queryClient.invalidateQueries({ queryKey: ['w', workspaceId, 'edges'] })
      queryClient.invalidateQueries({ queryKey: ['w', workspaceId, 'notes'] })
    },
  }),
)

const deleteNode = () => {
  if (window.confirm(`Delete node "${props.node.title}" and all its edges?`)) {
    deleteNodeMutation.mutate(props.node.id)
  }
}
</script>

<template>
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

    <div v-else-if="edgeRows.length === 0"><em>No edges</em></div>

    <ul v-else class="edge-list">
      <li v-for="row in edgeRows" :key="row.edge.id" class="edge-row">
        <span>
          {{ row.relationship ?? '?' }}
          <RouterLink
            v-if="row.otherNode"
            :to="`/w/${workspaceId}/nodes/${row.otherNode.id}`"
            >{{ row.otherNode.title }}</RouterLink
          >
          <em v-else>{{ row.otherNodeId }}</em>
        </span>
        <Button
          size="small"
          severity="danger"
          text
          :loading="
            deleteEdgeMutation.isPending &&
            deleteEdgeMutation.variables === row.edge.id
          "
          :disabled="deleteEdgeMutation.isPending"
          @click="deleteEdge(row)"
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
        <NoteBody :body="note.body" :nodes="nodes" />
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

<style scoped>
.section {
  padding-bottom: 1.5rem;
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
