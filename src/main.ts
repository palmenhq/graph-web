import { createApp } from 'vue'
import App from './app.vue'
import { setupOpenVue } from './setup/open-vue.ts'
import { setupRouter } from './setup/router.ts'
import { VueQueryPlugin } from '@tanstack/vue-query'
import './index.css'

const app = createApp(App)

setupOpenVue(app)
setupRouter(app)

app.use(VueQueryPlugin)

app.mount('#app')
