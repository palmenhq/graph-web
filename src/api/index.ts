import axios from 'axios'
import { QueryClient } from '@tanstack/vue-query'

export const queryClient = new QueryClient()

export const apiClient = axios.create({
  baseURL: '/api',
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
