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
const createEdgeTypeMutation = reactive(
  useMutation({
    mutationKey: ['edge-types', 'new'],
    mutationFn: (edgeType: {
      relationshipTitle: string
      reverseRelationshipTitle: string
    }) =>
      apiClient.post(
        url`/workspaces/${workspaceId}/graph/edgeTypes/create`,
        edgeType,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['w', workspaceId, 'edgeTypes'],
      })
      relationshipTitle.value = ''
      reverseRelationshipTitle.value = ''
      props.onSuccess?.()
    },
  }),
)

const relationshipTitle = ref('')
const reverseRelationshipTitle = ref('')
</script>

<template>
  <h3 style="padding-bottom: 1rem">New Edge Type</h3>

  <FormDrawer
    @submit.prevent="
      createEdgeTypeMutation.mutate({
        relationshipTitle,
        reverseRelationshipTitle,
      })
    "
  >
    <FormGroup>
      <IftaLabel>
        <InputText
          id="edge-type-relationship-title"
          v-model="relationshipTitle"
          fluid
        />
        <label for="edge-type-relationship-title">Relationship title</label>
      </IftaLabel>
    </FormGroup>

    <FormGroup>
      <IftaLabel>
        <InputText
          id="edge-type-reverse-relationship-title"
          v-model="reverseRelationshipTitle"
          fluid
        />
        <label for="edge-type-reverse-relationship-title">
          Reverse relationship title
        </label>
      </IftaLabel>
    </FormGroup>

    <div v-if="createEdgeTypeMutation.isError">error</div>

    <Button type="submit" :loading="createEdgeTypeMutation.isPending">
      <Spinner v-if="createEdgeTypeMutation.isPending" />

      Create
    </Button>
  </FormDrawer>
</template>
