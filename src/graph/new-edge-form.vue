<script setup lang="ts">
import FormDrawer from '../design/form-drawer.vue'
import FormGroup from '../design/form-group.vue'
import { computed, reactive, ref, watch } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient, url } from '../api'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import type { ApiList } from '../api/api-list.ts'
import type { Node } from '../api/use-nodes-query.ts'
import type { EdgeType } from '../api/use-edge-types-query.ts'
import {
  type NodeType,
  useNodeTypesQuery,
} from '../api/use-node-types-query.ts'
import Spinner from '../design/spinner.vue'
import NewEdgeTypeForm, { type CreatedEdgeType } from './new-edge-type-form.vue'
import InlineNewNodeForm from './inline-new-node-form.vue'

const props = defineProps<{
  node: Node
  edgeTypes: EdgeType[]
  onSuccess?: () => void
}>()

type RelationshipOption = {
  key: string
  label: string
  edgeTypeId: string
  reverse: boolean
}

type CreateNodeOption = {
  create: true
  key: string
  // Display label; must differ from the typed query, otherwise force-selection
  // matches this option on blur and selects it instead of the clicked node
  title: string
  newTitle: string
}

type TargetOption = Node | CreateNodeOption

const isCreateOption = (option: unknown): option is CreateNodeOption =>
  !!option && typeof option === 'object' && 'create' in option

const workspaceId = useWorkspaceId()

const nodeTypesQuery = reactive(useNodeTypesQuery())
// Offer the current node's type first when creating a target node
const nodeTypes = computed<NodeType[]>(() => {
  const items = nodeTypesQuery.data?.items ?? []
  return [
    ...items.filter((t) => t.id === props.node.nodeTypeId),
    ...items.filter((t) => t.id !== props.node.nodeTypeId),
  ]
})

const relationshipOptions = computed<RelationshipOption[]>(() =>
  props.edgeTypes.flatMap((edgeType) => [
    {
      key: `${edgeType.id}-f`,
      label: edgeType.relationshipTitle,
      edgeTypeId: edgeType.id,
      reverse: false,
    },
    {
      key: `${edgeType.id}-r`,
      label: edgeType.reverseRelationshipTitle,
      edgeTypeId: edgeType.id,
      reverse: true,
    },
  ]),
)

const relationship = ref<RelationshipOption | null>(null)
const targetNode = ref<TargetOption | string | null>(null)
const nodeSuggestions = ref<TargetOption[]>([])

const newEdgeTypeVisible = ref(props.edgeTypes.length === 0)
const pendingEdgeType = ref<CreatedEdgeType | null>(null)

const onEdgeTypeCreated = (edgeType: CreatedEdgeType) => {
  pendingEdgeType.value = edgeType
  newEdgeTypeVisible.value = false
}

// Select the freshly created edge type as soon as it shows up in the list
watch(
  [pendingEdgeType, relationshipOptions],
  () => {
    const pending = pendingEdgeType.value
    if (!pending) {
      return
    }

    const created = pending.id
      ? props.edgeTypes.find((edgeType) => edgeType.id === pending.id)
      : [...props.edgeTypes]
          .reverse()
          .find(
            (edgeType) =>
              edgeType.relationshipTitle === pending.relationshipTitle &&
              edgeType.reverseRelationshipTitle ===
                pending.reverseRelationshipTitle,
          )
    const option = relationshipOptions.value.find(
      (o) => o.edgeTypeId === created?.id && !o.reverse,
    )
    if (option) {
      relationship.value = option
      pendingEdgeType.value = null
    }
  },
  { immediate: true },
)

const searchNodes = async (query: string) => {
  const response = await apiClient.get<ApiList<Node>>(
    url`/workspaces/${workspaceId}/graph/nodes/getAll?search=${query}`,
  )
  const nodes = response.data.items.filter((node) => node.id !== props.node.id)

  const title = query.trim()
  const exactMatch = nodes.some(
    (node) => node.title.trim().toLowerCase() === title.toLowerCase(),
  )
  const createOptions: CreateNodeOption[] =
    title && !exactMatch
      ? [
          {
            create: true,
            key: 'create',
            title: `Create “${title}”`,
            newTitle: title,
          },
        ]
      : []

  nodeSuggestions.value = [...nodes, ...createOptions]
}

