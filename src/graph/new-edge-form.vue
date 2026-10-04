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
  node: Pick<Node, 'id' | 'title' | 'nodeTypeId'>
  edgeTypes: EdgeType[]
  onSuccess?: () => void
}>()

type RelationshipOption = {
  key: string
  label: string
  edgeTypeId: string
  reverse: boolean
}

type CreateEdgeTypeOption = {
  create: true
  key: string
  // Display label; must differ from the typed query (see CreateNodeOption)
  label: string
  newTitle: string
}

type RelationshipChoice = RelationshipOption | CreateEdgeTypeOption

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

const isCreateEdgeTypeOption = (
  option: unknown,
): option is CreateEdgeTypeOption =>
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
    ...(edgeType.reverseRelationshipTitle
      ? [
          {
            key: `${edgeType.id}-r`,
            label: edgeType.reverseRelationshipTitle,
            edgeTypeId: edgeType.id,
            reverse: true,
          },
        ]
      : []),
  ]),
)

// While typing, the autocomplete model holds the raw query string
const relationship = ref<RelationshipChoice | string | null>(null)
const relationshipSuggestions = ref<RelationshipChoice[]>([])

const searchRelationships = (query: string) => {
  const title = query.trim()
  const q = title.toLowerCase()
  const matches = q
    ? relationshipOptions.value.filter((o) => o.label.toLowerCase().includes(q))
    : [...relationshipOptions.value]
  // Always offer creation, even when an edge type with the same title exists
  const createOptions: CreateEdgeTypeOption[] = title
    ? [
        {
          create: true,
          key: 'create',
          label: `Create “${title}”`,
          newTitle: title,
        },
      ]
    : []

  relationshipSuggestions.value = [...matches, ...createOptions]
}

const selectedRelationship = computed<RelationshipOption | null>(() =>
  relationship.value &&
  typeof relationship.value === 'object' &&
  !isCreateEdgeTypeOption(relationship.value)
    ? relationship.value
    : null,
)
const targetNode = ref<TargetOption | string | null>(null)
const nodeSuggestions = ref<TargetOption[]>([])

const newEdgeTypeVisible = ref(false)
const newEdgeTypeTitle = ref('')
const pendingEdgeType = ref<CreatedEdgeType | null>(null)

const onRelationshipSelected = (option: RelationshipChoice) => {
  if (!isCreateEdgeTypeOption(option)) {
    return
  }

  // Open the inline form instead of selecting the placeholder option
  relationship.value = null
  newEdgeTypeTitle.value = option.newTitle
  newEdgeTypeVisible.value = true
}

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
  // Always offer creation, even when a node with the same title exists
  const createOptions: CreateNodeOption[] = title
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
  if (!selectedRelationship.value || !target) {
    return
  }

  const { edgeTypeId, reverse } = selectedRelationship.value
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
      <div class="inline-form" v-if="newEdgeTypeVisible">
        <NewEdgeTypeForm
          :initial-title="newEdgeTypeTitle"
          @success="onEdgeTypeCreated"
          @cancel="newEdgeTypeVisible = false"
        />
      </div>

      <div class="inline-form" v-if="newNodeVisible">
        <InlineNewNodeForm
          :initial-title="newNodeTitle"
          :node-types="nodeTypes"
          @success="onNodeCreated"
          @cancel="newNodeVisible = false"
        />
      </div>

      <div class="edge-row">
        <div class="edge-source" :title="node.title">
          {{ node.title }}
        </div>
        <AutoComplete
          input-id="edge-relationship"
          v-model="relationship"
          :suggestions="relationshipSuggestions"
          option-label="label"
          data-key="key"
          placeholder="relationship"
          aria-label="Relationship"
          dropdown
          force-selection
          complete-on-focus
          fluid
          class="edge-relationship"
          :pt="{
            pcInputText: { root: { autocapitalize: 'off' } },
            dropdown: { tabindex: -1 },
          }"
          @complete="searchRelationships($event.query)"
          @option-select="onRelationshipSelected($event.value)"
        >
          <template #option="{ option }">
            <span
              v-if="isCreateEdgeTypeOption(option)"
              class="create-node-option"
            >
              {{ option.label }}
            </span>
            <span v-else>{{ option.label }}</span>
          </template>
        </AutoComplete>
        <AutoComplete
          input-id="edge-target-node"
          v-model="targetNode"
          :suggestions="nodeSuggestions"
          option-label="title"
          placeholder="other node"
          aria-label="Target node"
          force-selection
          complete-on-focus
          dropdown
          fluid
          class="edge-target"
          :pt="{ dropdown: { tabindex: -1 } }"
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
      </div>
    </FormGroup>

    <div v-if="createEdgeMutation.isError">error</div>

    <Button
      type="submit"
      :loading="createEdgeMutation.isPending"
      :disabled="!selectedRelationship || !selectedTargetNode"
    >
      <Spinner v-if="createEdgeMutation.isPending" />

      Create
    </Button>
  </FormDrawer>
</template>

<style scoped>
.edge-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.25rem;
}

.edge-source {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 10rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.inline-form {
  padding-bottom: 1rem;
}

.edge-relationship,
.edge-target {
  flex: 1 1 0;
  min-width: 0;
}

.create-node-option {
  font-style: italic;
}

@media (max-width: 640px) {
  .edge-row {
    flex-direction: column;
    align-items: stretch;
  }

  .edge-source {
    max-width: none;
  }

  .edge-relationship,
  .edge-target {
    flex: 0 0 auto;
    width: 100%;
  }
}
</style>
