import 'server-only'
import { prisma } from '../prisma'
import { createPrismaRepository } from './repositories/prisma-repository'
import { createContentStore } from './store'

export type { ContentRepository, PageRecord } from './repositories/content-repository'
export type { NewPage, PageService } from './services/pages'
export type { PublishingService } from './services/publishing'
export { createContentStore, type ContentStore } from './store'

/**
 * The content store the rest of the project reads and writes through, bound to
 * Postgres. Tests build their own store on the in-memory repository instead.
 */
export const contentStore = createContentStore(createPrismaRepository(prisma))
