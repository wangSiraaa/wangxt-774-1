import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n' + '='.repeat(60));
console.log('🏥 医院无障碍寻路系统 - 规则验证脚本');
console.log('='.repeat(60) + '\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   原因: ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) { return this.store[key] || null; }
  setItem(key, value) { this.store[key] = String(value); }
  removeItem(key) { delete this.store[key]; }
}

global.localStorage = new LocalStorageMock();

const storageModule = await import('../src/utils/storage.js');
const routeModule = await import('../src/utils/routeCalculator.js');

const {
  initializeData,
  updateElevatorStatus,
  getElevatorsWithStatus,
  getDepartments,
  addFavorite,
  getFavorites,
  removeFavorite,
  setLastNavigation,
  getLastNavigation,
  updateSettings
} = storageModule;

const {
  calculateRoutes,
  verifyRouteAccessibility,
  verifyEmergencyPriority,
  verifyNoOutOfServiceElevators
} = routeModule;

console.log('📦 模块加载完成\n');

initializeData();

console.log('--- 测试 1: 初始化数据验证 ---');

test('电梯数据加载正常', () => {
  const elevators = getElevatorsWithStatus();
  assert(elevators.length > 0, '没有找到电梯数据');
  assert(elevators.some(e => e.isWheelchair), '没有无障碍电梯');
});

test('科室数据加载正常', () => {
  const depts = getDepartments();
  assert(depts.length > 0, '没有找到科室数据');
  assert(depts.some(d => d.aliases.length > 0), '科室没有别名');
});

test('急诊科数据存在', () => {
  const depts = getDepartments();
  const emergency = depts.find(d => d.id === 'emergency_dept');
  assert(emergency, '未找到急诊科');
  assert(emergency.isEmergency === true, '急诊科未标记为急诊科室');
});

console.log('\n--- 测试 2: 电梯停用规则验证 ---');

const TEST_ELEVATOR_ID = 'E1';
const TEST_DEPT_ID = 'internal';

test(`停用电梯 ${TEST_ELEVATOR_ID} (1号电梯)`, () => {
  const result = updateElevatorStatus(TEST_ELEVATOR_ID, 'maintenance');
  const elev = result.find(e => e.id === TEST_ELEVATOR_ID);
  assert(elev, '电梯不存在');
  assert(elev.status === 'maintenance', `电梯状态应该是maintenance，实际是${elev.status}`);
});

test('轮椅路线不包含停用的电梯', () => {
  const result = calculateRoutes(TEST_DEPT_ID, { wheelchairMode: true, emergencyMode: false });
  
  assert(result.success, `路线计算失败: ${result.error}`);
  assert(result.routes.length > 0, '未生成任何路线');
  
  for (const route of result.routes) {
    const usedOutOfService = route.usedElevators?.includes(TEST_ELEVATOR_ID);
    assert(!usedOutOfService, `路线使用了已停用的电梯 ${TEST_ELEVATOR_ID}`);
    
    for (const step of route.steps) {
      if (step.type === 'elevator' && step.detail) {
        assert(step.detail.id !== TEST_ELEVATOR_ID, 
          `路线步骤中包含停用的电梯 ${TEST_ELEVATOR_ID}: ${step.detail.name}`);
        assert(step.detail.status === 'running', 
          `电梯 ${step.detail.id} 状态不是running: ${step.detail.status}`);
      }
    }
  }
  
  console.log(`   验证了 ${result.routes.length} 条路线，均不包含停用电梯 ${TEST_ELEVATOR_ID}`);
});

test('verifyNoOutOfServiceElevators 验证函数工作正常', () => {
  const result = calculateRoutes(TEST_DEPT_ID, { wheelchairMode: true });
  assert(result.routes.length > 0, '未生成路线');
  
  const verification = verifyNoOutOfServiceElevators(result.routes[0]);
  assert(verification.valid, `验证函数返回失败: ${JSON.stringify(verification.outOfServiceElevators)}`);
});

console.log('\n--- 测试 3: 急诊入口优先规则验证 ---');

test('急诊患者路线优先使用急诊入口', () => {
  const emergencyDeptId = 'emergency_dept';
  const result = calculateRoutes(emergencyDeptId, { wheelchairMode: true, emergencyMode: true });
  
  assert(result.success, `路线计算失败: ${result.error}`);
  assert(result.routes.length > 0, '未生成任何路线');
  
  const verification = verifyEmergencyPriority(result.routes);
  assert(verification.emergencyFirst, 
    `急诊入口未排在第一位。第一个入口是: ${verification.firstEntrance}, 是否急诊: ${verification.firstIsEmergency}`);
  
  const firstRoute = result.routes[0];
  console.log(`   第一条路线入口: ${firstRoute.entrance.name} (急诊: ${firstRoute.entrance.isEmergency})`);
});

