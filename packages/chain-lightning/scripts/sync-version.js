#!/usr/bin/env node
/**
 * Syncs the version from package.json to all other files that contain version strings.
 *
 * This script is run automatically by `npm version` via the "version" script in package.json.
 * It runs AFTER package.json is updated but BEFORE the commit and tag are created.
 *
 * Files updated:
 * - client.js (@version JSDoc tag)
 * - client.min.js (Regenerated minified file)
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageDir = resolve(__dirname, '..')
const srcDir = resolve(__dirname, '../src')

// Read version from package.json
const packageJson = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf-8'))
const version = packageJson.version

console.log(`[sync-version] Syncing version ${version} to all files...`)

// Update client.js
const clientPath = resolve(srcDir, 'client.js')
let clientContent = readFileSync(clientPath, 'utf-8')
clientContent = clientContent.replace(
  /@version \S+/,
  `@version ${version}`
)
writeFileSync(clientPath, clientContent)
console.log(`[sync-version] Updated client.js`)

// Regenerate minified files
console.log(`[sync-version] Regenerating minified files...`)
execSync('pnpm run minify', { cwd: packageDir, stdio: 'inherit' })

console.log(`[sync-version] Done! All files updated to version ${version}`)
