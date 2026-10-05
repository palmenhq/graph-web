import { createApp } from 'vue'
import App from './app.vue'
import { setupOpenVue } from './setup/open-vue.ts'
import { setupRouter } from './setup/router.ts'
import { setupAuth } from './setup/auth.ts'
import { VueQueryPlugin } from '@tanstack/vue-query'
import './index.css'
import { queryClient } from './api'

const app = createApp(App)

setupOpenVue(app)
const router = setupRouter(app)
setupAuth(router)

app.use(VueQueryPlugin, { queryClient })

app.mount('#app')
