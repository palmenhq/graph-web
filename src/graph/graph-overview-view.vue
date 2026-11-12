<script setup lang="ts">
import GraphOverview from './graph-overview.vue'
import WorkspaceGuard from '../workspaces/workspace-guard.vue'
</script>

<template>
  <WorkspaceGuard v-slot="{ workspace }">
    <GraphOverview :workspace="workspace" />
  </WorkspaceGuard>
</template>
