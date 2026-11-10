<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient, url } from '../api'
import type {
  NodeType,
  PreferredEdgeType,
} from '../api/use-node-types-query.ts'
import { useEdgeTypesQuery } from '../api/use-edge-types-query.ts'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import TypeDetail from './type-detail.vue'

const props = defineProps<{
  nodeType: NodeType
}>()

type PreferredConnectionOption = PreferredEdgeType & {
  key: string
  label: string
}

const workspaceId = useWorkspaceId()
const queryClient = useQueryClient()
const edgeTypesQuery = reactive(useEdgeTypesQuery())
const selectedKeys = ref<string[]>([])
const savedKeys = ref<string[]>([])
const pendingSaves = ref(0)

const options = computed<PreferredConnectionOption[]>(() =>
  (edgeTypesQuery.data?.items ?? []).flatMap((edgeType) => [
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

const keysForPreferredConnections = (
  preferredEdgeTypes: PreferredEdgeType[],
) => {
  const availableKeys = new Set(options.value.map((option) => option.key))
  return preferredEdgeTypes
    .map(({ edgeTypeId, reverse }) => `${edgeTypeId}-${reverse ? 'r' : 'f'}`)
    .filter((key) => availableKeys.has(key))
}

const syncSelection = () => {
  if (pendingSaves.value > 0) {
    return
  }
  const keys = keysForPreferredConnections(props.nodeType.preferredEdgeTypes)
  selectedKeys.value = keys
  savedKeys.value = keys
}

watch(
  [() => props.nodeType.preferredEdgeTypes, options, pendingSaves],
  syncSelection,
  { immediate: true },
)

const setPreferredEdgeTypesMutation = reactive(
  useMutation({
    mutationKey: ['nodeTypes', 'setPreferredEdgeTypes', props.nodeType.id],
    scope: { id: `preferred-edge-types-${props.nodeType.id}` },
    mutationFn: (preferredEdgeTypes: PreferredEdgeType[]) =>
      apiClient
        .post<NodeType>(
          url`/workspaces/${workspaceId}/graph/nodeTypes/setPreferredEdgeTypes`,
          { nodeTypeId: props.nodeType.id, preferredEdgeTypes },
        )
        .then((r) => r.data),
    onSuccess: async (_updated, preferredEdgeTypes) => {
      savedKeys.value = keysForPreferredConnections(preferredEdgeTypes)
      await queryClient.invalidateQueries({ queryKey: ['w', workspaceId] })
    },
    onError: () => {
      if (pendingSaves.value <= 1) {
        selectedKeys.value = [...savedKeys.value]
      }
    },
    onSettled: () => {
      pendingSaves.value = Math.max(0, pendingSaves.value - 1)
    },
  }),
)

const saveSelection = (keys: string[]) => {
  selectedKeys.value = keys
  const optionsByKey = new Map(
    options.value.map((option) => [option.key, option]),
  )
  const preferredEdgeTypes = keys.flatMap((key) => {
    const option = optionsByKey.get(key)
    return option
      ? [{ edgeTypeId: option.edgeTypeId, reverse: option.reverse }]
      : []
  })
  pendingSaves.value += 1
  setPreferredEdgeTypesMutation.mutate(preferredEdgeTypes)
}
</script>

<template>
  <TypeDetail
    label="Preferred connections"
    :labelFor="`preferred-connections-${nodeType.id}`"
  >
    <div class="preferred-edge-types">
      <MultiSelect
        :inputId="`preferred-connections-${nodeType.id}`"
        :model-value="selectedKeys"
        :options="options"
        option-label="label"
        option-value="key"
        placeholder="Select connections"
        empty-message="No connection types"
        aria-label="Preferred connections"
        size="small"
        display="chip"
        fluid
        :loading="edgeTypesQuery.isPending"
        @update:model-value="saveSelection"
      />
      <span v-if="setPreferredEdgeTypesMutation.isError" class="error">
        error saving preferred connections
      </span>
    </div>
  </TypeDetail>
</template>

<style scoped>
.preferred-edge-types {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.error {
  color: var(--p-red-500);
  font-size: 0.875rem;
}
</style>
