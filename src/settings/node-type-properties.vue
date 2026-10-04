<script setup lang="ts">
import { reactive } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient, url } from '../api'
import Spinner from '../design/spinner.vue'
import type { NodeType } from '../api/use-node-types-query.ts'
import { useNodeTypePropertiesQuery } from '../api/use-node-types-query.ts'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import { type Property, propertyValueTypes } from '../api/use-node-query.ts'

const props = defineProps<{
  nodeType: NodeType
}>()

const workspaceId = useWorkspaceId()
const queryClient = useQueryClient()

const propertiesQuery = reactive(useNodeTypePropertiesQuery(props.nodeType.id))

const valueTypeLabel = (valueType: string) =>
  propertyValueTypes.find((t) => t.value === valueType)?.label ?? valueType

const deletePropertyMutation = reactive(
  useMutation({
    mutationKey: ['nodeTypes', 'deleteProperty'],
    mutationFn: (variables: { propertyId: string }) =>
      apiClient.post(
        url`/workspaces/${workspaceId}/graph/nodeTypes/deleteProperty`,
        { nodeTypeId: props.nodeType.id, ...variables },
      ),
    onSuccess: async () => {
      // Also refreshes the nodes of this type, which no longer show the property
      await queryClient.invalidateQueries({ queryKey: ['w', workspaceId] })
    },
  }),
)

const remove = (property: Property) => {
  if (
    !window.confirm(
      `Delete property "${property.name}" from "${props.nodeType.title}"? Its values will no longer be shown on any node.`,
    )
  ) {
    return
  }
  deletePropertyMutation.mutate({ propertyId: property.id })
}
</script>

<template>
  <div class="properties">
    <Spinner v-if="propertiesQuery.isPending" />
    <div v-else-if="propertiesQuery.isError" class="error">
      error loading properties
    </div>

    <template v-else>
      <ul v-if="propertiesQuery.data?.items.length" class="property-list">
        <li
          v-for="property in propertiesQuery.data.items"
          :key="property.id"
          class="property-row"
        >
          <span class="property-name" :title="property.name">
            {{ property.name }}
          </span>
          <span class="property-type">
            {{ valueTypeLabel(property.valueType) }}
          </span>
          <Button
            type="button"
            size="small"
            severity="danger"
            text
            :aria-label="`Delete property ${property.name}`"
            :loading="
              deletePropertyMutation.isPending &&
              deletePropertyMutation.variables?.propertyId === property.id
            "
            :disabled="deletePropertyMutation.isPending"
            @click="remove(property)"
          >
            Delete
          </Button>
        </li>
      </ul>
      <em v-else class="empty">No properties</em>

      <span v-if="deletePropertyMutation.isError" class="error">
        error deleting property
      </span>
    </template>
  </div>
</template>

<style scoped>
.properties {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-left: 1rem;
}

.property-list {
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;
}

.property-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.property-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.property-type,
.empty {
  color: var(--p-text-muted-color);
  font-size: 0.875rem;
}

.error {
  color: var(--p-red-500);
  font-size: 0.875rem;
}
</style>
