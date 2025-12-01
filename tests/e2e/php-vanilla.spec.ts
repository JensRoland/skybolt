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
  cachePathPatterns: ['critical', 'app'],
});
