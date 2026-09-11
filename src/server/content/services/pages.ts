import 'server-only'
import {
  ContentValidationError,
  validatePage,
  validatePageContent,
  type NavEntry,
  type Page,
  type PageContent,
  type PageVersionKind,
} from '@/shared/content'
import type { ContentRepository, PageRecord } from '../repositories/content-repository'

/** What a new page needs. Both copies of its content start out the same. */
export interface NewPage {
  /** URL path segment, unique across pages. */
  slug: string
  /** Place in the site navigation. */
  navOrder: number
  /** Whether the page appears in the navigation. Defaults to true. */
  navVisible?: boolean
  /** Whether the page is visible to the public. Defaults to false. */
  published?: boolean
  /** The content both copies start with. */
  content: PageContent
}

/** Reading and writing pages. Every caller in the project goes through this. */
export interface PageService {
  /**
   * Reads the copy of a page the public sees.
   * @param slug The page's slug.
   * @returns The page, or null if there is no such page or it is not published.
   */
  getPublished(slug: string): Promise<Page | null>

  /**
   * Reads the copy the admin edits.
   * @param slug The page's slug.
   * @returns The page, or null if there is no such page.
   */
  getDraft(slug: string): Promise<Page | null>

  /**
   * Lists the navigation: published, nav-visible pages, in nav order.
   * @returns One entry per page in the navigation.
   */
  listNav(): Promise<NavEntry[]>

  /**
   * Adds a page.
   * @param page The page to add.
   * @returns The draft copy of the page that was added.
   * @throws ContentValidationError When the page does not fit the rules, the slug of
   * another page included.
   */
  create(page: NewPage): Promise<Page>

  /**
   * Removes a page and everything under it.
   * @param slug The page's slug.
   * @returns Whether a page was removed.
   */
  delete(slug: string): Promise<boolean>

  /**
   * Replaces a page's draft content. The only way content is written, so the rules
   * are checked in one place.
   * @param slug The page's slug.
   * @param content The content to store.
   * @returns The draft copy as it now stands, or null if there is no such page.
   * @throws ContentValidationError When the content does not fit the rules.
   */
  saveDraft(slug: string, content: PageContent): Promise<Page | null>
}

/**
 * Builds the page service on a repository.
 * @param repository Where pages are stored.
 * @returns The service.
 */
export function createPageService(repository: ContentRepository): PageService {
  return {
    async getPublished(slug) {
      const record = await repository.findPage(slug)
      return record?.published ? readCopy(repository, record, 'published') : null
    },

    async getDraft(slug) {
      const record = await repository.findPage(slug)
      return record ? readCopy(repository, record, 'draft') : null
    },

    async listNav() {
      const records = (await repository.listPages()).filter((page) => page.published && page.navVisible)
      const entries = await Promise.all(records.map((record) => toNavEntry(repository, record)))
      return entries.filter((entry): entry is NavEntry => entry !== null)
    },

    async create(page) {
      const record: PageRecord = {
        id: crypto.randomUUID(),
        slug: page.slug,
        navOrder: page.navOrder,
        navVisible: page.navVisible ?? true,
        published: page.published ?? false,
      }
      const checked = validatePage({ ...record, kind: 'draft', content: page.content })
      if (await repository.findPage(page.slug)) {
        throw new ContentValidationError([
          { path: 'slug', message: `The slug "${page.slug}" is already taken` },
        ])
      }
      await repository.createPage(record, checked.content)
      const created = await readCopy(repository, record, 'draft')
      if (!created) {
        throw new Error(`The page "${page.slug}" was not stored`)
      }
      return created
    },

    async delete(slug) {
      return repository.deletePage(slug)
    },

    async saveDraft(slug, content) {
      const record = await repository.findPage(slug)
      if (!record) {
        return null
      }
      await repository.saveContent(slug, 'draft', validatePageContent(content))
      return readCopy(repository, record, 'draft')
    },
  }
}

/**
 * Reads one copy of a page and puts the settings and the content back together.
 * @param repository Where pages are stored.
 * @param record The page's settings.
 * @param kind Which copy to read.
 * @returns The page, or null if the copy has gone.
 */
async function readCopy(
  repository: ContentRepository,
  record: PageRecord,
  kind: PageVersionKind
): Promise<Page | null> {
  const content = await repository.findContent(record.slug, kind)
  return content ? { ...record, kind, content } : null
}

/**
 * Builds one navigation entry, taking the title from the published copy.
 * @param repository Where pages are stored.
 * @param record The page's settings.
 * @returns The entry, or null if the published copy has gone.
 */
async function toNavEntry(repository: ContentRepository, record: PageRecord): Promise<NavEntry | null> {
  const content = await repository.findContent(record.slug, 'published')
  return content ? { slug: record.slug, title: content.title, navOrder: record.navOrder } : null
}
