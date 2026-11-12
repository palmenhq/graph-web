<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
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
import { type Node, useNodeSearchQuery } from '../api/use-nodes-query.ts'
import NewNodeTypeForm from './new-node-type-form.vue'
import NewNodeForm from './new-node-form.vue'
import NodeDialogContent from './node-dialog-content.vue'
import { flattenPages } from '../api/api-list.ts'
import { getNodeTypeTitle } from './helpers.ts'
import Menu from 'openvue/menu'
import { url } from '../api'

const workspaceQuery = reactive(useCurrentWorkspaceQuery())

const nodeTypesQuery = reactive(useNodeTypesQuery())

const nodeTypes = computed<NodeType[]>(() => nodeTypesQuery.data?.items ?? [])

const nodeTypeFilter = ref<string | null>(null)
const selectedNodeTypeTitle = computed(
  () =>
    nodeTypes.value.find((nodeType) => nodeType.id === nodeTypeFilter.value)
      ?.title,
)
const nodeTypeFilterMenu = ref<{ toggle: (event: Event) => void }>()
const nodeTypeFilterMenuItems = computed(() => [
  {
    label: nodeTypeFilter.value ? 'All types' : '✓ All types',
    command: () => {
      nodeTypeFilter.value = null
    },
  },
  { separator: true },
  ...nodeTypes.value.map((nodeType) => ({
    label:
      nodeType.id === nodeTypeFilter.value
        ? `✓ ${nodeType.title}`
        : nodeType.title,
    command: () => {
      nodeTypeFilter.value = nodeType.id
    },
  })),
])

const toggleNodeTypeFilterMenu = (event: Event) =>
  nodeTypeFilterMenu.value?.toggle(event)

watch(nodeTypes, (types) => {
  if (
    nodeTypeFilter.value &&
    !types.some((nodeType) => nodeType.id === nodeTypeFilter.value)
  ) {
    nodeTypeFilter.value = null
  }
})

const searchInput = ref('')
const search = ref('')

let searchTimeout: ReturnType<typeof setTimeout> | undefined

watch(searchInput, (value) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    search.value = value
  }, 300)
})

onBeforeUnmount(() => clearTimeout(searchTimeout))

const clearSearch = () => {
  searchInput.value = ''
  clearTimeout(searchTimeout)
  search.value = ''
}

const searchQuery = reactive(useNodeSearchQuery(search, nodeTypeFilter))

const searchedNodes = computed<Node[]>(() => flattenPages(searchQuery.data))

const route = useRoute()
const router = useRouter()
const workspaceId = useWorkspaceId()

const nodeLink = (node: Node) => `/w/${workspaceId}/nodes/${node.id}`

const selectedNodeId = computed(() => route.params.nodeId as string | undefined)

const closeNodeDialog = () => router.push(`/w/${workspaceId}`)

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
  nodeTypes.value[0] ? `New ${nodeTypes.value[0].title}` : 'New Type',
)

const onNewNodeCreated = (newNode: Node) => {
  newNodeDrawerVisible.value = false
  router.push(url`/w/${workspaceId}/nodes/${newNode.id}`)
}

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
      label: 'New Type',
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
      <div
        v-if="nodeTypesQuery.isSuccess && nodeTypes.length > 0"
        class="search-controls"
      >
        <Button
          type="button"
          :severity="nodeTypeFilter ? 'primary' : 'secondary'"
          :outlined="!!nodeTypeFilter"
          :text="!nodeTypeFilter"
          :aria-label="
            selectedNodeTypeTitle
              ? `Filter by node type: ${selectedNodeTypeTitle}`
              : 'Filter by node type'
          "
          class="filter-toggle"
          @click="toggleNodeTypeFilterMenu"
        >
          <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M2 3h12l-4.5 5.2v4.3l-3 1V8.2L2 3z" />
          </svg>
          <span v-if="selectedNodeTypeTitle">{{ selectedNodeTypeTitle }}</span>
        </Button>
        <Menu ref="nodeTypeFilterMenu" :model="nodeTypeFilterMenuItems" popup />
        <div class="search-field">
          <InputText
            v-model="searchInput"
            type="search"
            placeholder="Search"
            aria-label="Search"
            class="search-input"
            @keydown.esc="clearSearch"
          />
          <button
            v-if="searchInput"
            type="button"
            class="search-clear"
            aria-label="Clear search"
            @click="clearSearch"
          >
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
      </div>

      <div class="overview-graph">
        <div v-if="nodeTypesQuery.isSuccess && nodeTypes.length > 0">
          <Spinner v-if="searchQuery.isPending" />

          <div v-else-if="searchQuery.isError">error</div>

          <div v-else-if="searchedNodes.length === 0">
            <em>No results found</em>
          </div>

          <div
            v-else
            class="node-grid"
            :class="{ 'node-grid-stale': searchQuery.isPlaceholderData }"
          >
            <RouterLink
              v-for="node in searchedNodes"
              :key="node.id"
              :to="nodeLink(node)"
              class="node-card-link"
            >
              <Card style="height: 100%">
                <template #title>{{ node.title }}</template>
                <template
                  v-if="getNodeTypeTitle(nodeTypes, node.nodeTypeId)"
                  #subtitle
                >
                  {{ getNodeTypeTitle(nodeTypes, node.nodeTypeId) }}
                </template>
              </Card>
            </RouterLink>
          </div>

          <div
            v-if="searchQuery.hasNextPage && !searchQuery.isPlaceholderData"
            class="load-more"
          >
            <Button
              severity="secondary"
              :loading="searchQuery.isFetchingNextPage"
              @click="searchQuery.fetchNextPage()"
            >
              Load more
            </Button>
          </div>
        </div>

        <Spinner v-else-if="nodeTypesQuery.isPending" />

        <div v-else>
          <div style="padding-bottom: 1rem"><em>No types found</em></div>
          <div>
            <Button @click="openNewNodeTypeDrawer">Create Type</Button>
          </div>
        </div>
      </div>
    </div>

    <NodeDialogContent
      v-if="selectedNodeId"
      :key="selectedNodeId"
      :node-id="selectedNodeId"
      @close="closeNodeDialog"
    />

    <Drawer
      v-model:visible="newNodeDrawerVisible"
      position="right"
      style="width: 30rem"
    >
      <NewNodeForm
        v-if="selectedNodeType"
        :key="selectedNodeType.id"
        :node-type="selectedNodeType"
        @success="onNewNodeCreated"
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
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.search-controls {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-left: auto;
}

.filter-toggle {
  flex: 0 1 auto;
  min-width: 0;
  max-width: min(50%, 14rem);
}

.filter-toggle svg {
  flex: 0 0 auto;
}

.filter-toggle span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-field {
  position: relative;
  display: inline-flex;
  flex: 1 1 auto;
  align-items: center;
  min-width: 0;
}

.search-input {
  width: 100%;
  padding-right: 2.25rem;
}

.search-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}

.search-clear {
  position: absolute;
  right: 0.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--p-text-muted-color);
  cursor: pointer;
}

.search-clear:hover,
.search-clear:focus-visible {
  color: var(--p-text-color);
}

.node-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 1rem;
}

@media (max-width: 640px) {
  .overview-layout {
    gap: 0.5rem;
  }

  .node-grid {
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
    gap: 0.5rem;
  }
}

.node-grid-stale {
  opacity: 0.6;
}

.load-more {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
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