const selectedTargetNode = computed<Node | null>(() =>
  targetNode.value &&
  typeof targetNode.value === 'object' &&
  !isCreateOption(targetNode.value)
    ? targetNode.value
    : null,
)

const queryClient = useQueryClient()

const newNodeVisible = ref(false)
const newNodeTitle = ref('')

const onTargetSelected = (option: TargetOption) => {
  if (!isCreateOption(option)) {
    return
  }

  // Open the inline form instead of selecting the placeholder option
  targetNode.value = null
  newNodeTitle.value = option.newTitle
  newNodeVisible.value = true
}

const onNodeCreated = (node: Node) => {
  targetNode.value = node
  newNodeVisible.value = false
}

const createEdgeMutation = reactive(
  useMutation({
    mutationKey: ['edges', 'new'],
    mutationFn: (newEdge: {
      edgeTypeId: string
      fromNode: string
      toNode: string
    }) =>
      apiClient.post(
        url`/workspaces/${workspaceId}/graph/edges/create`,
        newEdge,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['w', workspaceId, 'edges'],
      })
      targetNode.value = null
      props.onSuccess?.()
    },
  }),
)

const submit = () => {
  const target = selectedTargetNode.value
  if (!relationship.value || !target) {
    return
  }

  const { edgeTypeId, reverse } = relationship.value
  createEdgeMutation.mutate({
    edgeTypeId,
    fromNode: reverse ? target.id : props.node.id,
    toNode: reverse ? props.node.id : target.id,
  })
}
</script>

<template>
  <h3 style="padding-bottom: 1rem">New Edge</h3>

  <FormDrawer @submit.prevent="submit">
    <FormGroup>
      <IftaLabel>
        <Select
          input-id="edge-relationship"
          v-model="relationship"
          :options="relationshipOptions"
          option-label="label"
          data-key="key"
          fluid
        />
        <label for="edge-relationship">{{ node.title }} …</label>
      </IftaLabel>
      <div class="edge-type-toggle">
        <Button
          type="button"
          link
          size="small"
          @click="newEdgeTypeVisible = !newEdgeTypeVisible"
        >
          {{
            newEdgeTypeVisible
              ? 'Cancel new edge type'
              : 'Missing a relationship? New edge type'
          }}
        </Button>
      </div>
    </FormGroup>

    <NewEdgeTypeForm v-if="newEdgeTypeVisible" @success="onEdgeTypeCreated" />

    <FormGroup>
      <IftaLabel>
        <AutoComplete
          input-id="edge-target-node"
          v-model="targetNode"
          :suggestions="nodeSuggestions"
          option-label="title"
          force-selection
          dropdown
          fluid
          @complete="searchNodes($event.query)"
          @option-select="onTargetSelected($event.value)"
        >
          <template #option="{ option }">
            <span v-if="isCreateOption(option)" class="create-node-option">
              {{ option.title }}
            </span>
            <span v-else>{{ option.title }}</span>
          </template>
        </AutoComplete>
        <label for="edge-target-node">Target node</label>
      </IftaLabel>
      <div v-if="newNodeVisible" class="edge-type-toggle">
        <Button type="button" link size="small" @click="newNodeVisible = false">
          Cancel new node
        </Button>
      </div>
    </FormGroup>

    <InlineNewNodeForm
      v-if="newNodeVisible"
      :initial-title="newNodeTitle"
      :node-types="nodeTypes"
      @success="onNodeCreated"
    />

    <div v-if="createEdgeMutation.isError">error</div>

    <Button
      type="submit"
      :loading="createEdgeMutation.isPending"
      :disabled="!relationship || !selectedTargetNode"
    >
      <Spinner v-if="createEdgeMutation.isPending" />

      Create
    </Button>
  </FormDrawer>
</template>

<style scoped>
.edge-type-toggle {
  display: flex;
  justify-content: flex-end;
}

.create-node-option {
  font-style: italic;
}
</style>
