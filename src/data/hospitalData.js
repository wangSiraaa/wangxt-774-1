export const buildings = [
  { id: 'A', name: '门诊楼A', floors: ['B1', '1F', '2F', '3F', '4F', '5F'] },
  { id: 'B', name: '住院楼B', floors: ['B1', '1F', '2F', '3F', '4F', '5F', '6F', '7F', '8F'] },
  { id: 'C', name: '急诊楼C', floors: ['1F', '2F', '3F'] }
]

export const entrances = [
  { id: 'main', name: '正门入口', building: 'A', floor: '1F', isEmergency: false, isWheelchair: true, position: { x: 50, y: 10 }, congestion: 'low', openTime: '06:00-22:00' },
  { id: 'emergency', name: '急诊入口', building: 'C', floor: '1F', isEmergency: true, isWheelchair: true, position: { x: 80, y: 90 }, congestion: 'medium', openTime: '00:00-24:00' },
  { id: 'north', name: '北门入口', building: 'A', floor: '1F', isEmergency: false, isWheelchair: true, position: { x: 10, y: 50 }, congestion: 'low', openTime: '06:00-20:00' },
  { id: 'underground', name: '地下车库入口', building: 'A', floor: 'B1', isEmergency: false, isWheelchair: true, position: { x: 30, y: 50 }, congestion: 'medium', openTime: '06:00-22:00' },
  { id: 'east', name: '东门（台阶）', building: 'B', floor: '1F', isEmergency: false, isWheelchair: false, position: { x: 90, y: 30 }, congestion: 'low', openTime: '06:00-20:00' }
]

export const elevators = [
  { id: 'E1', name: '1号电梯', building: 'A', fromFloor: 'B1', toFloor: '5F', isWheelchair: true, status: 'running', accessibleFloors: ['B1', '1F', '2F', '3F', '4F', '5F'], position: { x: 45, y: 45 } },
  { id: 'E2', name: '2号电梯', building: 'A', fromFloor: '1F', toFloor: '5F', isWheelchair: true, status: 'running', accessibleFloors: ['1F', '2F', '3F', '4F', '5F'], position: { x: 50, y: 45 } },
  { id: 'E3', name: '3号手术专用电梯', building: 'B', fromFloor: '1F', toFloor: '8F', isWheelchair: true, status: 'running', accessibleFloors: ['1F', '3F', '5F', '7F', '8F'], position: { x: 20, y: 60 } },
  { id: 'E4', name: '4号员工电梯', building: 'B', fromFloor: 'B1', toFloor: '8F', isWheelchair: false, status: 'running', accessibleFloors: ['B1', '1F', '2F', '3F', '4F', '5F', '6F', '7F', '8F'], position: { x: 25, y: 60 } },
  { id: 'E5', name: '5号急诊电梯', building: 'C', fromFloor: '1F', toFloor: '3F', isWheelchair: true, status: 'running', accessibleFloors: ['1F', '2F', '3F'], position: { x: 70, y: 80 } }
]

export const escalators = [
  { id: 'ES1', name: '1号扶梯', building: 'A', fromFloor: '1F', toFloor: '5F', isWheelchair: false, status: 'running' },
  { id: 'ES2', name: '2号扶梯', building: 'B', fromFloor: '1F', toFloor: '4F', isWheelchair: false, status: 'running' }
]

export const ramps = [
  { id: 'R1', name: '正门无障碍坡道', from: 'main', to: 'A-1F', slope: 'gentle' },
  { id: 'R2', name: '急诊无障碍坡道', from: 'emergency', to: 'C-1F', slope: 'gentle' },
  { id: 'R3', name: '北门无障碍坡道', from: 'north', to: 'A-1F', slope: 'gentle' }
]

export const floorConnections = [
  { id: 'conn1', type: 'corridor', name: '连廊A-B1层', from: { building: 'A', floor: '1F', point: 'east-corridor' }, to: { building: 'B', floor: '1F', point: 'west-corridor' }, isWheelchair: true, distance: 80 },
  { id: 'conn2', type: 'corridor', name: '连廊A-B2层', from: { building: 'A', floor: '2F', point: 'east-corridor' }, to: { building: 'B', floor: '2F', point: 'west-corridor' }, isWheelchair: true, distance: 80 },
  { id: 'conn3', type: 'corridor', name: '连廊B-C1层', from: { building: 'B', floor: '1F', point: 'south-corridor' }, to: { building: 'C', floor: '1F', point: 'north-corridor' }, isWheelchair: true, distance: 60 },
  { id: 'conn4', type: 'tunnel', name: '地下通道B1层', from: { building: 'A', floor: 'B1', point: 'south' }, to: { building: 'B', floor: 'B1', point: 'north' }, isWheelchair: true, distance: 100 }
]

