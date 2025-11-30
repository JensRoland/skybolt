import { createSkyboltTests } from './shared/test-utils';

createSkyboltTests({
  name: 'Python Django Example',
  baseUrl: 'http://localhost:8084',
  expectedAssets: [
    'static/css/critical.css',
    'static/css/app.css',
    'static/js/app.js',
  ],
  expectedAssetCount: 4,
  expectedInlinedStyles: 2,
  expectedInlinedScripts: 2,
  cachePathPatterns: ['critical', 'app'],
});
