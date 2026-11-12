import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { apiClient, url } from './index.ts'
import { isAxiosError } from 'axios'

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
        .then((r) => r.data)
        .catch((r) => {
          if (
            isAxiosError(r) &&
            r.response?.status === 422 &&
            r.response?.data?.['code'] === 'workspace_not_found'
          ) {
            return null
          } else {
            throw r
          }
        }),
    retry: (failureCount, error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined
      if (status !== undefined && status >= 400 && status < 500) {
        return false
      }
      return failureCount < 3
    },
  })
}
