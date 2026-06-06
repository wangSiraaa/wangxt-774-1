import { buildings, entrances, elevators, escalators, ramps, floorConnections, departments, zones } from '../data/hospitalData.js'

const STORAGE_KEYS = {
  ELEVATOR_STATUSES: 'hosp_nav_elevator_statuses',
  ENTRANCE_STATUSES: 'hosp_nav_entrance_statuses',
  FAVORITES: 'hosp_nav_favorites',
  LAST_NAVIGATION: 'hosp_nav_last_navigation',
  SETTINGS: 'hosp_nav_settings',
  HISTORY: 'hosp_nav_history',
  SEED_DATA: 'hosp_nav_seed_data'
}

export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (e) {
      console.error('Storage get error:', e)
      return defaultValue
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.error('Storage set error:', e)
      return false
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (e) {
      console.error('Storage remove error:', e)
      return false
    }
  },

  clear() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
  }
}

export function initializeData() {
  if (!storage.get(STORAGE_KEYS.ELEVATOR_STATUSES)) {
    const elevatorStatuses = {}
    elevators.forEach(e => {
      elevatorStatuses[e.id] = { status: e.status, lastUpdated: new Date().toISOString() }
    })
    storage.set(STORAGE_KEYS.ELEVATOR_STATUSES, elevatorStatuses)
  }

  if (!storage.get(STORAGE_KEYS.ENTRANCE_STATUSES)) {
    const entranceStatuses = {}
    entrances.forEach(e => {
      entranceStatuses[e.id] = { congestion: e.congestion, lastUpdated: new Date().toISOString() }
    })
    storage.set(STORAGE_KEYS.ENTRANCE_STATUSES, entranceStatuses)
  }
}

export function getElevatorsWithStatus() {
  const statuses = storage.get(STORAGE_KEYS.ELEVATOR_STATUSES, {})
  return elevators.map(e => ({
    ...e,
    status: statuses[e.id]?.status || e.status
  }))
}

export function updateElevatorStatus(elevatorId, status) {
  const statuses = storage.get(STORAGE_KEYS.ELEVATOR_STATUSES, {})
  statuses[elevatorId] = { status, lastUpdated: new Date().toISOString() }
  storage.set(STORAGE_KEYS.ELEVATOR_STATUSES, statuses)
  return getElevatorsWithStatus()
}

export function getEntrancesWithStatus() {
  const statuses = storage.get(STORAGE_KEYS.ENTRANCE_STATUSES, {})
  return entrances.map(e => ({
    ...e,
    congestion: statuses[e.id]?.congestion || e.congestion
  }))
}

export function updateEntranceCongestion(entranceId, congestion) {
  const statuses = storage.get(STORAGE_KEYS.ENTRANCE_STATUSES, {})
  statuses[entranceId] = { congestion, lastUpdated: new Date().toISOString() }
  storage.set(STORAGE_KEYS.ENTRANCE_STATUSES, statuses)
  return getEntrancesWithStatus()
}

export function getFavorites() {
  return storage.get(STORAGE_KEYS.FAVORITES, [])
}

export function addFavorite(route) {
  const favorites = getFavorites()
  const newFavorite = {
    id: `fav_${Date.now()}`,
    ...route,
    createdAt: new Date().toISOString()
  }
  favorites.push(newFavorite)
  storage.set(STORAGE_KEYS.FAVORITES, favorites)
  return newFavorite
}

export function removeFavorite(favoriteId) {
  const favorites = getFavorites().filter(f => f.id !== favoriteId)
  storage.set(STORAGE_KEYS.FAVORITES, favorites)
  return favorites
}

export function getLastNavigation() {
  return storage.get(STORAGE_KEYS.LAST_NAVIGATION, null)
}

export function setLastNavigation(navigationResult) {
  storage.set(STORAGE_KEYS.LAST_NAVIGATION, {
    ...navigationResult,
    timestamp: new Date().toISOString()
  })
}

export function getSettings() {
  return storage.get(STORAGE_KEYS.SETTINGS, {
    wheelchairMode: false,
    emergencyMode: false,
    currentEntrance: null
  })
}

export function updateSettings(settings) {
  const current = getSettings()
  const updated = { ...current, ...settings }
  storage.set(STORAGE_KEYS.SETTINGS, updated)
  return updated
}

export function getDepartments() {
  return departments
}

export function getBuildings() {
  return buildings
}

export function getZones() {
  return zones
}

export function getFloorConnections() {
  return floorConnections
}

export function getRamps() {
  return ramps
}

export function getEscalators() {
  return escalators
}

export function searchDepartments(keyword) {
  if (!keyword || keyword.trim() === '') return []
  const lowerKeyword = keyword.toLowerCase().trim()
  return departments.filter(d => {
    if (d.name.toLowerCase().includes(lowerKeyword)) return true
    if (d.aliases.some(a => a.toLowerCase().includes(lowerKeyword))) return true
    if (d.floor.toLowerCase().includes(lowerKeyword)) return true
    if (d.zone.toLowerCase().includes(lowerKeyword)) return true
    return false
  })
}

export function getHistory() {
  return storage.get(STORAGE_KEYS.HISTORY, [])
}

export function addHistory(route) {
  const history = getHistory()
  const historyItem = {
    id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...route,
    createdAt: new Date().toISOString(),
    businessNo: generateBusinessNo()
  }
  history.unshift(historyItem)
  if (history.length > 100) {
    history.pop()
  }
  storage.set(STORAGE_KEYS.HISTORY, history)
  return historyItem
}

export function removeHistory(historyId) {
  const history = getHistory().filter(h => h.id !== historyId)
  storage.set(STORAGE_KEYS.HISTORY, history)
  return history
}

export function clearHistory() {
  storage.set(STORAGE_KEYS.HISTORY, [])
  return []
}

export function filterHistory(keyword = '', options = {}) {
  const history = getHistory()
  if (!keyword && Object.keys(options).length === 0) {
    return history
  }
  
  return history.filter(item => {
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase()
      const deptName = item.department?.name?.toLowerCase() || ''
      const deptAliases = item.department?.aliases?.map(a => a.toLowerCase()) || []
      const building = item.department?.building?.toLowerCase() || ''
      const floor = item.department?.floor?.toLowerCase() || ''
      
      if (deptName.includes(lowerKeyword)) return true
      if (deptAliases.some(a => a.includes(lowerKeyword))) return true
      if (building.includes(lowerKeyword)) return true
      if (floor.includes(lowerKeyword)) return true
      if (item.businessNo?.toLowerCase().includes(lowerKeyword)) return true
    }
    
    if (options.wheelchairMode !== undefined && item.options?.wheelchairMode !== options.wheelchairMode) {
      return false
    }
    if (options.emergencyMode !== undefined && item.options?.emergencyMode !== options.emergencyMode) {
      return false
    }
    if (options.startDate) {
      const itemDate = new Date(item.createdAt)
      const startDate = new Date(options.startDate)
      if (itemDate < startDate) return false
    }
    if (options.endDate) {
      const itemDate = new Date(item.createdAt)
      const endDate = new Date(options.endDate)
      endDate.setHours(23, 59, 59, 999)
      if (itemDate > endDate) return false
    }
    
    return true
  })
}

export function generateBusinessNo() {
  const now = new Date()
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0')
  const timeStr = String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `HN${dateStr}${timeStr}${random}`
}

export function getHistoryByBusinessNo(businessNo) {
  const history = getHistory()
  return history.find(h => h.businessNo === businessNo) || null
}

export { STORAGE_KEYS }
