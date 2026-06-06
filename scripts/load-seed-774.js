import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n' + '='.repeat(70));
console.log('🏥 医院楼宇寻路助手 - seed-774 样例数据加载脚本');
console.log('='.repeat(70) + '\n');

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
  storage,
  STORAGE_KEYS,
  updateElevatorStatus,
  addHistory,
  getHistory,
  generateBusinessNo,
  getHistoryByBusinessNo,
  getElevatorsWithStatus,
  clearHistory
} = storageModule;

const {
  calculateRoutes,
  verifyNoOutOfServiceElevators
} = routeModule;

const seedPath = path.join(__dirname, '../seed-774.json');
const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

console.log('📦 加载 seed-774.json 样例数据...');
console.log(`   - 样例描述: ${seedData.description}`);
console.log(`   - 历史样例数: ${seedData.historySamples.length}`);
console.log(`   - 测试场景数: ${seedData.testScenarios.length}\n`);

initializeData();

console.log('🔧 应用电梯状态配置...');
for (const [elevId, statusInfo] of Object.entries(seedData.elevatorStatuses)) {
  updateElevatorStatus(elevId, statusInfo.status);
  console.log(`   - 电梯 ${elevId}: ${statusInfo.status === 'running' ? '✅ 运行中' : '🔧 检修中'}`);
}

console.log('\n🗑️ 清空现有历史记录...');
clearHistory();

console.log('\n📝 生成历史记录并输出业务编号...');
console.log('-'.repeat(70));
console.log(`${'序号'.padEnd(4)} ${'业务编号'.padEnd(24)} ${'科室'.padEnd(12)} ${'轮椅模式'.padEnd(8)} ${'急诊优先'.padEnd(8)}`);
console.log('-'.repeat(70));

const generatedBusinessNos = [];

seedData.historySamples.forEach((sample, index) => {
  const historyItem = addHistory(sample);
  generatedBusinessNos.push(historyItem.businessNo);
  
  const wheelchairFlag = sample.options?.wheelchairMode ? '♿ 是' : '  否';
  const emergencyFlag = sample.options?.emergencyMode ? '🚑 是' : '  否';
  
  console.log(
    `${String(index + 1).padEnd(4)} ` +
    `${historyItem.businessNo.padEnd(24)} ` +
    `${sample.department.name.padEnd(12)} ` +
    `${wheelchairFlag.padEnd(8)} ` +
    `${emergencyFlag.padEnd(8)}`
  );
});

console.log('-'.repeat(70));
console.log(`\n✅ 成功生成 ${generatedBusinessNos.length} 条历史记录\n`);

console.log('📋 业务编号清单:');
generatedBusinessNos.forEach((no, i) => {
  console.log(`   ${i + 1}. ${no}`);
});

console.log('\n' + '='.repeat(70));
console.log('🧪 失败分支测试：停用电梯不能出现在无障碍路线里');
console.log('='.repeat(70) + '\n');

const testScenario = seedData.testScenarios[0];
console.log(`测试场景: ${testScenario.name}`);
console.log(`场景描述: ${testScenario.description}`);
console.log(`测试科室: ${testScenario.departmentId}`);
console.log(`停用电梯: ${testScenario.disabledElevator}\n`);

const elevators = getElevatorsWithStatus();
const disabledElev = elevators.find(e => e.id === testScenario.disabledElevator);
console.log(`当前电梯状态: ${disabledElev.name}(${testScenario.disabledElevator}) = ${disabledElev.status === 'running' ? '运行中' : '检修中(停用)'}\n`);

const result = calculateRoutes(testScenario.departmentId, testScenario.options);

if (result.success && result.routes.length > 0) {
  console.log(`✅ 成功生成 ${result.routes.length} 条路线\n`);
  
  let allPassed = true;
  
  result.routes.forEach((route, routeIndex) => {
    const verification = verifyNoOutOfServiceElevators(route);
    const routePassed = verification.valid;
    
    if (!routePassed) {
      allPassed = false;
      console.log(`❌ 方案 ${routeIndex + 1} 失败:`);
      verification.outOfServiceElevators.forEach(elev => {
        console.log(`   - 使用了停用电梯: ${elev.name}(${elev.id})`);
      });
    } else {
      console.log(`✅ 方案 ${routeIndex + 1} 通过 (入口: ${route.entrance.name}, 预计 ${route.estimatedTime} 分钟)`);
    }
    
    const usedElevators = route.steps
      .filter(s => s.type === 'elevator')
      .map(s => `${s.detail.name}(${s.detail.id})`);
    
    if (usedElevators.length > 0) {
      console.log(`   使用电梯: ${usedElevators.join(', ')}`);
    }
  });
  
  console.log('\n' + '-'.repeat(70));
  if (allPassed) {
    console.log('🎉 失败分支测试通过！所有路线均不包含停用电梯');
  } else {
    console.log('❌ 失败分支测试未通过！存在路线包含停用电梯');
  }
} else {
  console.log(`⚠️  未生成路线: ${result.error || '无可用路线'}`);
  console.log('   这可能是预期行为：当唯一可用的电梯停用时，无法生成无障碍路线');
}

console.log('\n' + '='.repeat(70));
console.log('📊 汇总信息');
console.log('='.repeat(70));
console.log(`样例数据文件: seed-774.json`);
console.log(`生成历史记录数: ${generatedBusinessNos.length}`);
console.log(`首个业务编号: ${generatedBusinessNos[0]}`);
console.log(`末个业务编号: ${generatedBusinessNos[generatedBusinessNos.length - 1]}`);
console.log('\n💡 提示: 业务编号可用于在历史筛查页面搜索特定记录');
console.log('='.repeat(70) + '\n');

process.exit(0);
