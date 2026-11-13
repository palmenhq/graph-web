import { useQuery } from '@tanstack/vue-query'
import { isAxiosError } from 'axios'
import { apiClient, url } from './index.ts'
import { useWorkspaceId } from './use-current-workspace-query.ts'

export type PropertyValueType =
  'text' | 'textarea' | 'instagram' | 'tiktok' | 'link' | 'phone' | 'email'

export const propertyValueTypes: { value: PropertyValueType; label: string }[] =
  [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'link', label: 'Link' },
  ]

export type PropertyValue = {
  nodeId: string
  propertyId: string
  propertyName: string
  valueType: PropertyValueType
  value?: string | null
  updatedAt?: string | null
}

export type Property = {
  id: string
  nodeTypeId: string
  name: string
  valueType: string
  createdAt: string
  workspaceId: string
}

export type FullNode = {
  id: string
  title: string
  nodeTypeId: string
  createdAt: string
  deletedAt?: string | null
  properties: PropertyValue[]
}

export const useNodeQuery = (nodeId: string) => {
  const workspaceId = useWorkspaceId()

  return useQuery({
    queryKey: ['w', workspaceId, 'nodes', 'byId', nodeId],
    queryFn: () =>
      apiClient
        .get<FullNode>(
          url`/workspaces/${workspaceId}/graph/nodes/getById?id=${nodeId}`,
        )
        .then((r) => r.data)
        .catch((r) => {
          if (
            isAxiosError(r) &&
            r.response?.status === 422 &&
            r.response?.data?.['code'] === 'node_not_found'
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
