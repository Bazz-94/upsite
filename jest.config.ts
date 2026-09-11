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
  testMatch: ['<rootDir>/src/server.tests/**/*.test.ts', '<rootDir>/src/shared.tests/**/*.test.ts'],
  // Backend code: server-only modules plus the isomorphic helpers they share.
  collectCoverageFrom: [
    'src/server/**/*.ts',
    'src/shared/**/*.ts',
    '!src/**/*.d.ts',
    // Covered by an integration test that needs a database, not by the unit suite.
    '!src/server/content/repositories/prisma-repository.ts',
    // Types only, and the wiring that opens a database instead of running logic.
    '!src/server/content/repositories/content-repository.ts',
    '!src/server/prisma.ts',
    '!src/server/content/index.ts',
  ],
  // Prisma's query compiler ships as ESM, which jest cannot require. Each of those files
  // has a CommonJS twin beside it with the same exports; the integration test uses those.
  moduleNameMapper: {
    '^(@prisma/client/runtime/query_compiler_.*)\\.mjs$': '$1.js',
  },
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
}

// Exported this way so next/jest can load the async Next.js config.
export default createJestConfig(config)
