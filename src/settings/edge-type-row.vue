<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient, url } from '../api'
import type { EdgeType } from '../api/use-edge-types-query.ts'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import TypeRow from './type-row.vue'

const props = defineProps<{
  edgeType: EdgeType
}>()

const workspaceId = useWorkspaceId()
const queryClient = useQueryClient()

const editing = ref(false)
const relationshipTitle = ref('')
const reverseRelationshipTitle = ref('')

const updateEdgeTypeMutation = reactive(
  useMutation({
    mutationKey: ['edge-types', 'update'],
    mutationFn: (variables: {
      id: string
      relationshipTitle: string
      reverseRelationshipTitle: string | null
    }) =>
      apiClient.patch(
        url`/workspaces/${workspaceId}/graph/edgeTypes/update`,
        variables,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['w', workspaceId] })
      editing.value = false
    },
  }),
)

const deleteEdgeTypeMutation = reactive(
  useMutation({
    mutationKey: ['edge-types', 'delete'],
    mutationFn: (variables: { id: string }) =>
      apiClient.post(
        url`/workspaces/${workspaceId}/graph/edgeTypes/delete`,
        variables,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['w', workspaceId] })
    },
  }),
)

const startEditing = () => {
  relationshipTitle.value = props.edgeType.relationshipTitle
  reverseRelationshipTitle.value = props.edgeType.reverseRelationshipTitle ?? ''
  updateEdgeTypeMutation.reset()
  editing.value = true
}

const cancel = () => {
  editing.value = false
  updateEdgeTypeMutation.reset()
}

const save = () => {
  const relationship = relationshipTitle.value.trim()
  const reverse = reverseRelationshipTitle.value.trim() || null
  if (!relationship) {
    return
  }
  if (
    relationship === props.edgeType.relationshipTitle &&
    reverse === (props.edgeType.reverseRelationshipTitle || null)
  ) {
    editing.value = false
    return
  }
  updateEdgeTypeMutation.mutate({
    id: props.edgeType.id,
    relationshipTitle: relationship,
    reverseRelationshipTitle: reverse,
  })
}

const remove = () => {
  if (
    !window.confirm(
      `Delete edge type "${props.edgeType.relationshipTitle}"? This cannot be undone.`,
    )
  ) {
    return
  }
  deleteEdgeTypeMutation.mutate({ id: props.edgeType.id })
}
</script>

<template>
  <TypeRow
    :editing
    :saving="updateEdgeTypeMutation.isPending"
    :deleting="deleteEdgeTypeMutation.isPending"
    :saveError="updateEdgeTypeMutation.isError"
    :deleteError="deleteEdgeTypeMutation.isError"
    :canSave="!!relationshipTitle.trim()"
    @edit="startEditing"
    @save="save"
    @cancel="cancel"
    @delete="remove"
  >
    <template #title>
      {{ edgeType.relationshipTitle }}
      <span v-if="edgeType.reverseRelationshipTitle" class="reverse">
        ⇄ {{ edgeType.reverseRelationshipTitle }}
      </span>
    </template>

    <template #fields>
      <InputText
        v-model="relationshipTitle"
        autofocus
        size="small"
        class="row-input"
        placeholder="Relationship title"
        aria-label="Relationship title"
        :disabled="updateEdgeTypeMutation.isPending"
      />
      <InputText
        v-model="reverseRelationshipTitle"
        size="small"
        class="row-input"
        placeholder="Reverse relationship title"
        aria-label="Reverse relationship title"
        :disabled="updateEdgeTypeMutation.isPending"
      />
    </template>
  </TypeRow>
</template>

<style scoped>
.reverse {
  color: var(--p-text-muted-color);
}
</style>
