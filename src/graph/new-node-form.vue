<script setup lang="ts">
import FormDrawer from '../design/form-drawer.vue'
import FormGroup from '../design/form-group.vue'
import { reactive, ref } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient, url } from '../api'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import type { NodeType } from '../api/use-node-types-query.ts'
import Spinner from '../design/spinner.vue'

const props = defineProps<{
  nodeType: NodeType
  onSuccess?: () => void
}>()

const workspaceId = useWorkspaceId()

const queryClient = useQueryClient()
const createNodeMutation = reactive(
  useMutation({
    mutationKey: ['nodes', 'new'],
    mutationFn: (newNode: { title: string; nodeTypeId: string }) =>
      apiClient.post(
        url`/workspaces/${workspaceId}/graph/nodes/create`,
        newNode,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['w', workspaceId, 'nodes'],
      })
      title.value = ''
      props.onSuccess?.()
    },
  }),
)

const title = ref('')
</script>

<template>
  <h2 style="padding-bottom: 1rem">New {{ nodeType.title }}</h2>

  <FormDrawer
    @submit.prevent="
      createNodeMutation.mutate({ title: title, nodeTypeId: nodeType.id })
    "
  >
    <FormGroup>
      <IftaLabel>
        <InputText id="node-title" v-model="title" />
        <label for="node-title">Title</label>
      </IftaLabel>
    </FormGroup>

    <Button type="submit" :loading="createNodeMutation.isPending">
      <Spinner v-if="createNodeMutation.isPending" />

      Create
    </Button>
  </FormDrawer>
</template>
