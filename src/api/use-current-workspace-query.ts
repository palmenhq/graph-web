import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { apiClient, url } from './index.ts'

export interface Workspace {
  id: string
  name: string
}

export const useWorkspaceId = () => {
  const route = useRoute()

  return route.params.workspaceId as string
}

export const useCurrentWorkspaceQuery = () => {
  const workspaceId = useWorkspaceId()

  return useQuery({
    queryKey: ['workspaces', workspaceId],
    queryFn: () =>
      apiClient
        .get<Workspace>(url`/workspaces/getById?id=${workspaceId}`)
        .then((r) => r.data),
  })
}
