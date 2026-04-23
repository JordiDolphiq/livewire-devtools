#!/usr/bin/env node
// Zips the dist/ folder into release/livewire-devtools-<version>-chrome.zip.
// Runs after `npm run build`.

import { execFileSync } from 'node:child_process'
import { mkdirSync, existsSync, rmSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
const distDir = resolve(root, 'dist')
const releaseDir = resolve(root, 'release')
const outFile = resolve(releaseDir, `livewire-devtools-${pkg.version}-chrome.zip`)

if (!existsSync(distDir)) {
  console.error('✗ dist/ not found — run `npm run build` first')
  process.exit(1)
}

mkdirSync(releaseDir, { recursive: true })

if (existsSync(outFile)) rmSync(outFile)

execFileSync('zip', ['-r', '-FS', outFile, '.'], {
  cwd: distDir,
  stdio: 'inherit'
})

console.log(`\n✓ ${outFile}`)
