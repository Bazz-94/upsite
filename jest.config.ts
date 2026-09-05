import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Loads next.config.ts and .env files into the test environment.
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  // Backend code only — no DOM.
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/app.tests/**/*.test.ts'],
  // Backend code: server-only modules plus the isomorphic helpers they share.
  collectCoverageFrom: ['src/server/**/*.ts', 'src/shared/**/*.ts', '!src/**/*.d.ts'],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  // Remove once the first tests land.
  passWithNoTests: true,
}

// Exported this way so next/jest can load the async Next.js config.
export default createJestConfig(config)
