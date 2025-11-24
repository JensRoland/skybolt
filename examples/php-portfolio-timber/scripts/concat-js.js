/**
 * Concatenate JavaScript files
 *
 * This script concatenates all legacy jQuery scripts into a single bundle
 * maintaining the correct execution order, then updates the Skybolt render-map.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public/js');
const distDir = join(__dirname, '../dist/assets');

// Scripts in exact order
const scripts = [
  'jquery-1.8.3.min.js',
  'jquery.mobile.customized.min.js',
  'jquery.easing.1.3.js',
  'blazy.js',
  'jquery.easypiechart.min.js',
  'jquery.isotope.1.5.25.js',
  'sorting.js',
  'jquery.prettyPhoto.js',
  'jquery.slicknav.js',
  'responsiveslides.min.js',
  'inline-scripts.js'
];

console.log('Concatenating JavaScript files...');

// Read and concatenate all scripts
let bundle = '/*! Timber v3 - Concatenated Scripts */\n\n';

for (const script of scripts) {
  const filePath = join(publicDir, script);
  console.log(`  Adding: ${script}`);

  try {
    const content = readFileSync(filePath, 'utf8');
    bundle += `/* ${script} */\n`;
    bundle += content;
    bundle += '\n\n';
  } catch (err) {
    console.error(`  Error reading ${script}:`, err.message);
    process.exit(1);
  }
}

// Create dist/assets directory if it doesn't exist
try {
  mkdirSync(distDir, { recursive: true });
} catch (err) {
  // Directory might already exist
}

// Generate content hash (8 chars like Vite)
const hash = createHash('sha256').update(bundle).digest('hex').substring(0, 8);
const filename = `scripts-${hash}.js`;

// Write the bundle
const outputPath = join(distDir, filename);
writeFileSync(outputPath, bundle);

// Update Skybolt render-map.json to include the scripts bundle
const renderMapPath = join(__dirname, '../dist/.skybolt/render-map.json');
try {
  const renderMapContent = readFileSync(renderMapPath, 'utf8');
  const renderMap = JSON.parse(renderMapContent);

  // Add scripts entry to assets
  renderMap.assets['src/js/scripts.js'] = {
    url: `/assets/${filename}`,
    hash: hash,
    content: bundle
  };

  writeFileSync(renderMapPath, JSON.stringify(renderMap, null, 2));
  console.log(`\n✓ Updated render-map.json with scripts entry`);
} catch (err) {
  console.warn(`  Warning: Could not update render-map:`, err.message);
}

console.log(`\n✓ Bundle created: ${outputPath}`);
console.log(`  Size: ${(bundle.length / 1024).toFixed(2)} KB`);
console.log(`  Hash: ${hash}`);
