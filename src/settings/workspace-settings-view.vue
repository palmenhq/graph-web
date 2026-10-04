<script setup lang="ts">
import { reactive } from 'vue'
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

const workspaceId = useWorkspaceId()
const workspaceQuery = reactive(useCurrentWorkspaceQuery())
const nodeTypesQuery = reactive(useNodeTypesQuery())
const edgeTypesQuery = reactive(useEdgeTypesQuery())
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
      <Panel header="Node Types">
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
            <em>No node types</em>
          </template>
        </DataView>
      </Panel>

      <Panel header="Edge Types">
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
            <em>No edge types</em>
          </template>
        </DataView>
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
</style>
