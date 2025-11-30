import { createSkyboltTests } from './shared/test-utils';

createSkyboltTests({
  name: 'PHP Laravel Example',
  baseUrl: 'http://localhost:8082',
  expectedAssets: [
    'resources/css/critical.css',
    'resources/css/app.css',
    'resources/js/app.js',
  ],
  expectedAssetCount: 4,
  expectedInlinedStyles: 2,
  expectedInlinedScripts: 2,
  cookieAssetPattern: 'resources%2Fcss%2Fcritical.css',
  cachePathPatterns: ['critical', 'app'],
});
