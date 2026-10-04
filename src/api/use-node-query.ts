import { useQuery } from '@tanstack/vue-query'
import { apiClient, url } from './index.ts'
import { useWorkspaceId } from './use-current-workspace-query.ts'

export type PropertyValueType =
  'text' | 'instagram' | 'tiktok' | 'phone' | 'email'

export const propertyValueTypes: { value: PropertyValueType; label: string }[] =
  [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
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
        .then((r) => r.data),
  })
}
