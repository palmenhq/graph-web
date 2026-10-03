<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { reactive, ref } from 'vue'
import { apiClient } from '../api'
import FormDrawer from '../design/form-drawer.vue'
import FormGroup from '../design/form-group.vue'
import Spinner from '../design/spinner.vue'

const props = defineProps<{ onCreate?: () => void }>()

const queryClient = useQueryClient()

const createWorkspaceMutation = reactive(
  useMutation({
    mutationKey: ['workspaces', 'create'],
    mutationFn: ({ name }: { name: string }) =>
      apiClient.post('/workspaces/create', { name }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      props.onCreate?.()
    },
  }),
)

const name = ref('')
</script>

<template>
  <FormDrawer
    @submit.prevent="createWorkspaceMutation.mutate({ name: name })"
    class="drawer-form"
  >
    <FormGroup>
      <IftaLabel>
        <InputText
          id="workspace-name"
          placeholder="My workspace"
          v-model="name"
        />
        <label for="workspace-name">Name</label>
      </IftaLabel>
    </FormGroup>

    <Button type="submit" :loading="createWorkspaceMutation.isPending">
      <Spinner v-if="createWorkspaceMutation.isPending" />
      Create
    </Button>
  </FormDrawer>
</template>
