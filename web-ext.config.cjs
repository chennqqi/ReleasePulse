/** web-ext configuration for Firefox lint and temporary install. */
module.exports = {
  sourceDir: 'dist',
  run: {
    startUrl: ['https://github.com/trending'],
  },
  lint: {
    selfHosted: true,
  },
  ignoreFiles: ['**/*.map'],
}
