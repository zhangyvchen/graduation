# 毕业数据报告系统 - 前端

## 技术栈

### 基础框架
- Vue 3 + Composition API
- Vite 5
- Vue Router 4
- Element Plus
- Axios
- ECharts 5

### AI / 交互
- **SSE** 流式对话（`utils/aiStreamChat.js`）
- **Composable**：`composables/useAiChat.js`（多会话、模型切换、识图、记忆、历史）
- 富文本渲染：`ChatRichBody.vue` + `aiContentParts.js`（Markdown / ECharts 代码块）
- 全局悬浮助手 `AIFloatButton.vue` + 管理端 `AdminAI.vue`
- AI 风控页 `AdminAiRisk.vue`、历史页 `AdminAiHistory.vue`
- 一键周报/月报弹窗 `PeriodBriefDialog.vue`；报告页「未来建议」一键生成

### 其它能力
- html2canvas / jsPDF（报告 / 周报 PDF 导出）
- html5-qrcode / qrcode（扫码核销、二维码）
- 规则解说 `storyGenerator.js` + `DataStory.vue`（非大模型）

> 以后每引入新技术，请在文末「技术引入记录」追加一行。

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
│   ├── aiContentParts.js                # 拆分 Markdown / echarts 代码块
│   ├── formatAIContent.js               # 简易 Markdown → HTML
│   ├── imageCompress.js                 # 识图上传前压缩
│   └── storyGenerator.js                # 数据页规则解说文案
├── composables/
│   └── useAiChat.js                     # 对话公共逻辑
├── components/
│   ├── AIFloatButton.vue                # 全局 AI 悬浮助手
│   ├── ChatRichBody.vue                 # AI 消息富文本 + 图表
│   ├── PeriodBriefDialog.vue            # 一键周报 / 月报
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
│   ├── AdminAI.vue                      # 管理后台 AI 助手（含周报入口）
│   ├── AdminAiHistory.vue               # AI 聊天历史管理
│   ├── AdminAiRisk.vue                  # AI 风控
│   ├── AdminImport.vue
│   ├── AdminVerify.vue
│   ├── AdminReport.vue
│   ├── AdminStudentReport.vue           # 管理端学生报告（含未来建议）
│   ├── StudentReport.vue                # 学生端报告（含未来建议）
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
| `/admin/ai` | AI 助手（对话 / 识图 / 一键周报月报） |
| `/admin/ai-history` | AI 聊天历史管理 |
| `/admin/ai-risk` | AI 风控（异常对话 / 危险词） |
| `/admin/import` | 数据导入 |
| `/admin/verify` | 核销管理 |
| `/admin/report/:year` | 年度报告 |
| `/admin/student-report/:studentId` | 学生个人报告（含未来建议） |

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
| 智能问答 | SSE `/ai/chat/stream` + `useAiChat` | `AIFloatButton`、`/admin/ai` |
| 模型切换 | `GET /ai/models`（识图 / 纯文本） | 对话页模型下拉 |
| 识图 | 压缩上传 + 多模态流式 | 仅视觉模型可选 |
| 富文本 / 图表 | `ChatRichBody` 解析 markdown 与 echarts 块 | 助手消息气泡 |
| 风控预检 | `/ai/risk-check` | `useAiChat` |
| 异常 / 词库 | 异常表、自定义危险词 | `/admin/ai-risk` |
| 聊天历史管理 | `/ai/messages/manage` 等 | `/admin/ai-history` |
| 一键周报 / 月报 | `/ai/period-brief` + PDF 导出 | `AdminAI` → `PeriodBriefDialog` |
| 未来建议 | `/ai/student-future-advice`（生成/编辑/清除） | 管理端 / 学生端报告页 |
| 学生快捷问 | 按角色切换：画像解读、优势短板、就业升学、同窗对比 | `AIFloatButton`（学生登录） |
| 同窗对比问答 | AI 上下文注入匿名均值/排名（复用 comparison） | 学生快捷问「同窗对比」 |
| 数据解说 | 前端规则模板 `storyGenerator.js` | 成长轨迹 / 去向 / 学习画像 |

两处 AI 界面共用 `useAiChat`，UI 各自独立：前者是全局助手，后者是后台工作台。学生登录后快捷词与管理员不同。

## 技术说明

- **状态管理**：Vue 3 Composition API + `stores/auth.js`
- **图表**：ECharts
- **UI**：Element Plus
- **HTTP**：Axios 统一封装（`api/request.js`）
- **流式 AI**：SSE + `aiStreamChat.js`

## 技术引入记录

> 每次用了新技术就往下加一行。

| 日期 | 技术 | 用途 |
|------|------|------|
| 初期 | Vue 3 / Vite / Vue Router / Element Plus | 前端主框架与 UI |
| 初期 | Axios / ECharts | 请求与数据可视化 |
| 中期 | html2canvas / jsPDF | 报告导出相关 |
| 中期 | html5-qrcode / qrcode | 扫码核销 |
| 2026-07 | SSE + `aiStreamChat` | AI 流式打字输出 |
| 2026-07 | `useAiChat` composable | 悬浮窗与管理页共用对话逻辑 |
| 2026-07 | AI 风控页 + 发送预检 | 对接异常表与危险词管理 |
| 2026-07 | `ChatRichBody` + 模型切换 | 图表块渲染、识图/纯文本切换 |
| 2026-07 | 周报月报弹窗 + 未来建议 | 对接 `period-brief` / `student-future-advice` |
| 2026-07 | 学生端快捷场景 + 建议编辑 | 角色分流快捷问；报告页编辑/复制建议 |
