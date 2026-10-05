import { isAxiosError } from 'axios'
import type { Router } from 'vue-router'
import { apiClient } from '../api'
import { setSessionToken } from '../api/session.ts'

export const LOGIN_PATH = '/login'

export const setupAuth = (router: Router) => {
  apiClient.interceptors.response.use(undefined, (error) => {
    if (
      isAxiosError(error) &&
      error.response?.status === 401 &&
      error.config?.url !== '/auth/token'
    ) {
      setSessionToken(null)

      const current = router.currentRoute.value
      if (current.path !== LOGIN_PATH) {
        void router.push({
          path: LOGIN_PATH,
          state: { redirect: current.fullPath },
        })
      }
    }
    return Promise.reject(error)
  })
}
