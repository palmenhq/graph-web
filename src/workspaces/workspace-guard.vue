<script setup lang="ts">
import { computed, reactive } from 'vue'
import {
  type Workspace,
  useCurrentWorkspaceQuery,
} from '../api/use-current-workspace-query.ts'
import Spinner from '../design/spinner.vue'

const workspaceQuery = reactive(useCurrentWorkspaceQuery())
const workspace = computed<Workspace | null>(() => workspaceQuery.data ?? null)
</script>

<template>
  <Spinner v-if="workspaceQuery.isPending" />
  <div v-else-if="workspaceQuery.isError || !workspace" class="guard-state">
    <template v-if="workspaceQuery.isError">
      <h2>Something went wrong</h2>
      <p class="guard-message">
        We couldn't load this workspace.
        <span class="guard-detail">{{ workspaceQuery.error?.message }}</span>
      </p>
    </template>
    <template v-else>
      <h2>No such workspace</h2>
      <p class="guard-message">
        This workspace doesn't exist, or you don't have access to it.
      </p>
    </template>

    <div class="guard-actions">
      <Button
        v-if="workspaceQuery.isError"
        severity="secondary"
        outlined
        :loading="workspaceQuery.isFetching"
        @click="workspaceQuery.refetch()"
      >
        Try again
      </Button>
      <RouterLink to="/w">
        <Button>&lsaquo; Back to workspaces</Button>
      </RouterLink>
    </div>
  </div>
  <slot v-else :workspace="workspace" />
</template>

<style scoped>
.guard-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  max-width: 28rem;
  margin: 4rem auto;
  padding: 2.5rem 2rem;
  text-align: center;
  border: 1px solid var(--p-content-border-color);
  border-radius: var(--p-content-border-radius);
  background: var(--p-content-background);
}

.guard-state h2 {
  margin: 0.5rem 0 0;
}

.guard-message {
  margin: 0;
  color: var(--p-text-muted-color);
}

.guard-detail {
  display: block;
  margin-top: 0.5rem;
  font-family: monospace;
  font-size: 0.875rem;
}

.guard-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1rem;
}
</style>
