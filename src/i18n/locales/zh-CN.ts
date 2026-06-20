/** Simplified Chinese locale translations. */
export const zhCN = {
  // App name
  'app.name': 'ReleasePulse',
  'app.version': '版本 {version}',

  // Common
  'common.add': '添加',
  'common.apply': '应用',
  'common.applying': '应用中...',
  'common.checkNow': '立即检查',
  'common.settings': '设置',
  'common.about': '关于',
  'common.releases': 'Releases',
  'common.tags': 'Tags',
  'common.issue': 'Issue',
  'common.repository': '仓库',
  'common.all': '全部',
  'common.watch': '关注',
  'common.watching': '关注中',
  'common.watched': '已关注',
  'common.enabled': '已启用',
  'common.disabled': '已禁用',
  'common.lastChecked': '上次检查: {time}',
  'common.never': '从未',
  'common.justNow': '刚刚',
  'common.minAgo': '{min} 分钟前',
  'common.hourAgo': '{hour} 小时前',
  'common.dayAgo': '{day} 天前',
  'common.today': '今天',
  'common.yesterday': '昨天',
  'common.earlier': '更早',
  'common.noEvents': '无事件',
  'common.notifyOn': '通知事件:',

  // Type labels
  'type.github_release': 'Release',
  'type.github_tag': 'Tag',
  'type.github_issue': 'Issue',

  // Popup tabs
  'popup.tab.feed': '动态',
  'popup.tab.watching': '关注',
  'popup.tab.add': '添加',

  // Popup feed
  'popup.noNotifications': '暂无通知',
  'popup.watchingItems': '关注 {count} 项',
  'popup.markAllRead': '全部标为已读',
  'popup.clearAll': '清空全部',

  // Popup watching tab
  'popup.noWatches': '暂无关注',
  'popup.addFirstWatch': '添加第一个关注',

  // Popup add tab
  'popup.addWatch': '添加关注',
  'popup.openFullSettings': '打开完整设置 →',
  'popup.errorInvalidIssueUrl': '请输入有效的 GitHub Issue 链接',
  'popup.errorInvalidRepoUrl': '请输入有效的 GitHub 仓库链接或 owner/repo',
  'popup.errorSelectEvent': '请至少选择一种事件类型',

  // Onboarding
  'onboarding.welcome': '欢迎使用 ReleasePulse',
  'onboarding.subscribeGithub': '在 GitHub 上订阅',
  'onboarding.configureApi': '配置 API 访问',
  'onboarding.welcomeDesc': '获取 GitHub 仓库的新 Release、Tag 和 Issue 状态变更通知。',
  'onboarding.subscribeDesc': '访问任意 GitHub 仓库页面点击 Watch with ReleasePulse，或手动添加关注。',
  'onboarding.configureApiDesc': '添加 GitHub Token 可将 API 限制从 60 次/小时提升至 5,000 次/小时。',
  'onboarding.tokenHint': '不配置 Token 时关注较多仓库可能触发速率限制。',
  'onboarding.exploreGithub': '浏览 GitHub 仓库',
  'onboarding.finishSetup': '完成设置',
  'onboarding.skipForNow': '暂时跳过',
  'onboarding.continue': '继续',

  // Options nav
  'options.nav.watching': '关注',
  'options.nav.settings': '设置',
  'options.nav.about': '关于',

  // Options watching page
  'options.watching.title': '关注 ({count})',
  'options.watching.addWatch': '添加关注',
  'options.watching.noWatches': '暂无关注。在上方添加或使用 GitHub 页面上的 Watch with ReleasePulse。',
  'options.watching.errorInvalidIssueUrl': '请输入有效的 GitHub Issue 链接（如 https://github.com/owner/repo/issues/123）',
  'options.watching.errorInvalidRepoUrl': '请输入有效的 GitHub 仓库链接或 owner/repo',
  'options.watching.errorSelectEvent': '请至少选择一种事件类型',

  // Options settings page
  'options.settings.title': '设置',
  'options.settings.language': '语言',
  'options.settings.languageAuto': '自动（跟随浏览器）',
  'options.settings.token': 'GitHub Personal Access Token',
  'options.settings.tokenHint': '无 Token: 60 次/小时。有 Token: 5,000 次/小时。',
  'options.settings.createToken': '创建 Token',
  'options.settings.checkInterval': '检查间隔（分钟）',
  'options.settings.desktopNotif': '启用桌面通知',

  // Options about page
  'options.about.title': '关于',
  'options.about.description': 'ReleasePulse 监控你的 GitHub 仓库，在有新 Release、Tag 和 Issue 状态变更时通知你——不错过任何重要更新。',
  'options.about.feature1': '关注仓库并自定义 Releases 和 Tags 事件',
  'options.about.feature2': '订阅单个 Issue 以获取状态更新',
  'options.about.feature3': '桌面通知与可配置的检查间隔',

  // Status bar
  'status.notSynced': '尚未同步',
  'status.syncedJustNow': '刚刚同步',
  'status.syncedMinAgo': '{min} 分钟前同步',
  'status.syncedHourAgo': '{hour} 小时前同步',
  'status.syncedDate': '同步于 {date}',
  'status.apiDash': 'API: —',
  'status.apiCount': 'API: {remaining}/{limit}',
  'status.watchCount': '{count} 个关注',

  // Content script
  'content.watchWithReleasePulse': 'Watch with ReleasePulse',
  'content.watching': '关注中',
  'content.newReleases': '新 Release',
  'content.newReleasesChecked': '新 Release ✓',
  'content.newTags': '新 Tag',
  'content.newTagsChecked': '新 Tag ✓',
  'content.subscribeIssue': '订阅 Issue',
  'content.subscribed': '已订阅',
  'content.subscribing': '订阅中...',
  'content.failedRetry': '失败 - 重试?',

  // Manifest
  'manifest.name': 'ReleasePulse',
  'manifest.description': '订阅软件 Release 通知（GitHub releases、tags、issues）',

  // Notifications
  'notif.newRelease': '新 Release: {label}',
  'notif.newTag': '新 Tag: {label}',
  'notif.issueUpdate': 'Issue #{number} {event}: {label}',
  'notif.issueBody': '{actor} {event} 了此 Issue',
}
