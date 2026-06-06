<template>
  <div class="history-page">
    <div class="page-header">
      <h2>📋 历史筛查</h2>
      <p class="subtitle">查看和筛选历史导航记录</p>
    </div>

    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-item">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索科室名称、业务编号..."
            class="search-input"
            @input="applyFilters"
          >
        </div>
        <div class="filter-item">
          <label class="filter-label">
            <input type="checkbox" v-model="filters.wheelchairMode" @change="applyFilters">
            <span>♿ 轮椅模式</span>
          </label>
        </div>
        <div class="filter-item">
          <label class="filter-label">
            <input type="checkbox" v-model="filters.emergencyMode" @change="applyFilters">
            <span>🚑 急诊优先</span>
          </label>
        </div>
      </div>
      <div class="filter-row date-row">
        <div class="filter-item">
          <label class="date-label">开始日期:</label>
          <input type="date" v-model="filters.startDate" @change="applyFilters" class="date-input">
        </div>
        <div class="filter-item">
          <label class="date-label">结束日期:</label>
          <input type="date" v-model="filters.endDate" @change="applyFilters" class="date-input">
        </div>
        <div class="filter-item">
          <button class="reset-btn" @click="resetFilters">🔄 重置筛选</button>
        </div>
      </div>
    </div>

    <div v-if="filteredHistory.length === 0" class="empty-state">
      <p v-if="history.length === 0">📭 暂无历史记录</p>
      <p v-else>😔 没有符合筛选条件的记录</p>
    </div>

    <div v-else class="history-list">
      <div class="list-header">
        <span>共 {{ filteredHistory.length }} 条记录</span>
        <button v-if="history.length > 0" class="clear-btn" @click="confirmClearAll">
          🗑️ 清空历史
        </button>
      </div>

      <div
        v-for="item in filteredHistory"
        :key="item.id"
        class="history-card"
      >
        <div class="card-header">
          <div class="dept-info" @click="goToRoute(item.departmentId)">
            <span class="dept-name">{{ item.department?.name }}</span>
            <span class="dept-location">📍 {{ item.department?.building }}栋 {{ item.department?.floor }} {{ item.department?.zone }}</span>
          </div>
          <div class="card-actions">
            <span class="business-no">📋 {{ item.businessNo }}</span>
            <button class="action-btn go-btn" @click="goToRoute(item.departmentId)" title="重新导航">
              🧭 重新导航
            </button>
            <button class="action-btn delete-btn" @click="deleteItem(item.id)" title="删除记录">
              ✕
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="tags">
            <span v-if="item.options?.wheelchairMode" class="tag wheelchair">♿ 轮椅模式</span>
            <span v-if="item.options?.emergencyMode" class="tag emergency">🚑 急诊优先</span>
          </div>
          <span class="create-time">🕐 {{ formatDate(item.createdAt) }}</span>
        </div>
      </div>
    </div>

    <div v-if="showClearModal" class="modal-overlay" @click="showClearModal = false">
      <div class="modal" @click.stop>
        <h3>确认清空</h3>
        <p>确定要清空所有历史记录吗？此操作不可恢复。</p>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showClearModal = false">取消</button>
          <button class="confirm-btn danger" @click="clearAll">确认清空</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getHistory, removeHistory, clearHistory, filterHistory } from '../utils/storage.js'

const router = useRouter()
const history = ref([])
const searchKeyword = ref('')
const showClearModal = ref(false)

const filters = reactive({
  wheelchairMode: false,
  emergencyMode: false,
  startDate: '',
  endDate: ''
})

const filteredHistory = computed(() => {
  const options = {}
  if (filters.wheelchairMode) options.wheelchairMode = true
  if (filters.emergencyMode) options.emergencyMode = true
  if (filters.startDate) options.startDate = filters.startDate
  if (filters.endDate) options.endDate = filters.endDate
  
  return filterHistory(searchKeyword.value, options)
})

function loadHistory() {
  history.value = getHistory()
}

function applyFilters() {
}

function resetFilters() {
  searchKeyword.value = ''
  filters.wheelchairMode = false
  filters.emergencyMode = false
  filters.startDate = ''
  filters.endDate = ''
}

function goToRoute(deptId) {
  router.push(`/route/${deptId}`)
}

function deleteItem(historyId) {
  removeHistory(historyId)
  loadHistory()
}

function confirmClearAll() {
  showClearModal.value = true
}

function clearAll() {
  clearHistory()
  loadHistory()
  showClearModal.value = false
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.history-page {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 24px;
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

.filter-section {
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-row + .filter-row {
  margin-top: 12px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  width: 280px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #1976d2;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #555;
  cursor: pointer;
}

.filter-label input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.date-label {
  font-size: 14px;
  color: #555;
}

.date-input {
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  cursor: pointer;
}

.date-input:focus {
  border-color: #1976d2;
}

.reset-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #e0e0e0;
}

.empty-state {
  background: white;
  padding: 60px 24px;
  border-radius: 12px;
  text-align: center;
  color: #999;
  font-size: 16px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.list-header span {
  color: #666;
  font-size: 14px;
}

.clear-btn {
  padding: 6px 14px;
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #ffcdd2;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: all 0.2s;
}

.history-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.dept-info {
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.dept-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: block;
}

.dept-location {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
  display: block;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.business-no {
  font-size: 12px;
  color: #1976d2;
  background: #e3f2fd;
  padding: 4px 10px;
  border-radius: 10px;
  font-family: monospace;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #1976d2;
  color: #1976d2;
}

.go-btn {
  background: #e3f2fd;
  border-color: #bbdefb;
  color: #1565c0;
}

.go-btn:hover {
  background: #bbdefb;
}

.delete-btn {
  background: #ffebee;
  border-color: #ffcdd2;
  color: #c62828;
  padding: 6px 10px;
}

.delete-btn:hover {
  background: #ffcdd2;
}

.card-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 12px;
}

.tag.wheelchair {
  background: #e3f2fd;
  color: #1565c0;
}

.tag.emergency {
  background: #fce4ec;
  color: #ad1457;
}

.create-time {
  font-size: 13px;
  color: #999;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
}

.modal h3 {
  margin: 0 0 12px 0;
  color: #333;
}

.modal p {
  color: #666;
  margin: 0 0 20px 0;
  font-size: 14px;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 8px 20px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.confirm-btn {
  padding: 8px 20px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.confirm-btn.danger {
  background: #c62828;
}

@media (max-width: 600px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
  
  .card-header {
    flex-direction: column;
  }
  
  .card-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .card-body {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