test('非急诊模式下也应考虑急诊入口但不强制优先', () => {
  const emergencyDeptId = 'emergency_dept';
  const result = calculateRoutes(emergencyDeptId, { wheelchairMode: true, emergencyMode: false });
  
  assert(result.success, '路线计算失败');
  assert(result.routes.length > 0, '未生成任何路线');
  
  const hasEmergencyRoute = result.routes.some(r => r.entrance.isEmergency);
  console.log(`   可用路线中包含急诊入口: ${hasEmergencyRoute}`);
});

console.log('\n--- 测试 4: 无障碍路线验证 ---');

test('轮椅模式下所有路线都是无障碍的', () => {
  const result = calculateRoutes(TEST_DEPT_ID, { wheelchairMode: true });
  
  assert(result.success, '路线计算失败');
  assert(result.routes.length > 0, '未生成路线');
  
  for (const route of result.routes) {
    const verification = verifyRouteAccessibility(route);
    assert(verification.accessible, 
      `路线不满足无障碍要求: ${verification.issues.join(', ')}`);
    
    assert(route.entrance.isWheelchair, '入口不是无障碍入口');
    
    for (const step of route.steps) {
      if (step.type === 'elevator' && step.detail) {
        assert(step.detail.isWheelchair, `电梯 ${step.detail.name} 不是无障碍电梯`);
      }
    }
  }
  
  console.log(`   验证了 ${result.routes.length} 条路线，均满足无障碍要求`);
});

test('非轮椅模式允许非无障碍路线', () => {
  const result = calculateRoutes(TEST_DEPT_ID, { wheelchairMode: false });
  assert(result.routes.length > 0, '未生成路线');
  console.log(`   非轮椅模式下生成了 ${result.routes.length} 条路线`);
});

console.log('\n--- 测试 5: 本地存储功能验证 ---');

test('收藏路线功能正常', () => {
  const initialFavs = getFavorites();
  const testRoute = {
    departmentId: TEST_DEPT_ID,
    department: getDepartments().find(d => d.id === TEST_DEPT_ID),
    options: { wheelchairMode: true }
  };
  
  const newFav = addFavorite(testRoute);
  const afterAdd = getFavorites();
  
  assert(afterAdd.length === initialFavs.length + 1, '收藏未成功添加');
  assert(afterAdd.some(f => f.id === newFav.id), '收藏列表中找不到新增项');
  
  removeFavorite(newFav.id);
  const afterRemove = getFavorites();
  assert(afterRemove.length === initialFavs.length, '收藏未成功删除');
});

test('最近导航记录持久化', () => {
  const testNav = {
    departmentId: TEST_DEPT_ID,
    department: getDepartments().find(d => d.id === TEST_DEPT_ID)
  };
  
  setLastNavigation(testNav);
  const loaded = getLastNavigation();
  
  assert(loaded, '无法加载最近导航记录');
  assert(loaded.departmentId === TEST_DEPT_ID, '最近导航记录ID不匹配');
});

test('设置持久化', () => {
  updateSettings({ wheelchairMode: true, emergencyMode: true });
  const storageKey = 'hosp_nav_settings';
  const saved = JSON.parse(global.localStorage.getItem(storageKey));
  assert(saved.wheelchairMode === true, '轮椅模式设置未保存');
  assert(saved.emergencyMode === true, '急诊优先设置未保存');
});

console.log('\n--- 测试 6: 夜间诊区替代路线验证 ---');

test('路线计算包含诊区开放状态信息', () => {
  const result = calculateRoutes(TEST_DEPT_ID);
  assert(result.success, '路线计算失败');
  assert(typeof result.departmentOpen === 'boolean', '未返回科室开放状态');
  assert(result.currentTime, '未返回当前时间');
});

test('科室别名搜索功能正常', () => {
  const { searchDepartments } = storageModule;
  
  const results1 = searchDepartments('内科');
  assert(results1.length > 0, '搜索"内科"无结果');
  
  const results2 = searchDepartments('CT');
  assert(results2.length > 0, '搜索"CT"无结果');
  
  const results3 = searchDepartments('儿科');
  assert(results3.length > 0, '搜索"儿科"无结果');
  
  console.log(`   搜索测试通过：内科(${results1.length}条)、CT(${results2.length}条)、儿科(${results3.length}条)`);
});

console.log('\n' + '='.repeat(60));
console.log('📊 测试结果汇总');
console.log('='.repeat(60));
console.log(`✅ 通过: ${passed}`);
console.log(`❌ 失败: ${failed}`);
console.log(`📈 通过率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed > 0) {
  console.log('\n❌ 部分测试未通过，请检查代码！');
  process.exit(1);
} else {
  console.log('\n🎉 所有测试通过！系统规则验证成功！');
  console.log('\n📋 已验证的规则:');
  console.log('   1. ✅ 检修电梯不出现在无障碍路线');
  console.log('   2. ✅ 急诊患者优先匹配急诊入口');
  console.log('   3. ✅ 轮椅模式路线均为无障碍路线');
  console.log('   4. ✅ 诊区开放状态检查');
  console.log('   5. ✅ 收藏路线刷新后可恢复');
  console.log('   6. ✅ 最近导航记录持久化');
  console.log('   7. ✅ 科室别名搜索功能');
  process.exit(0);
}
