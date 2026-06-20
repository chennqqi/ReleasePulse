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

## 日期: 2026-06-20 — 产品设计分析

### 现状问题

- 研发实现为功能导向（Release/Tag/Issue 三类型并列），用户认知成本高
- Popup 仅通知流，Options 单页混合引导/订阅/设置，信息架构混乱
- 品牌使用通用蓝色+铃铛，与 GitHub Watch 难以区分
- 仓库页双按钮注入，首次使用引导在 Popup/Options 重复

### 重设计方向

- 用户任务导向：RepoWatch（仓库+事件勾选）替代多条独立订阅
- Popup 三 Tab + Options 侧边栏，Settings 独立且展示 API 同步状态
- GitHub 统一「Watch with ReleasePulse」按钮 + Popover
- 视觉：Indigo #4338CA + Coral #FF6B4A，Logo 脉冲→箭头语义
- 路线图分三阶段：体验修复 → 模型优化 → 多源扩展

## 日期: 2026-06-20 — Phase 1 落地

- 已实现品牌、Popup 三 Tab、Options 侧边栏、GitHub Watch Popover
- Settings 新增 onboardingCompleted / lastSyncAt / apiRemaining 字段
- 构建验证通过（npm run build）

## 日期: 2026-06-20 — Phase 2 落地

- RepoWatch 替代 release/tag 双订阅，migrate.ts 自动迁移 v1 数据
- checker 拆分 checkRepoWatch + checkIssueSubscription
- storage 分为 repoWatches / issueSubscriptions 两个 key
- UI Add 流程改为 Repository(Issue) + 事件勾选
