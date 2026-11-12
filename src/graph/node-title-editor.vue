<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient, url } from '../api'
import type { Node } from '../api/use-nodes-query.ts'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import copy from 'copy-to-clipboard'
import OiPencil from '@openvue/openicons-vue/icons/OiPencil'
import OiClone from '@openvue/openicons-vue/icons/OiClone'

const props = defineProps<{
  node: Pick<Node, 'id' | 'title'>
}>()

const workspaceId = useWorkspaceId()
const queryClient = useQueryClient()

const editing = ref(false)
const title = ref('')

const updateNodeMutation = reactive(
  useMutation({
    mutationKey: ['nodes', 'update'],
    mutationFn: (variables: { id: string; title: string }) =>
      apiClient.post(
        url`/workspaces/${workspaceId}/graph/nodes/update`,
        variables,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['w', workspaceId, 'nodes'],
      })
      editing.value = false
    },
  }),
)

const startEditing = () => {
  title.value = props.node.title
  updateNodeMutation.reset()
  editing.value = true
}

const cancel = () => {
  editing.value = false
  updateNodeMutation.reset()
}

const save = () => {
  const trimmed = title.value.trim()
  if (!trimmed) {
    return
  }
  if (trimmed === props.node.title) {
    editing.value = false
    return
  }
  updateNodeMutation.mutate({ id: props.node.id, title: trimmed })
}

const copyLink = () => {
  copy(
    window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname,
  )
}
</script>

<template>
  <form v-if="editing" class="title-editor" @submit.prevent="save">
    <InputText
      v-model="title"
      autofocus
      size="small"
      class="title-input"
      aria-label="Title"
      :disabled="updateNodeMutation.isPending"
      @keydown.esc.stop.prevent="cancel"
    />
    <Button
      type="submit"
      size="small"
      :loading="updateNodeMutation.isPending"
      :disabled="!title.trim()"
    >
      Save
    </Button>
    <Button
      type="button"
      size="small"
      severity="secondary"
      text
      :disabled="updateNodeMutation.isPending"
      @click="cancel"
    >
      Cancel
    </Button>
    <span v-if="updateNodeMutation.isError" class="error">error saving</span>
  </form>

  <div v-else class="title-display">
    <span class="p-dialog-title">{{ node.title }}</span>
    <Button
      type="button"
      size="small"
      text
      rounded
      severity="secondary"
      aria-label="Edit title"
      title="Edit title"
      @click="startEditing"
    >
      <OiPencil />
    </Button>

    <Button
      type="button"
      size="small"
      text
      rounded
      severity="secondary"
      aria-label="Copy link"
      :title="`Copy link to ${node.title}`"
      @click="copyLink"
    >
      <OiClone />
    </Button>
  </div>
</template>

<style scoped>
.title-editor,
.title-display {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.title-input {
  flex: 1;
  min-width: 0;
}

.error {
  color: var(--p-red-500);
  font-size: 0.875rem;
}
</style>
