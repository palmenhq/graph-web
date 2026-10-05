<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { isAxiosError } from 'axios'
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiClient } from '../api'
import { setSessionToken } from '../api/session.ts'
import FormGroup from '../design/form-group.vue'
import Spinner from '../design/spinner.vue'

const router = useRouter()
const queryClient = useQueryClient()

const redirectTarget = (): string => {
  const redirect: unknown = window.history.state?.redirect
  // Only allow in-app paths to avoid open redirects
  return typeof redirect === 'string' &&
    redirect.startsWith('/') &&
    !redirect.startsWith('//') &&
    !redirect.startsWith('/login')
    ? redirect
    : '/w'
}

const loginMutation = reactive(
  useMutation({
    mutationKey: ['auth', 'token'],
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiClient.post<{ token: string }>(
        '/auth/token',
        credentials,
        { baseURL: '/' },
      )
      return response.data
    },
    onSuccess: async ({ token }) => {
      setSessionToken(token)
      queryClient.clear()
      await router.replace(redirectTarget())
    },
  }),
)

const username = ref('')
const password = ref('')

const errorMessage = computed(() => {
  if (!loginMutation.isError) return null
  const error = loginMutation.error
  if (isAxiosError(error) && error.response?.status === 401) {
    return 'Invalid username or password'
  }
  return 'Something went wrong, please try again'
})
</script>

<template>
  <div class="login">
    <Panel header="Log in" class="login-panel">
      <form
        class="login-form"
        @submit.prevent="
          loginMutation.mutate({ username: username, password: password })
        "
      >
        <FormGroup>
          <IftaLabel>
            <InputText
              id="login-username"
              v-model="username"
              autocomplete="username"
              autofocus
              fluid
            />
            <label for="login-username">Username</label>
          </IftaLabel>
        </FormGroup>

        <FormGroup>
          <IftaLabel>
            <InputText
              id="login-password"
              type="password"
              v-model="password"
              autocomplete="current-password"
              fluid
            />
            <label for="login-password">Password</label>
          </IftaLabel>
        </FormGroup>

        <div v-if="errorMessage" class="login-error" role="alert">
          {{ errorMessage }}
        </div>

        <Button
          type="submit"
          :loading="loginMutation.isPending"
          :disabled="!username || !password"
        >
          <Spinner v-if="loginMutation.isPending" />
          Log in
        </Button>
      </form>
    </Panel>
  </div>
</template>

<style scoped>
.login {
  display: flex;
  justify-content: center;
  padding-top: 4rem;
}

.login-panel {
  width: 100%;
  max-width: 24rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
}

.login-error {
  align-self: stretch;
  color: var(--p-red-500);
}
</style>
