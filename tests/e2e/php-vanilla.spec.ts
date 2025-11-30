import { createSkyboltTests } from './shared/test-utils';

createSkyboltTests({
  name: 'PHP Vanilla Example',
  baseUrl: 'http://localhost:8080',
  expectedAssets: [
    'src/css/critical.css',
    'src/css/main.css',
    'src/js/app.js',
  ],
  expectedAssetCount: 4,
  expectedInlinedStyles: 2,
  expectedInlinedScripts: 2,
  cookieAssetPattern: 'src%2Fcss%2Fcritical.css',
  cachePathPatterns: ['critical', 'app'],
});
