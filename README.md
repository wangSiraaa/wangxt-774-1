# 医院楼宇无障碍寻路系统

基于 Vue 3 + Vite 构建的医院楼宇无障碍寻路前端系统。支持轮椅路线规划、急诊优先、电梯/入口状态管理等功能。

## 功能特性

### 🧭 核心寻路功能
- **科室搜索**: 支持科室名称、别名、拼音首字母搜索（如内科、CT、儿科等）
- **智能路线计算**: 综合考虑楼栋、楼层、诊区开放时间
- **轮椅模式**: 自动筛选无障碍电梯、无障碍坡道、无障碍入口
- **急诊优先**: 急诊患者自动优先匹配急诊入口和急诊电梯
- **夜间替代路线**: 非开放时间的科室自动推荐替代科室

### 👤 陪诊人功能
- **路线收藏**: 常用科室路线一键收藏
- **导航恢复**: 刷新页面后可恢复最近一次导航
- **实时状态**: 实时显示当前时间和诊区开放状态

### 🛠️ 导医台管理
- **电梯状态管理**: 设置电梯运行/检修状态
- **入口拥堵管理**: 设置入口畅通/中等/拥堵状态
- **系统状态看板**: 实时统计运行电梯、检修电梯、无障碍设施数量
- **数据重置**: 一键恢复所有默认数据

### 💾 本地数据存储
所有数据保存在浏览器 LocalStorage，包含：
- 科室别名配置
- 楼层连接点（连廊、地下通道等）
- 电梯/扶梯实时状态
- 无障碍坡道信息
- 急诊入口标记
- 收藏的路线
- 最近一次导航结果

## 快速开始

### 方式一：Node.js 本地运行

#### 环境要求
- Node.js >= 16.0.0
- npm 或 yarn

#### 安装依赖
```bash
npm install
```

#### 启动开发服务器
```bash
npm run dev
```
访问 http://localhost:3000

#### 构建生产版本
```bash
npm run build
```

#### 预览生产版本
```bash
npm run preview
```

### 方式二：Docker 运行

#### 构建镜像
```bash
docker build -t hospital-navigation .
```

#### 启动容器
```bash
docker run -d -p 8080:80 --name hospital-nav hospital-navigation
```

访问 http://localhost:8080

#### 停止容器
```bash
docker stop hospital-nav
```

### 方式三：Docker Compose （可选）

创建 `docker-compose.yml`:
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8080:80"
    restart: always
```

## 规则验证脚本

系统内置自动化验证脚本，用于验证核心业务规则。

### 运行验证脚本
```bash
npm test
```

或直接运行：
```bash
node scripts/check-navigation.js
```

### 验证的规则清单

| 规则编号 | 规则描述 | 验证状态 |
|---------|---------|---------|
| R1 | 检修电梯不得出现在无障碍路线 | ✅ |
| R2 | 急诊患者优先匹配急诊入口 | ✅ |
| R3 | 夜间关闭诊区给出替代路线建议 | ✅ |
| R4 | 轮椅模式下所有路线均为无障碍 | ✅ |
| R5 | 收藏路线刷新后仍可恢复 | ✅ |
| R6 | 最近导航记录持久化存储 | ✅ |
| R7 | 科室别名搜索功能正常 | ✅ |

### 脚本执行流程
1. 将 1 号电梯（E1）置为检修停用状态
2. 计算内科门诊的轮椅路线
3. 断言所有路线详情中均不包含停用的 E1 电梯
4. 计算急诊科路线，验证急诊入口排在第一选择
5. 验证本地存储功能（收藏、导航历史等）

## 项目结构

```
.
├── src/
│   ├── data/
│   │   └── hospitalData.js    # 医院基础数据（楼栋、科室、电梯、入口等）
│   ├── utils/
│   │   ├── storage.js         # 本地存储管理
│   │   └── routeCalculator.js # 路线计算核心算法
│   ├── pages/
│   │   ├── SearchPage.vue     # 搜索页面
│   │   ├── RoutePage.vue      # 路线展示页面
│   │   ├── FavoritesPage.vue  # 收藏页面
│   │   └── AdminPage.vue      # 导医台管理页面
│   ├── App.vue                # 根组件
│   └── main.js                # 应用入口
├── scripts/
│   └── check-navigation.js    # 规则验证脚本
├── Dockerfile                 # Docker 构建配置
├── nginx.conf                 # Nginx 配置
├── vite.config.js             # Vite 配置
├── package.json
└── README.md
```

## 使用说明

### 患者/陪诊人使用
1. 在搜索页面输入科室名称或别名（如"内科"、"CT"、"儿科"）
2. 根据需要开启顶部的"♿ 轮椅模式"或"🚑 急诊优先"
3. 点击搜索结果进入路线详情页
4. 查看推荐路线方案，点击不同方案切换
5. 点击"⭐ 收藏路线"保存常用路线
6. 在"收藏"页面查看和管理已收藏的路线

### 导医台使用
1. 进入"🛠️ 导医台"管理页面
2. **电梯管理**: 点击"设为检修"将电梯置为停用状态，系统自动将其从无障碍路线中排除
3. **入口管理**: 设置各入口的拥堵状态，影响路线优先级
4. 查看系统状态看板了解整体运行情况
5. 需要时可点击"重置所有数据"恢复默认配置

## 路线计算算法说明

### 路线评分因素
- **急诊模式**: 急诊入口 +1000 分
- **无障碍适配**: 无障碍入口 +100 分，非无障碍入口 -500 分
- **拥堵程度**: 畅通 +50，中等 +20，拥堵 -30
- **距离因素**: 入口到科室距离越近分数越高
- **同楼优先**: 入口与科室同楼栋 +80 分
- **邻近入口**: 科室推荐入口 +60 分

### 电梯选择策略
1. 轮椅模式只选择 `isWheelchair: true` 的电梯
2. 只选择 `status: running` 状态的电梯
3. 优先选择停靠楼层匹配的无障碍电梯
4. 检修电梯（`status: maintenance`）完全排除

## 浏览器兼容性

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

支持 LocalStorage 和 ES6+ 特性。

## 开发说明

### 技术栈
- Vue 3 (Composition API)
- Vue Router 4
- Pinia (状态管理预留)
- Vite 5
- 原生 CSS（无 UI 框架依赖）

### 核心模块

#### 数据层 ([hospitalData.js](src/data/hospitalData.js))
定义所有静态数据：楼栋、楼层、科室、电梯、扶梯、坡道、连接通道、入口、诊区等。

#### 存储层 ([storage.js](src/utils/storage.js))
封装 LocalStorage 操作，提供：
- 电梯/入口状态读写
- 收藏管理
- 导航历史
- 设置持久化

#### 算法层 ([routeCalculator.js](src/utils/routeCalculator.js))
路线计算核心逻辑：
- `calculateRoutes()` - 主计算函数
- `verifyRouteAccessibility()` - 无障碍验证
- `verifyEmergencyPriority()` - 急诊优先验证
- `verifyNoOutOfServiceElevators()` - 停用电梯排除验证

## License

MIT
