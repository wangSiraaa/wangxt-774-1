<template>
  <div class="search-page">
    <div class="search-container">
      <div class="search-box">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="输入科室名称，如：内科、儿科、CT..."
          class="search-input"
          @input="handleSearch"
          ref="searchInput"
        >
        <button class="search-btn" @click="handleSearch">🔍 搜索</button>
      </div>
      
      <div class="quick-tags">
        <span class="tag-label">快速选择：</span>
        <span
          v-for="dept in hotDepartments"
          :key="dept.id"
          class="quick-tag"
          @click="goToRoute(dept.id)"
        >
          {{ dept.name }}
        </span>
      </div>
    </div>

    <div v-if="searchKeyword && searchResults.length === 0" class="no-results">
      <p>😔 未找到与 "{{ searchKeyword }}" 相关的科室</p>
      <p class="tip">试试其他关键词，如：内科、外科、儿科、眼科...</p>
    </div>

    <div v-if="searchResults.length > 0" class="results-section">
      <h3>搜索结果 ({{ searchResults.length }})</h3>
      <div class="dept-grid">
        <div
          v-for="dept in searchResults"
          :key="dept.id"
          class="dept-card"
          @click="goToRoute(dept.id)"
        >
          <div class="dept-icon">🏥</div>
          <div class="dept-info">
            <h4 class="dept-name">{{ dept.name }}</h4>
            <p class="dept-location">📍 {{ dept.building }}栋 {{ dept.floor }} {{ dept.zone }}</p>
            <p class="dept-time">⏰ {{ dept.openTime }}</p>
            <div class="dept-tags">
              <span v-if="dept.isEmergency" class="tag emergency">急诊</span>
              <span v-if="isOpenNow(dept)" class="tag open">开放中</span>
              <span v-else class="tag closed">已关闭</span>
              <span v-for="alias in dept.aliases.slice(0, 2)" :key="alias" class="tag alias">{{ alias }}</span>
            </div>
          </div>
          <div class="dept-arrow">→</div>
        </div>
      </div>
    </div>

    <div v-if="!searchKeyword" class="all-departments">
      <h3>全部科室</h3>
      <div class="building-section" v-for="building in buildings" :key="building.id">
        <h4 class="building-title">{{ building.name }} ({{ building.id }}栋)</h4>
        <div class="floor-section" v-for="floor in building.floors" :key="floor">
          <h5 class="floor-title">{{ floor }}</h5>
          <div class="dept-list">
            <div
              v-for="dept in getDeptsByBuildingFloor(building.id, floor)"
              :key="dept.id"
              class="dept-item"
              @click="goToRoute(dept.id)"
            >
              <span class="dept-item-name">{{ dept.name }}</span>
              <span class="dept-item-zone">{{ dept.zone }}</span>
              <span v-if="dept.isEmergency" class="emergency-badge">🚑</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { searchDepartments, getDepartments, getBuildings } from '../utils/storage.js'
import { isTimeInRange, getCurrentTime } from '../utils/routeCalculator.js'

const router = useRouter()
const searchKeyword = ref('')
const searchResults = ref([])
const allDepartments = ref([])
const buildings = ref([])
const searchInput = ref(null)

const hotDepartments = computed(() => {
  return allDepartments.value.filter(d => 
    ['internal', 'surgery', 'pediatrics', 'radiology', 'laboratory', 'pharmacy'].includes(d.id)
  )
})

function handleSearch() {
  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    return
  }
  searchResults.value = searchDepartments(searchKeyword.value)
}

function goToRoute(deptId) {
  router.push(`/route/${deptId}`)
}

function isOpenNow(dept) {
  return isTimeInRange(dept.openTime, getCurrentTime())
}

function getDeptsByBuildingFloor(building, floor) {
  return allDepartments.value.filter(d => d.building === building && d.floor === floor)
}

onMounted(() => {
  allDepartments.value = getDepartments()
  buildings.value = getBuildings()
  searchInput.value?.focus()
})
</script>

<style scoped>
.search-page {
  max-width: 900px;
  margin: 0 auto;
}

.search-container {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  margin-bottom: 24px;
}

.search-box {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  padding: 14px 18px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.3s;
  outline: none;
}

.search-input:focus {
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.search-btn {
  padding: 14px 28px;
  background: linear-gradient(135deg, #1976d2, #7b1fa2);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s;
}

.search-btn:hover {
  transform: translateY(-2px);
}

.quick-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-label {
  color: #666;
  font-size: 14px;
}

.quick-tag {
  padding: 6px 14px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-tag:hover {
  background: #bbdefb;
}

.no-results {
  background: white;
  padding: 48px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 24px;
}

.no-results p {
  margin: 8px 0;
  color: #666;
}

.no-results .tip {
  color: #999;
  font-size: 14px;
}

.results-section h3,
.all-departments h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
}

.dept-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.dept-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  gap: 12px;
  align-items: center;
}

.dept-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.dept-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.dept-info {
  flex: 1;
  min-width: 0;
}

.dept-name {
  margin: 0 0 6px 0;
  font-size: 16px;
  color: #333;
}

.dept-location,
.dept-time {
  margin: 2px 0;
  font-size: 13px;
  color: #666;
}

.dept-tags {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.tag.emergency {
  background: #ffebee;
  color: #c62828;
}

.tag.open {
  background: #e8f5e9;
  color: #2e7d32;
}

.tag.closed {
  background: #f5f5f5;
  color: #9e9e9e;
}

.tag.alias {
  background: #f3e5f5;
  color: #7b1fa2;
}

.dept-arrow {
  font-size: 24px;
  color: #ccc;
  flex-shrink: 0;
}

.building-section {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.building-title {
  margin: 0 0 12px 0;
  color: #1976d2;
  font-size: 16px;
}

.floor-section {
  margin-bottom: 12px;
}

.floor-title {
  margin: 0 0 8px 0;
  color: #7b1fa2;
  font-size: 14px;
  padding-left: 8px;
  border-left: 3px solid #7b1fa2;
}

.dept-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dept-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.dept-item:hover {
  background: #f5f5f5;
}

.dept-item-name {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.dept-item-zone {
  font-size: 12px;
  color: #999;
}

.emergency-badge {
  font-size: 16px;
}

@media (max-width: 600px) {
  .dept-grid {
    grid-template-columns: 1fr;
  }
  
  .search-box {
    flex-direction: column;
  }
}
</style>
