import 'server-only'
import type { ContentRepository } from './repositories/content-repository'
import { createPageService, type PageService } from './services/pages'
import { createPublishingService, type PublishingService } from './services/publishing'

/** The one interface the rest of the project reads and writes content through. */
export interface ContentStore {
  /** Reading and writing pages. */
  pages: PageService
  /** Moving content between a page's draft and published copies. */
  publishing: PublishingService
}

/**
 * Builds a store on a repository. Swapping the repository swaps the storage without
 * anything else in the project noticing.
 * @param repository Where pages are stored.
 * @returns The store.
 */
export function createContentStore(repository: ContentRepository): ContentStore {
  return {
    pages: createPageService(repository),
    publishing: createPublishingService(repository),
  }
}
