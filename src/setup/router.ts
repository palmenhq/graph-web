import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import WorkspaceListView from '../workspaces/workspace-list-view.vue'
import GraphOverviewView from '../graph/graph-overview-view.vue'

export const setupRouter = (app: App) => {
  const routes = [
    { path: '/w/:workspaceId', component: GraphOverviewView },
    { path: '/w', component: WorkspaceListView },
  ] satisfies RouteRecordRaw[]

  const router = createRouter({ history: createWebHistory(), routes })

  app.use(router)
}
