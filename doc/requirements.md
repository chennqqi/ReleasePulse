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

## 2026-06-20 生产可用性评估

- 结论：可 Beta/侧载发布，尚不满足 Chrome 商店正式 1.0 标准
- 缺口：无测试、无隐私政策、Issue 通知重复风险、商店素材缺失

## 2026-06-20 P0 发布准备

- 修复 Issue 增量通知（事件时间戳游标，替代 stateHash）
- API 错误分类 + Popup/Settings 同步错误提示
- 新增 PRIVACY.md、doc/store-listing.md、GitHub Actions CI

## 2026-06-20 v1.0.0 发布准备

- 版本 bump 至 1.0.0（package.json / manifest / src/version.ts）
- Vitest 单元测试 26 项（issue-events、github-api、sync-error、subscription-utils）
- 商店截图整理至 doc/store-screenshots/（来自 data/）
- README 与 store-listing 更新，直接公开上架流程

## 2026-06-20 Firefox 兼容性咨询

- 询问当前代码是否兼容 Firefox；需评估 MV3、API、构建与 AMO 上架差异

## 2026-06-20 Firefox 适配与验证

- 增加 gecko.id、browser.ts 跨浏览器通知/图标、web-ext lint/CI、doc/firefox.md 验证清单

## 2026-06-20 README 浏览器兼容与 Firefox zip

- Firefox 136+ 测试通过；Chrome/Firefox 商店发布收尾（release:pack、双 zip、release-checklist、AMO data_collection none）
