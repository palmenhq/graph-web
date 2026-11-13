<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import PageHeader from '../layout/page-header.vue'
import Spinner from '../design/spinner.vue'
import NodeTypeRow from './node-type-row.vue'
import EdgeTypeRow from './edge-type-row.vue'
import {
  useCurrentWorkspaceQuery,
  useWorkspaceId,
} from '../api/use-current-workspace-query.ts'
import {
  type NodeType,
  useNodeTypesQuery,
} from '../api/use-node-types-query.ts'
import {
  type EdgeType,
  useEdgeTypesQuery,
} from '../api/use-edge-types-query.ts'
import { setSessionToken } from '../api/session.ts'
import { apiClient, url } from '../api'

const workspaceId = useWorkspaceId()
const workspaceQuery = reactive(useCurrentWorkspaceQuery())
const nodeTypesQuery = reactive(useNodeTypesQuery())
const edgeTypesQuery = reactive(useEdgeTypesQuery())

const router = useRouter()
const queryClient = useQueryClient()

const workspaceName = ref('')

watch(
  () => workspaceQuery.data,
  (workspace) => {
    if (workspace) {
      workspaceName.value = workspace.name
    }
  },
  { immediate: true },
)

const renameWorkspaceMutation = reactive(
  useMutation({
    mutationKey: ['workspaces', 'rename'],
    mutationFn: (variables: { id: string; name: string }) =>
      apiClient.post(url`/workspaces/rename`, variables),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  }),
)

const deleteWorkspaceMutation = reactive(
  useMutation({
    mutationKey: ['workspaces', 'delete'],
    mutationFn: (variables: { id: string }) =>
      apiClient.post(url`/workspaces/delete`, variables),
    onSuccess: async () => {
      await router.replace('/w')
      queryClient.removeQueries({ queryKey: ['workspaces', workspaceId] })
      queryClient.removeQueries({ queryKey: ['w', workspaceId] })
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  }),
)

const renameWorkspace = () => {
  const name = workspaceName.value.trim()
  if (!name || name === workspaceQuery.data?.name) {
    return
  }
  renameWorkspaceMutation.mutate({ id: workspaceId, name })
}

const deleteWorkspace = () => {
  const name = workspaceQuery.data?.name
  if (
    !name ||
    !window.confirm(`Delete workspace "${name}"? This cannot be undone.`)
  ) {
    return
  }
  deleteWorkspaceMutation.mutate({ id: workspaceId })
}

const logOut = async () => {
  setSessionToken(null)
  await router.replace('/login')
  queryClient.clear()
}
</script>

<template>
  <Spinner v-if="!workspaceQuery.isSuccess" />

  <template v-if="workspaceQuery.isSuccess">
    <PageHeader
      :back="{
        to: `/w/${workspaceId}`,
        label: workspaceQuery.data?.name ?? '',
      }"
    >
      <template #header>
        <h1>Settings</h1>
      </template>
    </PageHeader>

    <div class="settings-layout">
      <Panel v-if="workspaceQuery.data" header="Workspace">
        <form class="workspace-name-form">
          <InputText
            v-model="workspaceName"
            aria-label="Workspace name"
            :disabled="renameWorkspaceMutation.isPending"
          />
          <Button
            label="Rename"
            type="submit"
            :disabled="
              !workspaceName.trim() ||
              workspaceName.trim() === workspaceQuery.data.name ||
              renameWorkspaceMutation.isPending
            "
            :loading="renameWorkspaceMutation.isPending"
            @click="renameWorkspace"
          />
        </form>
        <small v-if="renameWorkspaceMutation.isError" class="error-message">
          Could not rename workspace.
        </small>
      </Panel>

      <Panel header="Types">
        <Spinner v-if="nodeTypesQuery.isPending" />
        <div v-if="nodeTypesQuery.isError">error</div>
        <DataView
          v-if="nodeTypesQuery.isSuccess"
          :value="nodeTypesQuery.data.items"
          dataKey="id"
        >
          <template #list="{ items }">
            <NodeTypeRow
              v-for="nodeType in items as NodeType[]"
              :key="nodeType.id"
              :nodeType="nodeType"
            />
          </template>
          <template #empty>
            <em>No types</em>
          </template>
        </DataView>
      </Panel>

      <Panel header="Connection Types">
        <Spinner v-if="edgeTypesQuery.isPending" />
        <div v-if="edgeTypesQuery.isError">error</div>
        <DataView
          v-if="edgeTypesQuery.isSuccess"
          :value="edgeTypesQuery.data.items"
          dataKey="id"
        >
          <template #list="{ items }">
            <EdgeTypeRow
              v-for="edgeType in items as EdgeType[]"
              :key="edgeType.id"
              :edgeType="edgeType"
            />
          </template>
          <template #empty>
            <em>No connection types</em>
          </template>
        </DataView>
      </Panel>

      <Panel header="Danger zone">
        <Button severity="danger" outlined @click="logOut">Log out</Button>

        <div class="workspace-delete">
          <Button
            label="Delete workspace"
            severity="danger"
            outlined
            :loading="deleteWorkspaceMutation.isPending"
            :disabled="deleteWorkspaceMutation.isPending"
            @click="deleteWorkspace"
          />
          <small v-if="deleteWorkspaceMutation.isError" class="error-message">
            Could not delete workspace.
          </small>
        </div>
      </Panel>
    </div>
  </template>
</template>

<style scoped>
.settings-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.workspace-name-form,
.workspace-delete {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.workspace-delete {
  margin-top: 1.5rem;
}

.error-message {
  color: var(--p-red-500);
}

@media (max-width: 640px) {
  .settings-layout {
    --p-panel-background: var(--p-content-background);
    --p-panel-border-color: var(--p-content-border-color);
    --p-panel-border-radius: var(--p-content-border-radius);
    --p-panel-header-padding: 0.75rem;
    --p-panel-content-padding: 0 0.75rem 0.75rem;
    --p-panel-footer-padding: 0 0.75rem 0.75rem;
  }

  .settings-layout :deep(.p-panel + .p-panel) {
    border-top-color: var(--p-panel-border-color);
    padding-top: 0;
  }
}
</style>
