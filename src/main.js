import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'
import { initializeData } from './utils/storage.js'

import SearchPage from './pages/SearchPage.vue'
import RoutePage from './pages/RoutePage.vue'
import FavoritesPage from './pages/FavoritesPage.vue'
import AdminPage from './pages/AdminPage.vue'

initializeData()

const routes = [
  { path: '/', redirect: '/search' },
  { path: '/search', component: SearchPage, name: 'search' },
  { path: '/route/:departmentId', component: RoutePage, name: 'route' },
  { path: '/favorites', component: FavoritesPage, name: 'favorites' },
  { path: '/admin', component: AdminPage, name: 'admin' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const pinia = createPinia()
const app = createApp(App)

app.use(router)
app.use(pinia)
app.mount('#app')
