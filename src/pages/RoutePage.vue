<template>
  <div class="route-page">
    <div class="route-header" v-if="result">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <div class="dept-summary">
        <h2>{{ result.department?.name }}</h2>
        <p>📍 {{ result.department?.building }}栋 {{ result.department?.floor }} {{ result.department?.zone }}</p>
        <div class="status-badges">
          <span v-if="result.departmentOpen" class="badge open">✅ 开放中</span>
          <span v-else class="badge closed">⏰ 非开放时间</span>
          <span v-if="result.options?.wheelchairMode" class="badge wheelchair">♿ 无障碍路线</span>
          <span v-if="result.options?.emergencyMode" class="badge emergency">🚑 急诊优先</span>
        </div>
      </div>
      <button class="favorite-btn" @click="toggleFavorite" :class="{ active: isFavorited }">
        {{ isFavorited ? '⭐ 已收藏' : '☆ 收藏路线' }}
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>正在计算最优路线...</p>
    </div>

    <div v-else-if="result && result.success" class="route-content">
      <div v-if="result.routes.length === 0" class="no-route">
        <p>😔 未找到可用路线</p>
        <p class="tip">请尝试调整设置，或联系导医台</p>
      </div>

      <div v-else>
        <div class="route-tabs">
          <button
            v-for="(route, index) in result.routes"
            :key="route.id"
            class="route-tab"
            :class="{ active: selectedRouteIndex === index }"
            @click="selectedRouteIndex = index"
          >
            <span class="route-label">方案 {{ index + 1 }}</span>
            <span class="route-entrance">{{ route.entrance.name }}</span>
            <span class="route-info">⏱️ {{ route.estimatedTime }}分钟</span>
            <span v-if="index === 0" class="recommended-badge">✨ 推荐</span>
          </button>
        </div>

        <div v-if="currentRoute" class="route-detail">
          <div v-if="currentRoute.warnings.length > 0" class="warnings">
            <div v-for="(warning, i) in currentRoute.warnings" :key="i" class="warning-item">
              ⚠️ {{ warning }}
            </div>
          </div>

          <div class="route-steps">
            <div
              v-for="(step, index) in currentRoute.steps"
              :key="index"
              class="step-item"
              :class="{ first: index === 0, last: index === currentRoute.steps.length - 1 }"
            >
              <div class="step-connector" v-if="index < currentRoute.steps.length - 1"></div>
              <div class="step-icon">
                <span v-if="step.icon === 'door'">🚪</span>
                <span v-else-if="step.icon === 'elevator'">🛗</span>
                <span v-else-if="step.icon === 'walk'">🚶</span>
                <span v-else-if="step.icon === 'location'">📍</span>
                <span v-else>📍</span>
              </div>
              <div class="step-content">
                <h4 class="step-title">{{ step.title }}</h4>
                <p class="step-desc">{{ step.description }}</p>
                <div v-if="step.type === 'elevator' && step.detail" class="step-extra">
                  <span :class="step.detail.status === 'running' ? 'status-ok' : 'status-bad'">
                    {{ step.detail.status === 'running' ? '✅ 电梯运行中' : '❌ 电梯停用' }}
                  </span>
                  <span v-if="step.detail.isWheelchair" class="wheelchair-tag">♿ 无障碍</span>
                </div>
                <div v-if="step.type === 'entrance' && step.detail" class="step-extra">
                  <span>开放时间: {{ step.detail.openTime }}</span>
                  <span v-if="step.detail.isWheelchair" class="wheelchair-tag">♿ 无障碍</span>
                  <span v-if="step.detail.isEmergency" class="emergency-tag">🚑 急诊入口</span>
                </div>
              </div>
            </div>
          </div>

          <div class="route-summary">
            <div class="summary-item">
              <span class="summary-label">预估时间</span>
              <span class="summary-value">{{ currentRoute.estimatedTime }} 分钟</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">步行距离</span>
              <span class="summary-value">{{ currentRoute.totalDistance }} 米</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">使用电梯</span>
              <span class="summary-value">{{ currentRoute.usedElevators?.length || 0 }} 部</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="result && !result.success" class="error">
      <p>❌ {{ result.error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { calculateRoutes } from '../utils/routeCalculator.js'
import { setLastNavigation, getFavorites, addFavorite, removeFavorite, getSettings } from '../utils/storage.js'

const route = useRoute()
const loading = ref(true)
const result = ref(null)
const selectedRouteIndex = ref(0)

const currentRoute = computed(() => {
  return result.value?.routes?.[selectedRouteIndex.value] || null
})

const isFavorited = computed(() => {
  if (!result.value?.department) return false
  const deptId = result.value.department.id
  return getFavorites().some(f => f.departmentId === deptId)
})

async function loadRoute() {
  loading.value = true
  const deptId = route.params.departmentId
  
  await new Promise(r => setTimeout(r, 300))
  
  result.value = calculateRoutes(deptId)
  
  if (result.value && result.value.success) {
    setLastNavigation({
      departmentId: deptId,
      department: result.value.department,
      routes: result.value.routes
    })
  }
  
  loading.value = false
}

function toggleFavorite() {
  if (!result.value?.department) return
  
  const deptId = result.value.department.id
  const favs = getFavorites()
  const existing = favs.find(f => f.departmentId === deptId)
  
  if (existing) {
    removeFavorite(existing.id)
  } else {
    addFavorite({
      departmentId: deptId,
      department: result.value.department,
      options: getSettings()
    })
  }
}

onMounted(() => {
  loadRoute()
})

watch(() => route.params.departmentId, () => {
  selectedRouteIndex.value = 0
  loadRoute()
})
</script>

<style scoped>
.route-page {
  max-width: 800px;
  margin: 0 auto;
}

.route-header {
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.back-btn {
  background: #f5f5f5;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;
}

.back-btn:hover {
  background: #e0e0e0;
}

.dept-summary {
  flex: 1;
  min-width: 0;
}

.dept-summary h2 {
  margin: 0 0 8px 0;
  font-size: 22px;
  color: #333;
}

.dept-summary p {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}

.status-badges {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.badge.open {
  background: #e8f5e9;
  color: #2e7d32;
}

.badge.closed {
  background: #ffebee;
  color: #c62828;
}

.badge.wheelchair {
  background: #e3f2fd;
  color: #1565c0;
}

.badge.emergency {
  background: #fce4ec;
  color: #ad1457;
}

.favorite-btn {
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.favorite-btn:hover {
  transform: scale(1.05);
}

.favorite-btn.active {
  background: linear-gradient(135deg, #fbc02d, #f9a825);
}

.loading {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.route-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.route-tab {
  background: white;
  border: 2px solid transparent;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
  transition: all 0.2s;
  position: relative;
}

.route-tab:hover {
  border-color: #bbdefb;
}

.route-tab.active {
  border-color: #1976d2;
  background: #e3f2fd;
}

.route-label {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.route-entrance {
  font-size: 12px;
  color: #666;
}

.route-info {
  font-size: 12px;
  color: #1976d2;
}

.recommended-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
}

.route-detail {
  background: white;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.warnings {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #fff8e1;
  border-radius: 8px;
  border-left: 4px solid #ff9800;
}

.warning-item {
  color: #e65100;
  font-size: 14px;
  margin: 4px 0;
}

.route-steps {
  position: relative;
  padding-left: 10px;
}

.step-item {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  position: relative;
}

.step-connector {
  position: absolute;
  left: 19px;
  top: 56px;
  bottom: -16px;
  width: 2px;
  background: #e0e0e0;
}

.step-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #1976d2, #7b1fa2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  z-index: 1;
}

.step-content {
  flex: 1;
  padding-top: 6px;
}

.step-title {
  margin: 0 0 6px 0;
  font-size: 16px;
  color: #333;
}

.step-desc {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #555;
}

.step-extra {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.step-extra span {
  font-size: 12px;
  color: #666;
}

.status-ok {
  color: #2e7d32 !important;
}

.status-bad {
  color: #c62828 !important;
}

.wheelchair-tag {
  background: #e3f2fd;
  color: #1565c0 !important;
  padding: 2px 8px;
  border-radius: 10px;
}

.emergency-tag {
  background: #fce4ec;
  color: #ad1457 !important;
  padding: 2px 8px;
  border-radius: 10px;
}

.route-summary {
  display: flex;
  gap: 24px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  justify-content: center;
}

.summary-item {
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.summary-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #1976d2;
}

.no-route,
.error {
  background: white;
  padding: 48px;
  border-radius: 12px;
  text-align: center;
}

.no-route p,
.error p {
  margin: 8px 0;
}

.no-route .tip {
  color: #999;
  font-size: 14px;
}

@media (max-width: 600px) {
  .route-header {
    flex-direction: column;
  }
  
  .route-tabs {
    flex-direction: column;
  }
  
  .route-summary {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
