/** English locale translations. */
export const en = {
  // App name
  'app.name': 'ReleasePulse',
  'app.version': 'Version {version}',

  // Common
  'common.add': 'Add',
  'common.apply': 'Apply',
  'common.applying': 'Applying...',
  'common.checkNow': 'Check now',
  'common.settings': 'Settings',
  'common.about': 'About',
  'common.releases': 'Releases',
  'common.tags': 'Tags',
  'common.issue': 'Issue',
  'common.repository': 'Repository',
  'common.all': 'All',
  'common.watch': 'Watch',
  'common.watching': 'Watching',
  'common.watched': 'Watched',
  'common.enabled': 'Enabled',
  'common.disabled': 'Disabled',
  'common.lastChecked': 'Last checked: {time}',
  'common.never': 'Never',
  'common.justNow': 'Just now',
  'common.minAgo': '{min}m ago',
  'common.hourAgo': '{hour}h ago',
  'common.dayAgo': '{day}d ago',
  'common.today': 'Today',
  'common.yesterday': 'Yesterday',
  'common.earlier': 'Earlier',
  'common.noEvents': 'No events',
  'common.notifyOn': 'Notify on:',

  // Type labels
  'type.github_release': 'Release',
  'type.github_tag': 'Tag',
  'type.github_issue': 'Issue',

  // Popup tabs
  'popup.tab.feed': 'Feed',
  'popup.tab.watching': 'Watching',
  'popup.tab.add': 'Add',

  // Popup feed
  'popup.noNotifications': 'No notifications',
  'popup.watchingItems': 'Watching {count} item(s)',
  'popup.markAllRead': 'Mark all read',
  'popup.clearAll': 'Clear all',

  // Popup watching tab
  'popup.noWatches': 'No watches yet',
  'popup.addFirstWatch': 'Add your first watch',

  // Popup add tab
  'popup.addWatch': 'Add watch',
  'popup.openFullSettings': 'Open full settings →',
  'popup.errorInvalidIssueUrl': 'Please enter a valid GitHub issue URL',
  'popup.errorInvalidRepoUrl': 'Please enter a valid GitHub repo URL or owner/repo',
  'popup.errorSelectEvent': 'Select at least one event type',

  // Onboarding
  'onboarding.welcome': 'Welcome to ReleasePulse',
  'onboarding.subscribeGithub': 'Subscribe on GitHub',
  'onboarding.configureApi': 'Configure API access',
  'onboarding.welcomeDesc': 'Get notified about new releases, tags, and issue updates from GitHub repos.',
  'onboarding.subscribeDesc': 'Visit any GitHub repo and click Watch with ReleasePulse, or add watches manually.',
  'onboarding.configureApiDesc': 'Add a GitHub token to increase API limit from 60 to 5,000 requests/hour.',
  'onboarding.tokenHint': 'Without a token you may hit rate limits with many watches.',
  'onboarding.exploreGithub': 'Explore GitHub repos',
  'onboarding.finishSetup': 'Finish setup',
  'onboarding.skipForNow': 'Skip for now',
  'onboarding.continue': 'Continue',

  // Options nav
  'options.nav.watching': 'Watching',
  'options.nav.settings': 'Settings',
  'options.nav.about': 'About',

  // Options watching page
  'options.watching.title': 'Watching ({count})',
  'options.watching.addWatch': 'Add watch',
  'options.watching.noWatches': 'No watches yet. Add one above or use Watch with ReleasePulse on GitHub.',
  'options.watching.errorInvalidIssueUrl': 'Please enter a valid GitHub issue URL (e.g. https://github.com/owner/repo/issues/123)',
  'options.watching.errorInvalidRepoUrl': 'Please enter a valid GitHub repo URL or owner/repo',
  'options.watching.errorSelectEvent': 'Select at least one event type',

  // Options settings page
  'options.settings.title': 'Settings',
  'options.settings.language': 'Language',
  'options.settings.languageAuto': 'Auto (browser)',
  'options.settings.token': 'GitHub Personal Access Token',
  'options.settings.tokenHint': 'Without a token: 60 requests/hour. With a token: 5,000 requests/hour.',
  'options.settings.createToken': 'Create token',
  'options.settings.checkInterval': 'Check interval (minutes)',
  'options.settings.desktopNotif': 'Enable desktop notifications',

  // Options about page
  'options.about.title': 'About',
  'options.about.description': 'ReleasePulse monitors your GitHub repositories and notifies you about new releases, tags, and issue status changes — so you never miss an update that matters.',
  'options.about.feature1': 'Watch repos with configurable Releases and Tags events',
  'options.about.feature2': 'Subscribe to individual issues for status updates',
  'options.about.feature3': 'Desktop notifications and configurable check interval',

  // Status bar
  'status.notSynced': 'Not synced yet',
  'status.syncedJustNow': 'Synced just now',
  'status.syncedMinAgo': 'Synced {min}m ago',
  'status.syncedHourAgo': 'Synced {hour}h ago',
  'status.syncedDate': 'Synced {date}',
  'status.apiDash': 'API: —',
  'status.apiCount': 'API: {remaining}/{limit}',
  'status.watchCount': '{count} watch(es)',

  // Content script
  'content.watchWithReleasePulse': 'Watch with ReleasePulse',
  'content.watching': 'Watching',
  'content.newReleases': 'New Releases',
  'content.newReleasesChecked': 'New Releases ✓',
  'content.newTags': 'New Tags',
  'content.newTagsChecked': 'New Tags ✓',
  'content.subscribeIssue': 'Subscribe Issue',
  'content.subscribed': 'Subscribed',
  'content.subscribing': 'Subscribing...',
  'content.failedRetry': 'Failed - Retry?',

  // Manifest
  'manifest.name': 'ReleasePulse',
  'manifest.description': 'Subscribe to software release notifications (GitHub releases, tags, issues)',

  // Notifications
  'notif.newRelease': 'New release: {label}',
  'notif.newTag': 'New tag: {label}',
  'notif.issueUpdate': 'Issue #{number} {event}: {label}',
  'notif.issueBody': '{actor} {event} the issue',
}
