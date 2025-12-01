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
  cachePathPatterns: ['critical', 'main'],
  errorFilter: (log) => !log.text().includes('jQuery'),
});
