#!/usr/bin/env node
/**
 * Syncs the version from package.json to all other files that contain version strings.
 *
 * This script is run automatically by `npm version` via the "version" script in package.json.
 * It runs AFTER package.json is updated but BEFORE the commit and tag are created.
 *
 * Files updated:
 * - index.js (SKYBOLT_VERSION constant)
 * - client.js (@version JSDoc tag)
 * - sw.js (@version JSDoc tag)
 * - ../../README.md (Version badge in header)
 * - client.min.js (regenerated)
 * - sw.min.js (regenerated)
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageDir = resolve(__dirname, '..')
const rootDir = resolve(packageDir, '../..')

// Read version from package.json
const packageJson = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf-8'))
const version = packageJson.version

console.log(`[sync-version] Syncing version ${version} to all files...`)

// Update index.js
const indexPath = resolve(packageDir, 'index.js')
let indexContent = readFileSync(indexPath, 'utf-8')
indexContent = indexContent.replace(
  /const SKYBOLT_VERSION = '[^']+'/,
  `const SKYBOLT_VERSION = '${version}'`
)
writeFileSync(indexPath, indexContent)
console.log(`[sync-version] Updated index.js`)

// Update client.js
const clientPath = resolve(packageDir, 'client.js')
let clientContent = readFileSync(clientPath, 'utf-8')
clientContent = clientContent.replace(
  /@version \S+/,
  `@version ${version}`
)
writeFileSync(clientPath, clientContent)
console.log(`[sync-version] Updated client.js`)

// Update sw.js
const swPath = resolve(packageDir, 'sw.js')
let swContent = readFileSync(swPath, 'utf-8')
swContent = swContent.replace(
  /@version \S+/,
  `@version ${version}`
)
writeFileSync(swPath, swContent)
console.log(`[sync-version] Updated sw.js`)

// Update root README.md
const readmePath = resolve(rootDir, 'README.md')
let readmeContent = readFileSync(readmePath, 'utf-8')
readmeContent = readmeContent.replace(
  /\*\*Version:\*\* \S+/,
  `**Version:** ${version}`
)
writeFileSync(readmePath, readmeContent)
console.log(`[sync-version] Updated README.md`)

// Regenerate minified files
console.log(`[sync-version] Regenerating minified files...`)
execSync('pnpm run minify', { cwd: packageDir, stdio: 'inherit' })

console.log(`[sync-version] Done! All files updated to version ${version}`)
