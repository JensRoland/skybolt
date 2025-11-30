import { createSkyboltTests } from './shared/test-utils';

createSkyboltTests({
  name: 'Go Gin Example',
  baseUrl: 'http://localhost:8083',
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