export const departments = [
  { id: 'internal', name: '内科门诊', aliases: ['内科', '普通内科', '大内科'], building: 'A', floor: '3F', zone: 'A3-东区', position: { x: 60, y: 30 }, openTime: '08:00-17:30', isEmergency: false, nearbyElevators: ['E1', 'E2'], nearbyEntrances: ['main'] },
  { id: 'surgery', name: '外科门诊', aliases: ['外科', '普通外科', '普外科'], building: 'A', floor: '4F', zone: 'A4-西区', position: { x: 30, y: 30 }, openTime: '08:00-17:30', isEmergency: false, nearbyElevators: ['E1', 'E2'], nearbyEntrances: ['main'] },
  { id: 'pediatrics', name: '儿科门诊', aliases: ['儿科', '小儿科', '儿童门诊'], building: 'A', floor: '2F', zone: 'A2-南区', position: { x: 50, y: 60 }, openTime: '08:00-17:30', isEmergency: false, nearbyElevators: ['E1', 'E2'], nearbyEntrances: ['main', 'north'] },
  { id: 'gynecology', name: '妇产科门诊', aliases: ['妇产科', '妇科', '产科'], building: 'B', floor: '3F', zone: 'B3-北区', position: { x: 35, y: 20 }, openTime: '08:00-17:30', isEmergency: false, nearbyElevators: ['E3'], nearbyEntrances: ['north'] },
  { id: 'ophthalmology', name: '眼科门诊', aliases: ['眼科', '眼视光'], building: 'A', floor: '5F', zone: 'A5-东区', position: { x: 65, y: 35 }, openTime: '08:00-17:00', isEmergency: false, nearbyElevators: ['E1', 'E2'], nearbyEntrances: ['main'] },
  { id: 'ent', name: '耳鼻喉科门诊', aliases: ['耳鼻喉', '耳鼻喉科', '五官科'], building: 'A', floor: '5F', zone: 'A5-西区', position: { x: 25, y: 35 }, openTime: '08:00-17:00', isEmergency: false, nearbyElevators: ['E1', 'E2'], nearbyEntrances: ['main'] },
  { id: 'dermatology', name: '皮肤科门诊', aliases: ['皮肤科', '皮肤性病科'], building: 'A', floor: '3F', zone: 'A3-西区', position: { x: 25, y: 30 }, openTime: '08:00-17:00', isEmergency: false, nearbyElevators: ['E1', 'E2'], nearbyEntrances: ['main'] },
  { id: 'dental', name: '口腔科门诊', aliases: ['口腔科', '牙科', '牙医'], building: 'A', floor: '2F', zone: 'A2-北区', position: { x: 50, y: 20 }, openTime: '08:00-17:00', isEmergency: false, nearbyElevators: ['E1', 'E2'], nearbyEntrances: ['main'] },
  { id: 'radiology', name: '放射科', aliases: ['放射科', '影像科', 'CT室', '磁共振', 'X光'], building: 'B', floor: '1F', zone: 'B1-南区', position: { x: 40, y: 70 }, openTime: '08:00-17:30', isEmergency: false, nearbyElevators: ['E3', 'E4'], nearbyEntrances: ['main', 'underground'] },
  { id: 'laboratory', name: '检验科', aliases: ['检验科', '化验室', '验血'], building: 'A', floor: '1F', zone: 'A1-西区', position: { x: 20, y: 50 }, openTime: '07:30-17:30', isEmergency: false, nearbyElevators: ['E1'], nearbyEntrances: ['main', 'north'] },
  { id: 'emergency_dept', name: '急诊内科', aliases: ['急诊', '急诊科', '急救'], building: 'C', floor: '1F', zone: 'C1-急诊区', position: { x: 70, y: 85 }, openTime: '00:00-24:00', isEmergency: true, nearbyElevators: ['E5'], nearbyEntrances: ['emergency'] },
  { id: 'emergency_surgery', name: '急诊外科', aliases: ['急诊外科', '外科急诊'], building: 'C', floor: '1F', zone: 'C1-急诊区', position: { x: 75, y: 75 }, openTime: '00:00-24:00', isEmergency: true, nearbyElevators: ['E5'], nearbyEntrances: ['emergency'] },
  { id: 'icu', name: '重症监护室ICU', aliases: ['ICU', '重症监护', '监护室'], building: 'B', floor: '5F', zone: 'B5-西区', position: { x: 30, y: 50 }, openTime: '00:00-24:00', isEmergency: true, nearbyElevators: ['E3'], nearbyEntrances: ['emergency', 'main'] },
  { id: 'inpatient_internal', name: '内科住院部', aliases: ['内科病房', '内科住院'], building: 'B', floor: '6F', zone: 'B6-东区', position: { x: 55, y: 40 }, openTime: '00:00-24:00', isEmergency: false, nearbyElevators: ['E3', 'E4'], nearbyEntrances: ['main'] },
  { id: 'inpatient_surgery', name: '外科住院部', aliases: ['外科病房', '外科住院'], building: 'B', floor: '7F', zone: 'B7-东区', position: { x: 55, y: 40 }, openTime: '00:00-24:00', isEmergency: false, nearbyElevators: ['E3', 'E4'], nearbyEntrances: ['main'] },
  { id: 'operating_room', name: '手术室', aliases: ['手术室', '手术中心', 'OR'], building: 'B', floor: '5F', zone: 'B5-东区', position: { x: 60, y: 35 }, openTime: '08:00-18:00', isEmergency: false, nearbyElevators: ['E3'], nearbyEntrances: ['main'] },
  { id: 'night_consult', name: '夜间门诊', aliases: ['夜门诊', '夜间看病'], building: 'C', floor: '2F', zone: 'C2-夜间诊疗区', position: { x: 70, y: 70 }, openTime: '17:30-22:00', isEmergency: false, nearbyElevators: ['E5'], nearbyEntrances: ['emergency'] },
  { id: 'pharmacy', name: '药房', aliases: ['药房', '取药', '西药房', '中药房'], building: 'A', floor: '1F', zone: 'A1-东区', position: { x: 70, y: 45 }, openTime: '08:00-17:30', isEmergency: false, nearbyElevators: ['E1', 'E2'], nearbyEntrances: ['main'] }
]

