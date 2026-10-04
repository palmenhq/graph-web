<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useCurrentWorkspaceQuery,
  useWorkspaceId,
} from '../api/use-current-workspace-query.ts'
import PageHeader from '../layout/page-header.vue'
import Spinner from '../design/spinner.vue'
import {
  type NodeType,
  useNodeTypesQuery,
} from '../api/use-node-types-query.ts'
import { type Node, useNodesQuery } from '../api/use-nodes-query.ts'
import NewNodeTypeForm from './new-node-type-form.vue'
import NewNodeForm from './new-node-form.vue'
import NodeDialogContent from './node-dialog-content.vue'
import NodeTitleEditor from './node-title-editor.vue'
import NotesPanel from '../notes/notes-panel.vue'

const workspaceQuery = reactive(useCurrentWorkspaceQuery())

const nodeTypesQuery = reactive(useNodeTypesQuery())

const nodeTypes = computed<NodeType[]>(() => nodeTypesQuery.data?.items ?? [])

const nodesQuery = reactive(useNodesQuery())

const nodes = computed<Node[]>(() => nodesQuery.data?.items ?? [])

const nodeTypeTitle = (nodeTypeId: string) =>
  nodeTypes.value.find((nodeType) => nodeType.id === nodeTypeId)?.title

const route = useRoute()
const router = useRouter()
const workspaceId = useWorkspaceId()

const nodeLink = (node: Node) => `/w/${workspaceId}/nodes/${node.id}`

const selectedNodeId = computed(() => route.params.nodeId as string | undefined)

const selectedNode = computed<Node | null>(
  () => nodes.value.find((node) => node.id === selectedNodeId.value) ?? null,
)

const nodeDialogVisible = computed({
  get: () => !!selectedNodeId.value,
  set: (visible: boolean) => {
    if (!visible) {
      router.push(`/w/${workspaceId}`)
    }
  },
})

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
        <RouterLink :to="`/w/${workspaceQuery.data?.id}/settings`">
          <Button severity="secondary" text>Settings</Button>
        </RouterLink>
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

    <div class="overview-layout">
      <Panel header="Graph" class="overview-graph">
        <div v-if="nodeTypesQuery.isSuccess && nodeTypes.length > 0">
          <Spinner v-if="nodesQuery.isPending" />

          <div v-else-if="nodesQuery.isError">error</div>

          <div v-else-if="nodes.length === 0"><em>No nodes found</em></div>

          <div v-else class="node-grid">
            <RouterLink
              v-for="node in nodes"
              :key="node.id"
              :to="nodeLink(node)"
              class="node-card-link"
            >
              <Card style="background: var(--p-surface-800); height: 100%">
                <template #title>{{ node.title }}</template>
                <template v-if="nodeTypeTitle(node.nodeTypeId)" #subtitle>
                  {{ nodeTypeTitle(node.nodeTypeId) }}
                </template>
              </Card>
            </RouterLink>
          </div>
        </div>

        <Spinner v-else-if="nodeTypesQuery.isPending" />

        <div v-else>
          <div style="padding-bottom: 1rem"><em>No node types found</em></div>
          <div>
            <Button @click="openNewNodeTypeDrawer">Create Node Type</Button>
          </div>
        </div>
      </Panel>

      <NotesPanel class="overview-notes" :nodes="nodes" />
    </div>

    <Dialog
      v-model:visible="nodeDialogVisible"
      modal
      dismissable-mask
      style="
        width: 40rem;
        max-width: calc(100vw - 2rem);
        max-height: calc(100vh - 2rem);
      "
    >
      <template #header>
        <NodeTitleEditor
          v-if="selectedNode"
          :key="selectedNode.id"
          :node="selectedNode"
        />
      </template>

      <NodeDialogContent
        v-if="selectedNode"
        :key="selectedNode.id"
        :node="selectedNode"
        @deleted="nodeDialogVisible = false"
      />

      <Spinner v-else-if="nodesQuery.isPending" />

      <div v-else-if="nodesQuery.isError">error</div>

      <div v-else><em>Node not found</em></div>
    </Dialog>

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

<style scoped>
.overview-layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(18rem, 1fr);
  gap: 1rem;
  align-items: start;
}

@media (max-width: 960px) {
  .overview-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

.node-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 1rem;
}

.node-card-link {
  display: block;
  color: inherit;
  text-decoration: none;
  border-radius: var(--p-card-border-radius);
  border: 2px solid var(--p-content-border-color);
}

.node-card-link:hover,
.node-card-link:focus-visible {
  border: 2px solid var(--p-primary-color);
}
</style>
