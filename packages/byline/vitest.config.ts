// NOTE: Important! Allows process.env.SOME_ENV_VAR to accessed in tests
// without using import { loadEnv } from 'vite't'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  // Fallback to vitest default suffix  '**/*.test.ts' for jsdom mode.
  const testFiles = '**/*.test.ts'

  return {
    plugins: [],
    test: {
      environment: 'node',
      include: [testFiles],
      reporter: 'verbose',
      globals: true,
    },
  }
})