export const zones = [
  { id: 'A1-东区', building: 'A', floor: '1F', name: '门诊1楼东区', openTime: '07:00-18:00' },
  { id: 'A1-西区', building: 'A', floor: '1F', name: '门诊1楼西区', openTime: '07:00-18:00' },
  { id: 'A2-北区', building: 'A', floor: '2F', name: '门诊2楼北区', openTime: '07:00-18:00' },
  { id: 'A2-南区', building: 'A', floor: '2F', name: '门诊2楼南区', openTime: '07:00-18:00' },
  { id: 'A3-东区', building: 'A', floor: '3F', name: '门诊3楼东区', openTime: '07:00-18:00' },
  { id: 'A3-西区', building: 'A', floor: '3F', name: '门诊3楼西区', openTime: '07:00-18:00' },
  { id: 'A4-西区', building: 'A', floor: '4F', name: '门诊4楼西区', openTime: '07:00-18:00' },
  { id: 'A5-东区', building: 'A', floor: '5F', name: '门诊5楼东区', openTime: '07:00-17:30' },
  { id: 'A5-西区', building: 'A', floor: '5F', name: '门诊5楼西区', openTime: '07:00-17:30' },
  { id: 'B1-南区', building: 'B', floor: '1F', name: '住院1楼南区', openTime: '00:00-24:00' },
  { id: 'B3-北区', building: 'B', floor: '3F', name: '住院3楼北区', openTime: '00:00-24:00' },
  { id: 'B5-东区', building: 'B', floor: '5F', name: '住院5楼东区', openTime: '00:00-24:00' },
  { id: 'B5-西区', building: 'B', floor: '5F', name: '住院5楼西区', openTime: '00:00-24:00' },
  { id: 'B6-东区', building: 'B', floor: '6F', name: '住院6楼东区', openTime: '00:00-24:00' },
  { id: 'B7-东区', building: 'B', floor: '7F', name: '住院7楼东区', openTime: '00:00-24:00' },
  { id: 'C1-急诊区', building: 'C', floor: '1F', name: '急诊1楼', openTime: '00:00-24:00' },
  { id: 'C2-夜间诊疗区', building: 'C', floor: '2F', name: '急诊2楼夜间诊疗', openTime: '17:30-22:00' }
]
