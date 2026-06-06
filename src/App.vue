<template>
  <div class="app">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title" @click="$router.push('/')">🏥 医院无障碍寻路</h1>
        <nav class="nav-tabs">
          <router-link to="/search" class="nav-link" active-class="active">
            🔍 搜索
          </router-link>
          <router-link to="/favorites" class="nav-link" active-class="active">
            ⭐ 收藏
          </router-link>
          <router-link to="/admin" class="nav-link" active-class="active">
            🛠️ 导医台
          </router-link>
        </nav>
      </div>
      <div class="header-settings">
        <label class="setting-toggle">
          <input type="checkbox" v-model="settings.wheelchairMode" @change="saveSettings">
          <span>♿ 轮椅模式</span>
        </label>
        <label class="setting-toggle">
          <input type="checkbox" v-model="settings.emergencyMode" @change="saveSettings">
          <span>🚑 急诊优先</span>
        </label>
      </div>
    </header>
    <main class="app-main">
      <router-view />
    </main>
    <footer class="app-footer">
      <span>当前时间: {{ currentTime }}</span>
      <span v-if="lastNavigation" @click="restoreLastNavigation" class="restore-link">
        🔄 恢复上次导航
      </span>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getSettings, updateSettings, getLastNavigation } from './utils/storage.js'

const router = useRouter()
const currentTime = ref('')
const settings = ref(getSettings())
const lastNavigation = ref(getLastNavigation())

let timer = null

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function saveSettings() {
  updateSettings(settings.value)
}

function restoreLastNavigation() {
  const last = getLastNavigation()
  if (last && last.departmentId) {
    router.push(`/route/${last.departmentId}`)
  }
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 60000)
  
  window.addEventListener('storage', () => {
    lastNavigation.value = getLastNavigation()
  })
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
}

.app-header {
  background: linear-gradient(90deg, #1976d2, #7b1fa2);
  color: white;
  padding: 12px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.app-title {
  margin: 0;
  font-size: 20px;
  cursor: pointer;
  user-select: none;
}

.nav-tabs {
  display: flex;
  gap: 8px;
}

.nav-link {
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s;
  font-size: 14px;
}

.nav-link:hover {
  background: rgba(255,255,255,0.15);
  color: white;
}

.nav-link.active {
  background: white;
  color: #1976d2;
  font-weight: 500;
}

.header-settings {
  display: flex;
  gap: 16px;
  padding-top: 8px;
  flex-wrap: wrap;
}

.setting-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
}

.setting-toggle input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.app-main {
  flex: 1;
  padding: 24px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.app-footer {
  background: #f5f5f5;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #666;
  border-top: 1px solid #e0e0e0;
}

.restore-link {
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}

.restore-link:hover {
  color: #7b1fa2;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .nav-tabs {
    width: 100%;
    justify-content: flex-start;
  }
  
  .app-main {
    padding: 16px;
  }
}
</style>
