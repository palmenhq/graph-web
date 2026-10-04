<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient, url } from '../api'
import type { NodeType } from '../api/use-node-types-query.ts'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import TypeRow from './type-row.vue'
import NodeTypeProperties from './node-type-properties.vue'

const props = defineProps<{
  nodeType: NodeType
}>()

const workspaceId = useWorkspaceId()
const queryClient = useQueryClient()

const editing = ref(false)
const title = ref('')

const updateNodeTypeMutation = reactive(
  useMutation({
    mutationKey: ['node-types', 'update'],
    mutationFn: (variables: { id: string; title: string }) =>
      apiClient.post(
        url`/workspaces/${workspaceId}/graph/nodeTypes/update`,
        variables,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['w', workspaceId] })
      editing.value = false
    },
  }),
)

const deleteNodeTypeMutation = reactive(
  useMutation({
    mutationKey: ['node-types', 'delete'],
    mutationFn: (variables: { id: string }) =>
      apiClient.post(
        url`/workspaces/${workspaceId}/graph/nodeTypes/delete`,
        variables,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['w', workspaceId] })
    },
  }),
)

const startEditing = () => {
  title.value = props.nodeType.title
  updateNodeTypeMutation.reset()
  editing.value = true
}

const cancel = () => {
  editing.value = false
  updateNodeTypeMutation.reset()
}

const save = () => {
  const trimmed = title.value.trim()
  if (!trimmed) {
    return
  }
  if (trimmed === props.nodeType.title) {
    editing.value = false
    return
  }
  updateNodeTypeMutation.mutate({ id: props.nodeType.id, title: trimmed })
}

const remove = () => {
  if (
    !window.confirm(
      `Delete node type "${props.nodeType.title}"? This cannot be undone.`,
    )
  ) {
    return
  }
  deleteNodeTypeMutation.mutate({ id: props.nodeType.id })
}
</script>

<template>
  <TypeRow
    :editing
    :saving="updateNodeTypeMutation.isPending"
    :deleting="deleteNodeTypeMutation.isPending"
    :saveError="updateNodeTypeMutation.isError"
    :deleteError="deleteNodeTypeMutation.isError"
    :canSave="!!title.trim()"
    @edit="startEditing"
    @save="save"
    @cancel="cancel"
    @delete="remove"
  >
    <template #title>{{ nodeType.title }}</template>

    <template #fields>
      <InputText
        v-model="title"
        autofocus
        size="small"
        class="row-input"
        aria-label="Node type title"
        :disabled="updateNodeTypeMutation.isPending"
      />
    </template>

    <NodeTypeProperties :nodeType />
  </TypeRow>
</template>
