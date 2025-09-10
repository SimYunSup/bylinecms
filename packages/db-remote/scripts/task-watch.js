/**
 * Byline CMS
 *
 * Copyright © 2025 Anthony Bouch and contributors.
 *
 * This file is part of Byline CMS.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import chokidar from 'chokidar'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define source and output paths
const srcDir = path.join(__dirname, '..', 'src')
const outputDir = path.join(__dirname, '..', 'dist')

const runTypeScriptCompilation = () => {
  return new Promise((resolve, reject) => {
    console.log('🔧 Running TypeScript compilation...')
    const tsc = spawn('tsc', ['-p', 'tsconfig.json'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    })

    tsc.on('close', (code) => {
      if (code === 0) {
        console.log('✅ TypeScript compilation complete')
        resolve()
      } else {
        console.error(`❌ TypeScript compilation failed with code ${code}`)
        reject(new Error(`TypeScript compilation failed with code ${code}`))
      }
    })
  })
}

const run = async () => {
  try {
    console.log('🚀 Building new Byline db-remote configuration...')

    // Ensure output directory exists
    fs.mkdirSync(outputDir, { recursive: true })

    await runTypeScriptCompilation()

    console.log('✅ Byline db-remote building complete...')
  } catch (error) {
    console.error('Error during Byline db-remote build:', error)
  }
}

// Watch for changes in the src/styles directory
const watcher = chokidar.watch(srcDir, {
  persistent: true,
  ignoreInitial: true, // Don't run initially - we're taking care of that below.
})

watcher
  .on('add', (path) => {
    console.log(`📂 File ${path} has been added`)
    run()
  })
  .on('change', (path) => {
    console.log(`📂 File ${path} has been changed`)
    run()
  })
  .on('unlink', (path) => {
    console.log(`📂 File ${path} has been removed`)
    run()
  })

// Initial run to bundle existing files
run()

console.log(`👁️ Watching for Byline db-remote changes in ${srcDir}...`)
