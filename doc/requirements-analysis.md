# ReleasePulse 需求分析

## 日期: 2026-06-20

### 技术选型分析

1. **浏览器插件标准**: Manifest V3 (Chrome/Edge 兼容，Firefox 也在逐步支持)
2. **前端框架**: React + TypeScript (生态成熟，类型安全)
3. **UI 样式**: TailwindCSS (快速开发，一致性好)
4. **构建工具**: Vite + @crxjs/vite-plugin (专为浏览器插件开发设计)
5. **状态管理**: Zustand (轻量，适合插件场景)
6. **存储**: chrome.storage.local (订阅配置) + IndexedDB (通知历史)

### 架构设计

#### 核心模块

1. **Background Service Worker**: 定时轮询 GitHub API，检测更新，发送通知
2. **Popup UI**: 快速查看通知、管理订阅入口
3. **Options Page**: 完整的订阅管理、设置（GitHub Token 配置等）
4. **Content Script**: 暂不需要（首期不需要注入页面）

#### 数据模型

- **Subscription**: 订阅项 (类型、仓库/issue 信息、最后检查时间等)
- **Notification**: 通知记录 (关联订阅、内容、时间、已读状态)
- **Settings**: 用户设置 (GitHub Token、轮询间隔等)

#### GitHub API 策略

- 使用 GitHub REST API v3
- 需要 Personal Access Token (PAT) 提高速率限制
- 未认证: 60 req/hour; 认证后: 5000 req/hour
- 轮询间隔默认 15 分钟，可配置

### 风险与注意事项

- GitHub API 速率限制需要妥善处理
- Manifest V3 Service Worker 生命周期限制（会被休眠，需用 chrome.alarms）
- Token 安全存储（使用 chrome.storage.local，不暴露到 content script）
