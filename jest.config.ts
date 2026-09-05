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
  testMatch: ['<rootDir>/lib/**/*.test.ts', '<rootDir>/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['lib/**/*.ts', '!lib/**/*.test.ts', '!lib/**/*.d.ts'],
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
