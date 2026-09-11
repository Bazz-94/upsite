import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Prisma reads this instead of a `prisma` key in package.json.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // --conditions=react-server lets `server-only` modules load outside Next.
    seed: 'tsx --conditions=react-server prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
})
