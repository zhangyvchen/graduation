# 毕业数据报告系统 - 前端页面

## 技术栈

- Vue 3
- Vite 5
- Element Plus
- ECharts
- Axios
- Vue Router

## 项目结构

```
src/
├── main.js                               # 入口文件
├── App.vue                               # 根组件
├── router/
│   └── index.js                          # 路由配置
├── api/                                  # API接口模块
│   ├── request.js                        # Axios封装
│   ├── graduationData.js                 # 毕业数据接口
│   ├── student.js                        # 学生接口
│   ├── growth.js                         # 成长轨迹接口
│   ├── destination.js                    # 去向数据接口
│   ├── learning.js                       # 学习画像接口
│   └── admin.js                          # 管理员接口
└── views/                                # 页面组件
    ├── Home.vue                          # 首页-概览数据
    ├── GrowthTrajectory.vue              # 成长轨迹页
    ├── DestinationMap.vue                # 去向地图页
    ├── LearningProfile.vue               # 学习画像页
    ├── ReportDownload.vue                # 报告下载页
    ├── AdminLogin.vue                    # 管理员登录页
    └── AdminDashboard.vue                # 管理后台页
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

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | Home | 首页-年份选择+概览数据 |
| `/growth` | GrowthTrajectory | 成长轨迹页 |
| `/destination` | DestinationMap | 去向地图页 |
| `/learning` | LearningProfile | 学习画像页 |
| `/report` | ReportDownload | 报告下载页 |
| `/admin` | AdminLogin | 管理员登录页 |
| `/admin/dashboard` | AdminDashboard | 管理后台页 |

## 代理配置

前端开发环境通过 Vite 代理转发请求到后端：

```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

前端请求 `/api/graduation-data` 会被转发到 `http://localhost:8080/graduation-data`。

## 技术说明

- **状态管理**：使用 Vue 3 Composition API
- **图表展示**：使用 ECharts 绑定数据可视化
- **UI组件**：使用 Element Plus 组件库
- **HTTP请求**：使用 Axios 封装，统一处理请求和响应
