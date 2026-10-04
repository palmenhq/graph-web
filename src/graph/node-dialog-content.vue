<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
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

    <Spinner v-if="edgesQuery.isPending" />

    <div v-else-if="edgesQuery.isError">error</div>

    <div v-else-if="edgeRows.length === 0"><em>No edges</em></div>

    <ul v-else>
      <li v-for="row in edgeRows" :key="row.edge.id">
        {{ row.relationship ?? '?' }}
        <RouterLink
          v-if="row.otherNode"
          :to="`/w/${workspaceId}/nodes/${row.otherNode.id}`"
          >{{ row.otherNode.title }}</RouterLink
        >
        <em v-else>{{ row.otherNodeId }}</em>
      </li>
    </ul>

    <div v-if="newEdgeVisible" class="sub-form">
      <NewEdgeForm
        :node="node"
        :edge-types="edgeTypes"
        @success="newEdgeVisible = false"
      />
    </div>
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
        <Card>
          <template #content>
            <NoteBody :body="note.body" :nodes="nodes" />
          </template>
        </Card>
      </li>
    </ul>
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

.sub-form {
  padding-top: 1rem;
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
