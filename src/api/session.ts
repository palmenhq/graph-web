import { ref } from 'vue'

const STORAGE_KEY = 'graph-crm.session-token'

const readToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export const sessionToken = ref<string | null>(readToken())

export const setSessionToken = (token: string | null) => {
  sessionToken.value = token
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable (e.g. private mode); keep the in-memory token
  }
}

// Keep tabs in sync when logging in/out in another tab
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) sessionToken.value = event.newValue
})
