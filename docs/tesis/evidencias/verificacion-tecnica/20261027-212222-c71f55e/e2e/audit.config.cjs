const path = require('path');
const root = path.resolve(__dirname, '../../../../../..');
const original = require(path.join(root, 'playwright.config.js'));
module.exports = {
  ...original,
  testDir: path.join(root, 'tests/e2e'),
  testMatch: ['responsive.smoke.spec.js', 'public.navigation-accessibility.spec.js', 'auth.password-recovery.spec.js', 'audit.protected-routes.spec.js'],
  grepInvert: /role dashboards responsive guard/,
  retries: 0,
  workers: 2,
  outputDir: path.join(__dirname, 'artefactos'),
  reporter: [['list'], ['json', { outputFile: path.join(__dirname, 'resultados.json') }], ['html', { outputFolder: path.join(__dirname, 'reporte-html'), open: 'never' }]],
  use: {
    ...original.use,
    baseURL: 'http://127.0.0.1:3100',
    serviceWorkers: 'block',
    // Puerto cerrado: la red externa no alcanza producción; las rutas mock se resuelven en Playwright.
    proxy: { server: 'http://127.0.0.1:9', bypass: '127.0.0.1,localhost' },
    trace: 'off',
    video: 'off',
    screenshot: 'only-on-failure',
  },
  webServer: undefined,
};
