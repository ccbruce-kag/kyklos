#!/usr/bin/env node
import { rmSync } from 'node:fs'
import { resolve } from 'node:path'

const cachePaths = [
  'node_modules/.tmp',
  'node_modules/.vite',
  '.vite',
  '.cache',
  '.eslintcache',
]

for (const cachePath of cachePaths) {
  rmSync(resolve(process.cwd(), cachePath), { force: true, recursive: true })
}

console.log('Frontend build cache cleaned.')
