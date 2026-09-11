import 'dotenv/config'
import { contentStore } from '../src/server/content'
import { seedContent, seedPages } from '../src/server/content/seed-data'

/**
 * Loads the starting pages into the database. Run by `npm run db:seed`.
 * @returns Nothing.
 */
async function main(): Promise<void> {
  const seeded = await seedContent(contentStore)
  console.log(seeded ? `Seeded ${seedPages.length} pages.` : 'Pages already exist — nothing to do.')
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
