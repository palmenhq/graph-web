<script setup lang="ts">
import FormGroup from '../design/form-group.vue'
import { computed, reactive, ref } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient, url } from '../api'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import Spinner from '../design/spinner.vue'

export type CreatedEdgeType = {
  id?: string
  relationshipTitle: string
  reverseRelationshipTitle: string
}

const props = defineProps<{
  onSuccess?: (edgeType: CreatedEdgeType) => void
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
    onSuccess: async (response, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['w', workspaceId, 'edgeTypes'],
      })
      relationshipTitle.value = ''
      reverseRelationshipTitle.value = ''
      const data = response.data as Partial<CreatedEdgeType> | undefined
      props.onSuccess?.({
        ...variables,
        id: typeof data?.id === 'string' ? data.id : undefined,
      })
    },
  }),
)

const relationshipTitle = ref('')
const reverseRelationshipTitle = ref('')

const canSubmit = computed(
  () =>
    !!relationshipTitle.value.trim() && !!reverseRelationshipTitle.value.trim(),
)

const submit = () => {
  if (!canSubmit.value || createEdgeTypeMutation.isPending) {
    return
  }

  createEdgeTypeMutation.mutate({
    relationshipTitle: relationshipTitle.value.trim(),
    reverseRelationshipTitle: reverseRelationshipTitle.value.trim(),
  })
}
</script>

<template>
  <!-- Rendered inside the new edge form, so no nested <form> element -->
  <div class="edge-type-form" @keydown.enter.prevent="submit">
    <h4>New Edge Type</h4>

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

    <Button
      type="button"
      size="small"
      :loading="createEdgeTypeMutation.isPending"
      :disabled="!canSubmit"
      @click="submit"
    >
      <Spinner v-if="createEdgeTypeMutation.isPending" />

      Create Edge Type
    </Button>
  </div>
</template>

<style scoped>
.edge-type-form {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
  width: 100%;
  padding: 1rem;
  border: 1px dashed var(--p-content-border-color);
  border-radius: var(--p-content-border-radius);
}

.edge-type-form h4 {
  align-self: flex-start;
}
</style>
