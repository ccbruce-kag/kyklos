#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const minimum = [20, 19, 0]
const candidates = [
  process.env.KYKLOS_NODE20,
  process.env.NODE20,
  '/home/kag/.npm/_npx/39826d059b592c66/node_modules/node/bin/node',
  '/usr/local/bin/node',
  process.execPath,
].filter(Boolean)

function parseVersion(raw) {
  const match = String(raw).trim().match(/^v?(\d+)\.(\d+)\.(\d+)/)
  if (!match) return null
  return match.slice(1).map((part) => Number(part))
}

function isSupported(version) {
  if (!version) return false
  for (let i = 0; i < minimum.length; i += 1) {
    if (version[i] > minimum[i]) return true
    if (version[i] < minimum[i]) return false
  }
  return true
}

function nodeVersion(path) {
  if (!existsSync(path)) return null
  const result = spawnSync(path, ['-v'], { encoding: 'utf8' })
  if (result.status !== 0) return null
  return parseVersion(result.stdout)
}

const node = candidates.find((path) => isSupported(nodeVersion(path)))
if (!node) {
  console.error('Kyklos frontend requires Node.js 20.19.0 or newer for Vite.')
  console.error('Set KYKLOS_NODE20=/path/to/node20, or install/activate Node 20 before running npm scripts.')
  process.exit(1)
}

const args = process.argv.slice(2)
if (!args.length) {
  console.error('Usage: node scripts/with-node20.mjs <script> [args...]')
  process.exit(1)
}

const result = spawnSync(node, args, { stdio: 'inherit', cwd: process.cwd(), env: process.env })
process.exit(result.status ?? 1)
