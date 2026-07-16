# 毕业数据报告系统 - 前端

## 技术栈

- Vue 3 + Composition API
- Vite 5
- Element Plus
- ECharts
- Axios
- Vue Router

## 项目结构

```
src/
├── main.js
├── App.vue                              # 根组件（全局挂载 AI 悬浮助手）
├── router/
│   ├── index.js                         # 主路由（公开展示 + 管理后台）
│   └── student.js                       # 学生端路由
├── layouts/
│   ├── StudentLayout.vue                # 公开展示页布局
│   └── AdminLayout.vue                  # 管理后台布局
├── stores/
│   └── auth.js                          # 登录态（管理员 / 学生）
├── api/                                 # 接口封装
│   ├── request.js                       # Axios 封装
│   ├── graduationData.js
│   ├── batch.js
│   ├── student.js
│   ├── growth.js
│   ├── destination.js
│   ├── learning.js
│   ├── report.js
│   ├── template.js
│   ├── import.js
│   ├── admin.js                         # 管理员 + AI 接口
│   ├── adminVerify.js
│   ├── studentRequest.js
│   └── studentVerify.js
├── utils/
│   ├── aiStreamChat.js                  # AI 流式对话（SSE）
│   └── storyGenerator.js                # 数据页规则解说文案
├── components/
│   ├── AIFloatButton.vue                # 全局 AI 悬浮助手
│   ├── DataStory.vue                    # 数据解说（打字机 + 语音）
│   ├── DanmakuLayer.vue
│   ├── MessageWall.vue
│   └── PostcardGenerator.vue
├── views/                               # 页面
│   ├── Home.vue                         # 首页
│   ├── GrowthTrajectory.vue             # 成长轨迹
│   ├── DestinationMap.vue               # 去向地图
│   ├── LearningProfile.vue              # 学习画像
│   ├── ReportDownload.vue               # 报告下载
│   ├── FooterEnding.vue                 # 结尾页
│   ├── StudentLogin.vue                 # 访客登录入口
│   ├── AdminLogin.vue
│   ├── AdminDashboard.vue
│   ├── AdminBatch.vue
│   ├── AdminStudent.vue
│   ├── AdminStatistics.vue
│   ├── AdminTemplate.vue
│   ├── AdminAI.vue                      # 管理后台 AI 助手
│   ├── AdminImport.vue
│   ├── AdminVerify.vue
│   ├── AdminReport.vue
│   ├── AdminStudentReport.vue
│   └── student/                         # 学生个人中心
│       ├── Login.vue
│       ├── Profile.vue
│       ├── Grade.vue
│       ├── Achievement.vue
│       ├── Comparison.vue
│       ├── Timeline.vue
│       ├── Message.vue
│       └── Verify.vue
└── styles/
    └── admin-theme.css
```

## 环境要求

- Node.js 18+
- npm 9+

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问：`http://localhost:3000`

### 3. 构建生产版本

```bash
npm run build
```

## 页面路由

### 公开展示（`/`，无需登录）

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | Home | 首页 - 年份选择 + 概览 |
| `/growth` | GrowthTrajectory | 成长轨迹（含 DataStory 解说） |
| `/destination` | DestinationMap | 去向地图（含 DataStory 解说） |
| `/learning` | LearningProfile | 学习画像（含 DataStory 解说） |
| `/report` | ReportDownload | 报告下载 |
| `/ending` | FooterEnding | 结尾页 |

### 学生端（需学生登录）

| 路径 | 说明 |
|------|------|
| `/student/login` | 学生登录 |
| `/student/profile` | 个人总览 |
| `/student/grade` | 成绩画像 |
| `/student/achievement` | 成就中心 |
| `/student/comparison` | 横向对比 |
| `/student/timeline` | 成长轨迹 |
| `/student/message` | 母校留言 |
| `/student/verify` | 扫码核销 |

### 管理后台（需管理员登录）

| 路径 | 说明 |
|------|------|
| `/admin/login` | 管理员登录 |
| `/admin/dashboard` | 仪表盘 |
| `/admin/batch` | 批次管理 |
| `/admin/student` | 学生管理 |
| `/admin/statistics` | 数据统计 |
| `/admin/template` | 报告模板 |
| `/admin/ai` | AI 助手 |
| `/admin/import` | 数据导入 |
| `/admin/verify` | 核销管理 |
| `/admin/report/:year` | 年度报告 |
| `/admin/student-report/:studentId` | 学生个人报告 |

## 代理配置

前端开发环境通过 Vite 代理转发到后端（`vite.config.js`）：

```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8888',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

示例：

- 前端请求 `/api/graduation-data`
- 实际转发到 `http://localhost:8888/graduation-data`

> 后端默认端口为 **8888**（见后端 `application.yml`），不是 8080。

## AI 相关说明

| 能力 | 实现 | 入口 |
|------|------|------|
| 智能问答 | 后端智谱 GLM + `/ai/chat/stream` | 全局 `AIFloatButton`、管理后台 `/admin/ai` |
| 数据解说 | 前端规则模板 `storyGenerator.js` | 成长轨迹 / 去向地图 / 学习画像页顶部 |

两处 AI 能力互补：前者可对话，后者按页面数据自动播报。

## 技术说明

- **状态管理**：Vue 3 Composition API + `stores/auth.js`
- **图表**：ECharts
- **UI**：Element Plus
- **HTTP**：Axios 统一封装（`api/request.js`）
