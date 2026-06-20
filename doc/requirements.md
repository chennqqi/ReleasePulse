# ReleasePulse 需求文档

## 项目目标

开发一个浏览器插件，实现订阅通知功能。核心定位是订阅软件 release 通知。

## 首期目标：GitHub 订阅

- **新 Release 通知**：订阅的 GitHub 仓库有新 release 发布时通知用户
- **新 Tag 通知**：订阅的 GitHub 仓库有新 tag 创建时通知用户
- **Issue 订阅通知**：订阅的 issue 有状态变化（恢复 reopened、关闭 closed 等）时通知用户

## 未来规划

- 增加更多订阅源（如 GitLab、Bitbucket 等）
- 订阅更多类型的软件 release 通知

## 2026-06-20 产品设计重设计

- 产品经理视角重新设计信息架构、交互流程、视觉系统
- 订阅模型从「类型导向」改为「仓库级 Watch + 事件勾选」
- Popup 三 Tab（Feed / Watching / Add），Options 侧边栏导航
- GitHub 注入按钮合并为单一 Watch + Popover 配置
- 新品牌色 Indigo + Coral，新 Logo（脉冲波形→Release 箭头）
- 详见 doc/product-design.md 及 doc/design/ 设计稿

## 2026-06-20 Phase 1 实现

- 品牌色 Indigo #4338CA + 新 Logo/图标（脉冲波形→箭头）
- Popup 三 Tab：Feed / Watching / Add；Feed 支持类型筛选
- 统一 Onboarding（仅 Popup 三步引导，含 Token 配置）
- Options 侧边栏：Watching / Settings / About
- Settings 展示同步状态与 API 配额
- GitHub 统一「Watch with ReleasePulse」按钮 + Popover 勾选 Releases/Tags

## 2026-06-20 Phase 2 实现

- RepoWatch 数据模型：一仓库一条记录，events 勾选 Releases/Tags
- 自动迁移旧 subscriptions 至 repoWatches + issueSubscriptions
- Issue 订阅独立存储，Watching 页按仓库分组展示
- Options 支持在线勾选/取消 Releases、Tags 事件
- Feed 通知按 Today / Yesterday / Earlier 分组
