<template>
  <div class="favorites-page">
    <div class="page-header">
      <h2>⭐ 我的收藏路线</h2>
      <p class="subtitle">陪诊人可收藏常用科室路线</p>
    </div>

    <div v-if="favorites.length === 0" class="empty-state">
      <div class="empty-icon">📌</div>
      <p>暂无收藏的路线</p>
      <p class="tip">搜索科室后，点击"收藏路线"按钮可保存常用路线</p>
      <button class="go-search-btn" @click="$router.push('/search')">去搜索科室</button>
    </div>

    <div v-else class="favorites-list">
      <div v-for="fav in favorites" :key="fav.id" class="favorite-card">
        <div class="fav-icon">🏥</div>
        <div class="fav-content" @click="goToRoute(fav.departmentId)">
          <h4 class="fav-name">{{ fav.department?.name }}</h4>
          <p class="fav-location">
            📍 {{ fav.department?.building }}栋 {{ fav.department?.floor }} {{ fav.department?.zone }}
          </p>
          <p class="fav-time">⏰ {{ fav.department?.openTime }}</p>
          <div class="fav-tags">
            <span v-if="fav.options?.wheelchairMode" class="tag wheelchair">♿ 无障碍</span>
            <span v-if="fav.options?.emergencyMode" class="tag emergency">🚑 急诊优先</span>
            <span class="tag time">收藏于 {{ formatDate(fav.createdAt) }}</span>
          </div>
        </div>
        <button class="delete-btn" @click.stop="removeFav(fav.id)">
          🗑️
        </button>
      </div>
    </div>

    <div v-if="lastNavigation" class="last-navigation">
      <h3>🔄 上次导航</h3>
      <div class="last-nav-card" @click="goToRoute(lastNavigation.departmentId)">
        <div class="nav-info">
          <h4>{{ lastNavigation.department?.name }}</h4>
          <p>{{ lastNavigation.department?.building }}栋 {{ lastNavigation.department?.floor }}</p>
        </div>
        <span class="nav-time">{{ formatDate(lastNavigation.timestamp) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getFavorites, removeFavorite, getLastNavigation } from '../utils/storage.js'

const router = useRouter()
const favorites = ref([])
const lastNavigation = ref(null)

function loadFavorites() {
  favorites.value = getFavorites().sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  )
}

function removeFav(id) {
  removeFavorite(id)
  loadFavorites()
}

function goToRoute(deptId) {
  router.push(`/route/${deptId}`)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  return date.toLocaleDateString('zh-CN')
}

function loadLastNav() {
  lastNavigation.value = getLastNavigation()
}

onMounted(() => {
  loadFavorites()
  loadLastNav()
})
</script>

<style scoped>
.favorites-page {
  max-width: 700px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.subtitle {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.empty-state {
  background: white;
  padding: 60px 40px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 8px 0;
  color: #666;
}

.empty-state .tip {
  color: #999;
  font-size: 14px;
  margin-bottom: 24px;
}

.go-search-btn {
  background: linear-gradient(135deg, #1976d2, #7b1fa2);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 24px;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s;
}

.go-search-btn:hover {
  transform: translateY(-2px);
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.favorite-card {
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s;
}

.favorite-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.fav-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.fav-content {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.fav-name {
  margin: 0 0 6px 0;
  font-size: 16px;
  color: #333;
}

.fav-location,
.fav-time {
  margin: 2px 0;
  font-size: 13px;
  color: #666;
}

.fav-tags {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
}

.tag.wheelchair {
  background: #e3f2fd;
  color: #1565c0;
}

.tag.emergency {
  background: #fce4ec;
  color: #ad1457;
}

.tag.time {
  background: #f5f5f5;
  color: #757575;
}

.delete-btn {
  background: #ffebee;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}

.delete-btn:hover {
  background: #ffcdd2;
}

.last-navigation {
  margin-top: 32px;
}

.last-navigation h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
}

.last-nav-card {
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.2s;
}

.last-nav-card:hover {
  transform: translateY(-2px);
}

.nav-info h4 {
  margin: 0 0 4px 0;
  color: #e65100;
  font-size: 16px;
}

.nav-info p {
  margin: 0;
  color: #ef6c00;
  font-size: 13px;
}

.nav-time {
  font-size: 12px;
  color: #ff9800;
}
</style>
