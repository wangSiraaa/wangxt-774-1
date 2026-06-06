<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>🛠️ 导医台管理</h2>
      <p class="subtitle">电梯状态监控与入口管理</p>
    </div>

    <div class="section">
      <div class="section-header">
        <h3>🛗 电梯状态管理</h3>
        <span class="section-desc">设置电梯运行/检修状态，检修电梯不会出现在无障碍路线中</span>
      </div>
      
      <div class="elevator-grid">
        <div
          v-for="elev in elevatorList"
          :key="elev.id"
          class="elevator-card"
          :class="{ out: elev.status !== 'running' }"
        >
          <div class="elevator-header">
            <span class="elevator-name">{{ elev.name }}</span>
            <span class="elevator-tag" :class="elev.status">
              {{ elev.status === 'running' ? '✅ 运行中' : '🔧 检修中' }}
            </span>
          </div>
          <div class="elevator-info">
            <p>📍 {{ elev.building }}栋 ({{ elev.fromFloor }} - {{ elev.toFloor }})</p>
            <p>🛗 停靠楼层: {{ elev.accessibleFloors.join('、') }}</p>
            <p>♿ {{ elev.isWheelchair ? '无障碍电梯' : '普通电梯' }}</p>
          </div>
          <div class="elevator-actions">
            <button
              class="action-btn"
              :class="{ active: elev.status === 'running' }"
              @click="setElevatorStatus(elev.id, 'running')"
            >
              设为运行
            </button>
            <button
              class="action-btn"
              :class="{ active: elev.status !== 'running' }"
              @click="setElevatorStatus(elev.id, 'maintenance')"
            >
              设为检修
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h3>🚪 入口状态管理</h3>
        <span class="section-desc">设置入口拥堵状态，影响路线优先级排序</span>
      </div>
      
      <div class="entrance-list">
        <div
          v-for="entr in entranceList"
          :key="entr.id"
          class="entrance-card"
        >
          <div class="entrance-info">
            <div class="entrance-name">
              <span>{{ entr.name }}</span>
              <span v-if="entr.isEmergency" class="emergency-tag">🚑 急诊</span>
              <span v-if="entr.isWheelchair" class="wheelchair-tag">♿ 无障碍</span>
            </div>
            <p class="entrance-detail">
              {{ entr.building }}栋 {{ entr.floor }} | 开放时间: {{ entr.openTime }}
            </p>
          </div>
          <div class="entrance-actions">
            <span class="congestion-label">拥堵状态:</span>
            <button
              class="congestion-btn"
              :class="{ active: entr.congestion === 'low' }"
              @click="setEntranceCongestion(entr.id, 'low')"
            >
              🟢 畅通
            </button>
            <button
              class="congestion-btn"
              :class="{ active: entr.congestion === 'medium' }"
              @click="setEntranceCongestion(entr.id, 'medium')"
            >
              🟡 中等
            </button>
            <button
              class="congestion-btn"
              :class="{ active: entr.congestion === 'high' }"
              @click="setEntranceCongestion(entr.id, 'high')"
            >
              🔴 拥堵
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h3>📊 系统状态</h3>
      </div>
      
      <div class="status-grid">
        <div class="status-card">
          <div class="status-value green">{{ runningElevators }}</div>
          <div class="status-label">运行中电梯</div>
        </div>
        <div class="status-card">
          <div class="status-value orange">{{ maintenanceElevators }}</div>
          <div class="status-label">检修中电梯</div>
        </div>
        <div class="status-card">
          <div class="status-value blue">{{ wheelchairElevators }}</div>
          <div class="status-label">无障碍电梯</div>
        </div>
        <div class="status-card">
          <div class="status-value purple">{{ emergencyEntrances }}</div>
          <div class="status-label">急诊入口</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h3>⚠️ 数据管理</h3>
      </div>
      
      <div class="data-actions">
        <button class="danger-btn" @click="confirmReset">
          🔄 重置所有数据
        </button>
      </div>
    </div>

    <div v-if="showResetModal" class="modal-overlay" @click="showResetModal = false">
      <div class="modal" @click.stop>
        <h3>确认重置</h3>
        <p>确定要重置所有数据吗？这将恢复电梯和入口的默认状态，并清除收藏和导航历史。</p>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showResetModal = false">取消</button>
          <button class="confirm-btn" @click="resetAllData">确认重置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  getElevatorsWithStatus,
  updateElevatorStatus,
  getEntrancesWithStatus,
  updateEntranceCongestion,
  initializeData,
  storage,
  STORAGE_KEYS
} from '../utils/storage.js'

