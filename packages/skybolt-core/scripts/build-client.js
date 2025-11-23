#!/usr/bin/env node
/**
 * Build script for Skybolt client-side JavaScript
 *
 * This script minifies skybolt-client.js while preserving the header comment
 * that contains version information injected by the PHP renderer.
 */

import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const assetsDir = join(__dirname, '../assets');
const inputFile = join(assetsDir, 'skybolt-client.js');
const outputFile = join(assetsDir, 'skybolt-client.min.js');

console.log('Building Skybolt client script...');

try {
  // Read the source file to extract the header comment
  const sourceContent = readFileSync(inputFile, 'utf8');

  // Extract the header comment (lines 1-6)
  const headerMatch = sourceContent.match(/^\/\*\*[\s\S]*?\*\//);
  const headerComment = headerMatch ? headerMatch[0] : '';

  if (!headerComment) {
    console.warn('Warning: Could not find header comment in source file');
  }

  // Build with esbuild
  const result = await esbuild.build({
    entryPoints: [inputFile],
    bundle: false,
    minify: true,
    format: 'esm',
    target: 'es2020',
    write: false,
    legalComments: 'none', // We'll add our own header
  });

  // Get minified output
  let minifiedCode = result.outputFiles[0].text;

  // Prepend the header comment
  const finalOutput = headerComment + '\n' + minifiedCode;

  // Write to output file
  writeFileSync(outputFile, finalOutput, 'utf8');

  console.log(`✓ Built successfully: ${outputFile}`);
  console.log(`  Original size: ${sourceContent.length} bytes`);
  console.log(`  Minified size: ${finalOutput.length} bytes`);
  console.log(`  Reduction: ${Math.round((1 - finalOutput.length / sourceContent.length) * 100)}%`);

} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
