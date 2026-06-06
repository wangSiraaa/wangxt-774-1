import {
  getElevatorsWithStatus,
  getEntrancesWithStatus,
  getDepartments,
  getZones,
  getFloorConnections,
  getSettings
} from './storage.js'

function isTimeInRange(openTime, currentTime) {
  if (!openTime) return true
  const [start, end] = openTime.split('-')
  if (!start || !end) return true
  
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)
  const [currH, currM] = currentTime.split(':').map(Number)
  
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  const currMinutes = currH * 60 + currM
  
  if (startMinutes <= endMinutes) {
    return currMinutes >= startMinutes && currMinutes <= endMinutes
  } else {
    return currMinutes >= startMinutes || currMinutes <= endMinutes
  }
}

function getCurrentTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function isZoneOpen(zoneId, currentTime) {
  const zones = getZones()
  const zone = zones.find(z => z.id === zoneId)
  if (!zone) return true
  return isTimeInRange(zone.openTime, currentTime)
}

function isDepartmentOpen(department, currentTime) {
  return isTimeInRange(department.openTime, currentTime)
}

function distance(p1, p2) {
  if (!p1 || !p2) return 100
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

function getAvailableElevators(wheelchairOnly = false) {
  const allElevators = getElevatorsWithStatus()
  return allElevators.filter(e => {
    if (e.status !== 'running') return false
    if (wheelchairOnly && !e.isWheelchair) return false
    return true
  })
}

function getAvailableEntrances(wheelchairOnly = false, emergencyOnly = false) {
  const allEntrances = getEntrancesWithStatus()
  const currentTime = getCurrentTime()
  
  return allEntrances.filter(e => {
    if (!isTimeInRange(e.openTime, currentTime)) return false
    if (wheelchairOnly && !e.isWheelchair) return false
    if (emergencyOnly && !e.isEmergency) return false
    return true
  })
}

function findBestElevator(fromFloor, toFloor, building, wheelchairOnly = false) {
  const elevators = getAvailableElevators(wheelchairOnly)
  const buildingElevators = elevators.filter(e => 
    e.building === building &&
    e.accessibleFloors.includes(fromFloor) &&
    e.accessibleFloors.includes(toFloor)
  )
  
  if (buildingElevators.length === 0) return null
  
  buildingElevators.sort((a, b) => {
    if (a.isWheelchair && !b.isWheelchair) return -1
    if (!a.isWheelchair && b.isWheelchair) return 1
    return 0
  })
  
  return buildingElevators[0]
}

function getConnectionBetweenBuildings(fromBuilding, fromFloor, toBuilding, toFloor, wheelchairOnly = false) {
  const connections = getFloorConnections()
  const available = connections.filter(c => {
    if (wheelchairOnly && !c.isWheelchair) return false
    
    const fromMatch = c.from.building === fromBuilding && c.from.floor === fromFloor
    const toMatch = c.to.building === toBuilding && c.to.floor === toFloor
    const reverseMatch = c.from.building === toBuilding && c.from.floor === toFloor && c.to.building === fromBuilding && c.to.floor === fromFloor
    
    return fromMatch || toMatch
  })
  
  if (available.length > 0) {
    return available.sort((a, b) => a.distance - b.distance)[0]
  }
  
  return null
}

function generateRouteSteps(entrance, department, options = {}) {
  const { wheelchairMode = false, emergencyMode = false } = options
  const currentTime = getCurrentTime()
  const steps = []
  const warnings = []
  const usedElevators = []
  
  steps.push({
    type: 'entrance',
    title: '从入口出发',
    description: `从【${entrance.name}】进入${entrance.building}栋${entrance.floor}`,
    detail: entrance,
    icon: 'door'
  })
  
  if (entrance.building !== department.building) {
    const fromFloor = entrance.floor
    const toFloor = entrance.floor
    
    const connection = getConnectionBetweenBuildings(
      entrance.building, fromFloor,
      department.building, toFloor,
      wheelchairMode
    )
    
    if (connection) {
      steps.push({
        type: 'connection',
        title: '楼宇连廊',
        description: `通过【${connection.name}】从${entrance.building}栋到${department.building}栋${toFloor}`,
        detail: connection,
        icon: 'walk'
      })
    } else {
      const transferFloor = '1F'
      
      if (entrance.floor !== transferFloor) {
        const elevator = findBestElevator(entrance.floor, transferFloor, entrance.building, wheelchairMode)
        if (elevator) {
          usedElevators.push(elevator.id)
          steps.push({
            type: 'elevator',
            title: '乘坐电梯',
            description: `乘坐【${elevator.name}】从${entrance.floor}到${transferFloor}`,
            detail: elevator,
            icon: 'elevator'
          })
        } else {
          warnings.push(`找不到从${entrance.floor}到${transferFloor}的可用电梯`)
        }
      }
      
      const conn1F = getConnectionBetweenBuildings(
        entrance.building, '1F',
        department.building, '1F',
        wheelchairMode
      )
      
      if (conn1F) {
        steps.push({
          type: 'connection',
          title: '楼宇连廊',
          description: `通过【${conn1F.name}】从${entrance.building}栋1F到${department.building}栋1F`,
          detail: conn1F,
          icon: 'walk'
        })
      } else {
        warnings.push('找不到两栋楼之间的连接通道')
      }
      
      if (department.floor !== '1F') {
        const elevator2 = findBestElevator('1F', department.floor, department.building, wheelchairMode)
        if (elevator2) {
          usedElevators.push(elevator2.id)
          steps.push({
            type: 'elevator',
            title: '乘坐电梯',
            description: `乘坐【${elevator2.name}】从1F到${department.floor}`,
            detail: elevator2,
            icon: 'elevator'
          })
        } else {
          warnings.push(`找不到从1F到${department.floor}的可用电梯`)
        }
      }
    }
  } else if (entrance.floor !== department.floor) {
    const elevator = findBestElevator(entrance.floor, department.floor, department.building, wheelchairMode)
    if (elevator) {
      usedElevators.push(elevator.id)
      steps.push({
        type: 'elevator',
        title: '乘坐电梯',
        description: `乘坐【${elevator.name}】从${entrance.floor}到${department.floor}`,
        detail: elevator,
        icon: 'elevator'
      })
    } else {
      warnings.push(`找不到从${entrance.floor}到${department.floor}的可用电梯`)
    }
  }
  
  if (!isDepartmentOpen(department, currentTime)) {
    warnings.push(`【${department.name}】当前非开放时间（${department.openTime}）`)
    
    const alternatives = getDepartments().filter(d => {
      if (d.id === department.id) return false
      if (!isDepartmentOpen(d, currentTime)) return false
      if (wheelchairMode) {
        const nearElev = d.nearbyElevators
        if (nearElev && nearElev.length > 0) {
          const hasWheelchairElev = nearElev.some(eid => {
            const elev = getElevatorsWithStatus().find(e => e.id === eid)
            return elev && elev.status === 'running' && elev.isWheelchair
          })
          if (!hasWheelchairElev) return false
        }
      }
      return d.isEmergency === department.isEmergency
    })
    
    if (alternatives.length > 0) {
      warnings.push(`推荐替代科室：${alternatives.slice(0, 3).map(a => a.name).join('、')}`)
    }
  }
  
  if (!isZoneOpen(department.zone, currentTime)) {
    warnings.push(`诊区【${department.zone}】当前可能已关闭`)
  }
  
  steps.push({
    type: 'destination',
    title: '到达目的地',
    description: `到达【${department.name}】，位于${department.zone}`,
    detail: department,
    icon: 'location'
  })
  
  return { steps, warnings, usedElevators }
}

function calculateRouteScore(entrance, department, options = {}) {
  const { wheelchairMode = false, emergencyMode = false } = options
  let score = 0
  
  if (emergencyMode && entrance.isEmergency) {
    score += 1000
  }
  
  if (wheelchairMode && entrance.isWheelchair) {
    score += 100
  } else if (wheelchairMode && !entrance.isWheelchair) {
    score -= 500
  }
  
  if (entrance.congestion === 'low') score += 50
  else if (entrance.congestion === 'medium') score += 20
  else if (entrance.congestion === 'high') score -= 30
  
  const dist = distance(entrance.position, department.position)
  score -= dist * 0.5
  
  if (entrance.building === department.building) {
    score += 80
  }
  
  if (department.nearbyEntrances && department.nearbyEntrances.includes(entrance.id)) {
    score += 60
  }
  
  if (wheelchairMode) {
    const hasGoodElevator = department.nearbyElevators?.some(eid => {
      const elev = getElevatorsWithStatus().find(e => e.id === eid)
      return elev && elev.status === 'running' && elev.isWheelchair
    })
    if (!hasGoodElevator) score -= 100
  }
  
  return score
}

export function calculateRoutes(departmentId, options = {}) {
  const settings = getSettings()
  const mergedOptions = { ...settings, ...options }
  const { wheelchairMode = false, emergencyMode = false } = mergedOptions
  
  const departments = getDepartments()
  const department = departments.find(d => d.id === departmentId)
  
  if (!department) {
    return { success: false, error: '未找到指定科室', routes: [] }
  }
  
  const availableEntrances = getAvailableEntrances(wheelchairMode, false)
  
  if (availableEntrances.length === 0) {
    return { success: false, error: '当前无可用入口', routes: [] }
  }
  
  const routes = []
  
  for (const entrance of availableEntrances) {
    const { steps, warnings, usedElevators } = generateRouteSteps(entrance, department, mergedOptions)
    const score = calculateRouteScore(entrance, department, mergedOptions)
    
    let valid = true
    if (wheelchairMode) {
      if (!entrance.isWheelchair) valid = false
      for (const step of steps) {
        if (step.type === 'elevator' && step.detail && !step.detail.isWheelchair) {
          valid = false
          break
        }
      }
    }
    
    if (valid) {
      routes.push({
        id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entrance,
        department,
        steps,
        warnings,
        usedElevators,
        score,
        estimatedTime: Math.ceil(steps.length * 2 + (usedElevators.length * 1.5)),
        totalDistance: steps.filter(s => s.type === 'connection').reduce((sum, s) => sum + (s.detail?.distance || 50), 0) + steps.length * 20
      })
    }
  }
  
  routes.sort((a, b) => b.score - a.score)
  
  const deptOpen = isDepartmentOpen(department, getCurrentTime())
  
  return {
    success: true,
    department,
    routes,
    departmentOpen: deptOpen,
    currentTime: getCurrentTime(),
    options: mergedOptions
  }
}

export function verifyRouteAccessibility(route) {
  const issues = []
  
  if (!route.entrance.isWheelchair) {
    issues.push('入口不是无障碍入口')
  }
  
  for (const step of route.steps) {
    if (step.type === 'elevator') {
      if (!step.detail || !step.detail.isWheelchair) {
        issues.push(`步骤【${step.title}】使用的电梯不是无障碍电梯`)
      }
      if (step.detail && step.detail.status !== 'running') {
        issues.push(`步骤【${step.title}】使用的电梯当前不可用`)
      }
    }
    if (step.type === 'connection') {
      if (!step.detail || !step.detail.isWheelchair) {
        issues.push(`步骤【${step.title}】使用的通道不是无障碍通道`)
      }
    }
  }
  
  return {
    accessible: issues.length === 0,
    issues
  }
}

export function verifyEmergencyPriority(routes) {
  if (routes.length < 2) return { emergencyFirst: true }
  
  const firstRoute = routes[0]
  const hasEmergencyEntrance = routes.some(r => r.entrance.isEmergency)
  
  if (!hasEmergencyEntrance) {
    return { emergencyFirst: true, note: '无急诊入口可用' }
  }
  
  return {
    emergencyFirst: firstRoute.entrance.isEmergency,
    firstEntrance: firstRoute.entrance.name,
    firstIsEmergency: firstRoute.entrance.isEmergency
  }
}

export function verifyNoOutOfServiceElevators(route) {
  const allElevators = getElevatorsWithStatus()
  const outOfServiceElevators = allElevators.filter(e => e.status !== 'running')
  
  const usedOutOfService = outOfServiceElevators.filter(e => 
    route.usedElevators?.includes(e.id) ||
    route.steps?.some(s => s.type === 'elevator' && s.detail?.id === e.id)
  )
  
  return {
    valid: usedOutOfService.length === 0,
    outOfServiceElevators: usedOutOfService
  }
}

export {
  getCurrentTime,
  isTimeInRange,
  isDepartmentOpen,
  isZoneOpen,
  getAvailableElevators,
  getAvailableEntrances
}
