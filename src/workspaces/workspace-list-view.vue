<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { apiClient } from '../api'
import { reactive, ref } from 'vue'
import PageHeader from '../layout/page-header.vue'
import NewWorkspaceForm from './new-workspace-form.vue'
import type { Workspace } from '../api/use-current-workspace-query.ts'
import type { ApiList } from '../api/api-list.ts'
import Spinner from '../design/spinner.vue'

const workspacesQuery = reactive(
  useQuery({
    queryKey: ['workspaces', 'getAll'],
    queryFn: async () => {
      const response =
        await apiClient.get<ApiList<Workspace>>('/workspaces/getAll')
      return response.data
    },
  }),
)

const newDrawerVisible = ref(false)
</script>

<template>
  <PageHeader>
    <template #header>
      <h1>Workspaces</h1>
    </template>

    <template #actions>
      <Button @click="newDrawerVisible = true">New workspace</Button>
    </template>
  </PageHeader>

  <Drawer
    v-model:visible="newDrawerVisible"
    header="New workspace"
    position="right"
    style="width: 30rem"
  >
    <NewWorkspaceForm :onCreate="() => (newDrawerVisible = false)" />
  </Drawer>

  <div v-if="workspacesQuery.isPending">
    <Spinner />
  </div>
  <div v-if="workspacesQuery.isError">error</div>
  <div v-if="workspacesQuery.isSuccess">
    <div v-if="workspacesQuery.data.items.length === 0">
      <em>No workspaces</em>
    </div>

    <Panel header="Workspaces">
      <ul>
        <li v-for="workspace in workspacesQuery.data.items" :key="workspace.id">
          <router-link :to="`/w/${workspace.id}`">
            {{ workspace.name }}
          </router-link>
        </li>
      </ul>
    </Panel>
  </div>
</template>