const elevatorList = ref([])
const entranceList = ref([])
const showResetModal = ref(false)

const runningElevators = computed(() => 
  elevatorList.value.filter(e => e.status === 'running').length
)

const maintenanceElevators = computed(() => 
  elevatorList.value.filter(e => e.status !== 'running').length
)

const wheelchairElevators = computed(() => 
  elevatorList.value.filter(e => e.isWheelchair).length
)

const emergencyEntrances = computed(() => 
  entranceList.value.filter(e => e.isEmergency).length
)

function loadData() {
  elevatorList.value = getElevatorsWithStatus()
  entranceList.value = getEntrancesWithStatus()
}

function setElevatorStatus(elevatorId, status) {
  updateElevatorStatus(elevatorId, status)
  loadData()
}

function setEntranceCongestion(entranceId, congestion) {
  updateEntranceCongestion(entranceId, congestion)
  loadData()
}

function confirmReset() {
  showResetModal.value = true
}

function resetAllData() {
  storage.remove(STORAGE_KEYS.ELEVATOR_STATUSES)
  storage.remove(STORAGE_KEYS.ENTRANCE_STATUSES)
  storage.remove(STORAGE_KEYS.FAVORITES)
  storage.remove(STORAGE_KEYS.LAST_NAVIGATION)
  storage.remove(STORAGE_KEYS.SETTINGS)
  initializeData()
  loadData()
  showResetModal.value = false
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.admin-page {
  max-width: 900px;
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

.section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  margin-bottom: 20px;
}

.section-header {
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #333;
}

.section-desc {
  color: #999;
  font-size: 13px;
}

.elevator-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.elevator-card {
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 16px;
  transition: all 0.3s;
}

.elevator-card.out {
  border-color: #ffcdd2;
  background: #ffebee;
}

.elevator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.elevator-name {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.elevator-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.elevator-tag.running {
  background: #e8f5e9;
  color: #2e7d32;
}

.elevator-tag.maintenance {
  background: #ffebee;
  color: #c62828;
}

.elevator-info p {
  margin: 4px 0;
  font-size: 13px;
  color: #666;
}

.elevator-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #1976d2;
}

.action-btn.active {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.entrance-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entrance-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  flex-wrap: wrap;
  gap: 12px;
}

.entrance-name {
  font-weight: 600;
  font-size: 15px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.emergency-tag {
  background: #fce4ec;
  color: #ad1457;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}

.wheelchair-tag {
  background: #e3f2fd;
  color: #1565c0;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}

.entrance-detail {
  margin: 6px 0 0 0;
  font-size: 13px;
  color: #666;
}

.entrance-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.congestion-label {
  font-size: 13px;
  color: #666;
  margin-right: 4px;
}

.congestion-btn {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.congestion-btn:hover {
  border-color: #1976d2;
}

.congestion-btn.active {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.status-card {
  text-align: center;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 10px;
}

.status-value {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
}

.status-value.green { color: #2e7d32; }
.status-value.orange { color: #e65100; }
.status-value.blue { color: #1565c0; }
.status-value.purple { color: #7b1fa2; }

.status-label {
  font-size: 13px;
  color: #666;
}

.data-actions {
  display: flex;
  justify-content: center;
}

.danger-btn {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.danger-btn:hover {
  background: #ffcdd2;
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
  background: #c62828;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

@media (max-width: 768px) {
  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .entrance-card {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .elevator-grid {
    grid-template-columns: 1fr;
  }
}
</style>
