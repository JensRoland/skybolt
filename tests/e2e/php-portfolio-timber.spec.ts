import { createSkyboltTests } from './shared/test-utils';

createSkyboltTests({
  name: 'PHP Portfolio Timber Example',
  baseUrl: 'http://localhost:8081',
  expectedAssets: [
    'src/css/critical.css',
    'src/css/main.css',
    'src/css/fonts-inline.css',
    'src/js/scripts.js',
  ],
  expectedAssetCount: 5,
  expectedInlinedStyles: 3,
  expectedInlinedScripts: 2,
  cookieAssetPattern: 'src%2Fcss%2Fcritical.css',
  cachePathPatterns: ['critical', 'main'],
  errorFilter: (log) => !log.text().includes('jQuery'),
});
