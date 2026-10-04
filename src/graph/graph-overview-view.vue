<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useCurrentWorkspaceQuery } from '../api/use-current-workspace-query.ts'
import PageHeader from '../layout/page-header.vue'
import Spinner from '../design/spinner.vue'
import {
  type NodeType,
  useNodeTypesQuery,
} from '../api/use-node-types-query.ts'
import { type Node, useNodesQuery } from '../api/use-nodes-query.ts'
import NewNodeTypeForm from './new-node-type-form.vue'
import NewNodeForm from './new-node-form.vue'

const workspaceQuery = reactive(useCurrentWorkspaceQuery())

const nodeTypesQuery = reactive(useNodeTypesQuery())

const nodeTypes = computed<NodeType[]>(() => nodeTypesQuery.data?.items ?? [])

const nodesQuery = reactive(useNodesQuery())

const nodes = computed<Node[]>(() => nodesQuery.data?.items ?? [])

const nodeTypeTitle = (nodeTypeId: string) =>
  nodeTypes.value.find((nodeType) => nodeType.id === nodeTypeId)?.title

const newNodeDrawerVisible = ref(false)
const newNodeTypeDrawerVisible = ref(false)
const selectedNodeType = ref<NodeType | null>(null)

const openNewNodeDrawer = (nodeType: NodeType) => {
  selectedNodeType.value = nodeType
  newNodeDrawerVisible.value = true
}

const openNewNodeTypeDrawer = () => {
  newNodeTypeDrawerVisible.value = true
}

const splitButtonLabel = computed(() =>
  nodeTypes.value[0] ? `New ${nodeTypes.value[0].title}` : 'New Node Type',
)

const onSplitButtonClick = () => {
  const [first] = nodeTypes.value
  if (first) {
    openNewNodeDrawer(first)
  } else {
    openNewNodeTypeDrawer()
  }
}

const splitButtonModel = computed(() => {
  const [first, ...others] = nodeTypes.value
  if (!first) {
    return []
  }

  return [
    ...others.map((nodeType) => ({
      key: `nn-${nodeType.id}`,
      label: `New ${nodeType.title}`,
      command: () => openNewNodeDrawer(nodeType),
    })),
    ...(others.length > 0 ? [{ key: 'nntk', separator: true }] : []),
    {
      key: 'nnt',
      label: 'New Node Type',
      command: openNewNodeTypeDrawer,
    },
  ]
})
</script>

<template>
  <Spinner v-if="!workspaceQuery.isSuccess" />

  <template v-if="workspaceQuery.isSuccess">
    <PageHeader :back="{ to: '/w', label: 'Workspaces' }">
      <template #header>
        <h1>
          {{ workspaceQuery.data?.name }}
        </h1>
      </template>

      <template #actions>
        <SplitButton
          v-if="nodeTypes.length > 0"
          :label="splitButtonLabel"
          @click="onSplitButtonClick"
          :model="splitButtonModel"
        />
        <Button v-else @click="openNewNodeTypeDrawer">
          {{ splitButtonLabel }}
        </Button>
      </template>
    </PageHeader>

    <Panel header="Graph">
      <div v-if="nodeTypesQuery.isSuccess && nodeTypes.length > 0">
        <Spinner v-if="nodesQuery.isPending" />

        <div v-else-if="nodesQuery.isError">error</div>

        <div v-else-if="nodes.length === 0"><em>No nodes found</em></div>

        <ul v-else>
          <li v-for="node in nodes" :key="node.id">
            {{ node.title }}
            <em v-if="nodeTypeTitle(node.nodeTypeId)">
              ({{ nodeTypeTitle(node.nodeTypeId) }})
            </em>
          </li>
        </ul>
      </div>

      <Spinner v-else-if="nodeTypesQuery.isPending" />

      <div v-else>
        <div style="padding-bottom: 1rem"><em>No node types found</em></div>
        <div>
          <Button @click="openNewNodeTypeDrawer">Create Node Type</Button>
        </div>
      </div>
    </Panel>

    <Drawer
      v-model:visible="newNodeDrawerVisible"
      position="right"
      style="width: 30rem"
    >
      <NewNodeForm
        v-if="selectedNodeType"
        :key="selectedNodeType.id"
        :node-type="selectedNodeType"
        @success="newNodeDrawerVisible = false"
      />
    </Drawer>

    <Drawer
      v-model:visible="newNodeTypeDrawerVisible"
      position="right"
      style="width: 30rem"
    >
      <NewNodeTypeForm @success="newNodeTypeDrawerVisible = false" />
    </Drawer>
  </template>
</template>

<style scoped></style>
