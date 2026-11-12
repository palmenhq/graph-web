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

  <div v-if="workspacesQuery.isPending" class="state">
    <Spinner />
  </div>
  <div v-if="workspacesQuery.isError" class="state">
    <p>Could not load your workspaces.</p>
    <Button outlined @click="workspacesQuery.refetch()">Try again</Button>
  </div>
  <template v-if="workspacesQuery.isSuccess">
    <div v-if="workspacesQuery.data.items.length === 0" class="state">
      <p>You don't have any workspaces yet.</p>
      <Button @click="newDrawerVisible = true">
        Create your first workspace
      </Button>
    </div>

    <ul v-else class="workspace-grid">
      <li v-for="workspace in workspacesQuery.data.items" :key="workspace.id">
        <router-link :to="`/w/${workspace.id}`" class="workspace-card">
          <span class="avatar" aria-hidden="true">
            {{ workspace.name.trim().charAt(0).toUpperCase() || '?' }}
          </span>
          <span class="name">{{ workspace.name }}</span>
          <span class="chevron" aria-hidden="true">&rsaquo;</span>
        </router-link>
      </li>
    </ul>
  </template>
</template>

<style scoped>
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--p-text-muted-color);
}

.state p {
  margin: 0;
}

.workspace-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 1rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.workspace-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  color: var(--p-text-color);
  text-decoration: none;
  background: var(--p-content-background);
  border: 1px solid var(--p-content-border-color);
  border-radius: var(--p-content-border-radius);
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    transform 0.15s;
}

.workspace-card:hover,
.workspace-card:focus-visible {
  border-color: var(--p-primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
  outline: none;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 2.5rem;
  height: 2.5rem;
  font-weight: 600;
  color: var(--p-primary-contrast-color);
  background: var(--p-primary-color);
  border-radius: var(--p-content-border-radius);
}

.name {
  flex: 1 1 auto;
  min-width: 0;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron {
  flex: 0 0 auto;
  font-size: 1.25rem;
  color: var(--p-text-muted-color);
}

@media (max-width: 640px) {
  .workspace-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .state {
    padding: 2rem 1rem;
  }
}
</style>
