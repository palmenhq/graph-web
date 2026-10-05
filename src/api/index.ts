import axios from 'axios'
import { QueryClient } from '@tanstack/vue-query'
import { sessionToken } from './session.ts'

export const queryClient = new QueryClient()

export const apiClient = axios.create({
  baseURL: '/api',
})

apiClient.interceptors.request.use((config) => {
  if (sessionToken.value) {
    config.headers.set('X-Session-Token', sessionToken.value)
  }
  return config
})

export const url = (
  strings: TemplateStringsArray,
  ...values: (string | number | boolean)[]
): string =>
  strings.reduce(
    (result, str, i) =>
      result +
      str +
      (i < values.length ? encodeURIComponent(String(values[i])) : ''),
    '',
  )
