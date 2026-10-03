<script setup lang="ts">
import FormDrawer from '../design/form-drawer.vue'
import FormGroup from '../design/form-group.vue'
import { reactive, ref } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient, url } from '../api'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import Spinner from '../design/spinner.vue'

const props = defineProps<{
  onSuccess?: () => void
}>()

const workspaceId = useWorkspaceId()

const queryClient = useQueryClient()
const createNodeTypeMutation = reactive(
  useMutation({
    mutationKey: ['node-types', 'new'],
    mutationFn: (nodeType: { title: string }) =>
      apiClient.post(
        url`/workspaces/${workspaceId}/graph/nodeTypes/create`,
        nodeType,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['w', workspaceId, 'nodeTypes'],
      })
      props.onSuccess?.()
    },
  }),
)

const title = ref('')
</script>

<template>
  <h2 style="padding-bottom: 1rem">New Node Type</h2>

  <FormDrawer @submit.prevent="createNodeTypeMutation.mutate({ title: title })">
    <FormGroup>
      <IftaLabel>
        <InputText id="node-type-title" v-model="title" />
        <label for="node-type-title">Title</label>
      </IftaLabel>
    </FormGroup>

    <Button type="submit" :loading="createNodeTypeMutation.isPending">
      <Spinner v-if="createNodeTypeMutation.isPending" />

      Create
    </Button>
  </FormDrawer>
</template>
