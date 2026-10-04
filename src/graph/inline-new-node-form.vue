<script setup lang="ts">
import FormGroup from '../design/form-group.vue'
import { computed, reactive, ref, watch } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient, url } from '../api'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import type { ApiList } from '../api/api-list.ts'
import type { Node } from '../api/use-nodes-query.ts'
import type { NodeType } from '../api/use-node-types-query.ts'
import Spinner from '../design/spinner.vue'

const props = defineProps<{
  initialTitle: string
  nodeTypes: NodeType[]
  onSuccess?: (node: Node) => void
}>()

const workspaceId = useWorkspaceId()

const title = ref(props.initialTitle)
const nodeType = ref<NodeType | null>(props.nodeTypes[0] ?? null)

watch(
  () => props.initialTitle,
  (value) => {
    title.value = value
  },
)

// Node types may still be loading when the form opens
watch(
  () => props.nodeTypes,
  (types) => {
    if (!nodeType.value || !types.some((t) => t.id === nodeType.value?.id)) {
      nodeType.value = types[0] ?? null
    }
  },
)

const queryClient = useQueryClient()
const createNodeMutation = reactive(
  useMutation({
    mutationKey: ['nodes', 'new'],
    mutationFn: async (newNode: { title: string; nodeTypeId: string }) => {
      const response = await apiClient.post(
        url`/workspaces/${workspaceId}/graph/nodes/create`,
        newNode,
      )
      const data = response.data as Partial<Node> | undefined
      if (data && typeof data.id === 'string') {
        return { ...newNode, ...data } as Node
      }

      // The API didn't return the node, so look it up by title
      const search = await apiClient.get<ApiList<Node>>(
        url`/workspaces/${workspaceId}/graph/nodes/getAll?search=${newNode.title}`,
      )
      const created = [...search.data.items]
        .reverse()
        .find(
          (node) =>
            node.title === newNode.title &&
            node.nodeTypeId === newNode.nodeTypeId,
        )
      if (!created) {
        throw new Error('Created node not found')
      }
      return created
    },
    onSuccess: (node) => {
      queryClient.invalidateQueries({
        queryKey: ['w', workspaceId, 'nodes'],
      })
      title.value = ''
      props.onSuccess?.(node)
    },
  }),
)

const canSubmit = computed(() => !!title.value.trim() && !!nodeType.value)

const submit = () => {
  if (!canSubmit.value || !nodeType.value || createNodeMutation.isPending) {
    return
  }

  createNodeMutation.mutate({
    title: title.value.trim(),
    nodeTypeId: nodeType.value.id,
  })
}
</script>

<template>
  <!-- Rendered inside the new edge form, so no nested <form> element -->
  <div class="node-form" @keydown.enter.prevent="submit">
    <h4>New Node</h4>

    <FormGroup>
      <IftaLabel>
        <InputText id="inline-node-title" v-model="title" fluid />
        <label for="inline-node-title">Title</label>
      </IftaLabel>
    </FormGroup>

    <FormGroup>
      <IftaLabel>
        <Select
          input-id="inline-node-type"
          v-model="nodeType"
          :options="nodeTypes"
          option-label="title"
          data-key="id"
          fluid
        />
        <label for="inline-node-type">Node type</label>
      </IftaLabel>
    </FormGroup>

    <div v-if="createNodeMutation.isError">error</div>

    <Button
      type="button"
      size="small"
      :loading="createNodeMutation.isPending"
      :disabled="!canSubmit"
      @click="submit"
    >
      <Spinner v-if="createNodeMutation.isPending" />

      Create Node
    </Button>
  </div>
</template>

<style scoped>
.node-form {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
  width: 100%;
  padding: 1rem;
  border: 1px dashed var(--p-content-border-color);
  border-radius: var(--p-content-border-radius);
}

.node-form h4 {
  align-self: flex-start;
}
</style>
