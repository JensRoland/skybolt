import { createSkyboltTests } from './shared/test-utils';

createSkyboltTests({
  name: 'Ruby Rails Example',
  baseUrl: 'http://localhost:8085',
  expectedAssets: [
    'app/assets/stylesheets/critical.css',
    'app/assets/stylesheets/application.css',
    'app/assets/javascripts/application.js',
  ],
  expectedAssetCount: 4,
  expectedInlinedStyles: 2,
  expectedInlinedScripts: 2,
  cachePathPatterns: ['critical', 'application'],
});
