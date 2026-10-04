<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient, url } from '../api'
import Spinner from '../design/spinner.vue'
import type { Node } from '../api/use-nodes-query.ts'
import { useWorkspaceId } from '../api/use-current-workspace-query.ts'
import {
  type FullNode,
  type Property,
  type PropertyValue,
  type PropertyValueType,
  propertyValueTypes,
  useNodeQuery,
} from '../api/use-node-query.ts'
import NodePropertyValue from './node-property-value.vue'

const props = defineProps<{
  node: Pick<Node, 'id' | 'nodeTypeId'>
}>()

const workspaceId = useWorkspaceId()
const queryClient = useQueryClient()

const nodeQuery = reactive(useNodeQuery(props.node.id))

const properties = computed<PropertyValue[]>(
  () => nodeQuery.data?.properties ?? [],
)

const nodeQueryKey = ['w', workspaceId, 'nodes', 'byId', props.node.id]

// Editing a value
const editingPropertyId = ref<string | null>(null)
const draftValue = ref('')

const setValueMutation = reactive(
  useMutation({
    mutationKey: ['nodes', 'setProperty'],
    mutationFn: (variables: { propertyId: string; value: string | null }) =>
      apiClient
        .post<PropertyValue>(
          url`/workspaces/${workspaceId}/graph/nodes/setProperty`,
          { nodeId: props.node.id, ...variables },
        )
        .then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData<FullNode>(nodeQueryKey, (old) =>
        old
          ? {
              ...old,
              properties: old.properties.map((p) =>
                p.propertyId === updated.propertyId ? updated : p,
              ),
            }
          : old,
      )
      editingPropertyId.value = null
      return queryClient.invalidateQueries({ queryKey: nodeQueryKey })
    },
  }),
)

const startEditing = (property: PropertyValue) => {
  setValueMutation.reset()
  draftValue.value = property.value ?? ''
  editingPropertyId.value = property.propertyId
}

const cancelEditing = () => {
  editingPropertyId.value = null
  setValueMutation.reset()
}

const saveValue = () => {
  const propertyId = editingPropertyId.value
  if (!propertyId) {
    return
  }

  const current = properties.value.find((p) => p.propertyId === propertyId)
  const value = draftValue.value.trim() || null
  if ((current?.value ?? null) === value) {
    editingPropertyId.value = null
    return
  }
  setValueMutation.mutate({ propertyId, value })
}

// Adding a new property
const adding = ref(false)
const newPropertyName = ref('')
const newPropertyValueType = ref<PropertyValueType>('text')

const createPropertyMutation = reactive(
  useMutation({
    mutationKey: ['nodeTypes', 'createProperty'],
    mutationFn: (variables: { name: string; valueType: PropertyValueType }) =>
      apiClient
        .post<Property>(
          url`/workspaces/${workspaceId}/graph/nodeTypes/createProperty`,
          { nodeTypeId: props.node.nodeTypeId, ...variables },
        )
        .then((r) => r.data),
    onSuccess: async (property) => {
      // The property is defined on the node type, so every node of that type gains it
      await queryClient.invalidateQueries({
        queryKey: ['w', workspaceId, 'nodes', 'byId'],
      })
      adding.value = false
      const created = properties.value.find((p) => p.propertyId === property.id)
      if (created) {
        startEditing(created)
      }
    },
  }),
)

const startAdding = () => {
  createPropertyMutation.reset()
  newPropertyName.value = ''
  newPropertyValueType.value = 'text'
  adding.value = true
}

const cancelAdding = () => {
  adding.value = false
  createPropertyMutation.reset()
}

const submitNewProperty = () => {
  const name = newPropertyName.value.trim()
  if (!name) {
    return
  }
  createPropertyMutation.mutate({
    name,
    valueType: newPropertyValueType.value,
  })
}
</script>

<template>
  <section class="section">
    <div class="section-header">
      <h3>Properties</h3>
    </div>

    <Spinner v-if="nodeQuery.isPending" />

    <div v-else-if="nodeQuery.isError">error</div>

    <template v-else>
      <ul class="property-list">
        <li
          v-for="property in properties"
          :key="property.propertyId"
          class="property-row"
        >
          <span class="property-name" :title="property.propertyName">
            {{ property.propertyName }}
          </span>

          <form
            v-if="editingPropertyId === property.propertyId"
            class="property-editor"
            @submit.prevent="saveValue"
          >
            <InputText
              v-model="draftValue"
              autofocus
              size="small"
              class="property-input"
              :aria-label="property.propertyName"
              :disabled="setValueMutation.isPending"
              @keydown.esc.stop.prevent="cancelEditing"
            />
            <div class="property-actions">
              <Button
                type="submit"
                size="small"
                :loading="setValueMutation.isPending"
              >
                Save
              </Button>
              <Button
                type="button"
                size="small"
                severity="secondary"
                text
                :disabled="setValueMutation.isPending"
                @click="cancelEditing"
              >
                Cancel
              </Button>
            </div>
          </form>

          <div v-else class="property-display">
            <NodePropertyValue
              :value-type="property.valueType"
              :value="property.value"
            />
            <Button
              type="button"
              size="small"
              text
              rounded
              severity="secondary"
              :aria-label="`Edit ${property.propertyName}`"
              :title="`Edit ${property.propertyName}`"
              @click="startEditing(property)"
            >
              ✎
            </Button>
          </div>
        </li>

        <li v-if="adding" class="property-row">
          <form class="property-editor" @submit.prevent="submitNewProperty">
            <InputText
              v-model="newPropertyName"
              autofocus
              size="small"
              class="property-input"
              placeholder="Property name"
              aria-label="New property name"
              :disabled="createPropertyMutation.isPending"
              @keydown.esc.stop.prevent="cancelAdding"
            />
            <Select
              v-model="newPropertyValueType"
              :options="propertyValueTypes"
              option-label="label"
              option-value="value"
              size="small"
              class="property-type"
              aria-label="New property type"
              :disabled="createPropertyMutation.isPending"
              @keydown.esc.stop.prevent="cancelAdding"
            />
            <div class="property-actions">
              <Button
                type="submit"
                size="small"
                :loading="createPropertyMutation.isPending"
                :disabled="!newPropertyName.trim()"
              >
                Save
              </Button>
              <Button
                type="button"
                size="small"
                severity="secondary"
                text
                :disabled="createPropertyMutation.isPending"
                @click="cancelAdding"
              >
                Cancel
              </Button>
            </div>
          </form>
        </li>
      </ul>

      <Button
        v-if="!adding"
        size="small"
        text
        severity="secondary"
        class="add-property"
        @click="startAdding"
      >
        + Add a property
      </Button>

      <div v-if="setValueMutation.isError" class="error">
        error saving property
      </div>
      <div v-if="createPropertyMutation.isError" class="error">
        error adding property
      </div>
    </template>
  </section>
</template>

<style scoped>
.section {
  padding-bottom: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
}

.property-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.property-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.25rem;
}

.property-name {
  flex: 0 0 9rem;
  color: var(--p-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.property-editor,
.property-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.property-input {
  flex: 1;
  min-width: 0;
}

.property-type {
  flex: 0 0 auto;
}

.property-editor {
  position: relative;
}

.property-actions {
  position: absolute;
  top: calc(100% + 0.25rem);
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  background: var(--p-content-background);
  border: 1px solid var(--p-content-border-color);
  border-radius: var(--p-content-border-radius, 6px);
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.12);
}

.property-name {
  max-width: 25vw;
}

.add-property {
  margin-top: 0.25rem;
}

.error {
  color: var(--p-red-500);
  font-size: 0.875rem;
}
</style>
