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
import Spinner from '../design/spinner.vue'
import NewEdgeTypeForm, { type CreatedEdgeType } from './new-edge-type-form.vue'

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

const workspaceId = useWorkspaceId()

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
const targetNode = ref<Node | string | null>(null)
const nodeSuggestions = ref<Node[]>([])

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
      : [...props.edgeTypes].reverse().find(
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
  nodeSuggestions.value = response.data.items.filter(
    (node) => node.id !== props.node.id,
  )
}

const selectedTargetNode = computed<Node | null>(() =>
  targetNode.value && typeof targetNode.value === 'object'
    ? targetNode.value
    : null,
)

const queryClient = useQueryClient()
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
        />
        <label for="edge-target-node">Target node</label>
      </IftaLabel>
    </FormGroup>

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
</style>
