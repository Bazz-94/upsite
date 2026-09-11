import 'server-only'
import type { PageContent, PageVersionKind } from '@/shared/content'

/** A page's settings — everything that does not differ between its two copies. */
export interface PageRecord {
  /** Stable id. */
  id: string
  /** URL path segment, unique across pages. */
  slug: string
  /** Place in the site navigation. */
  navOrder: number
  /** Whether the page appears in the navigation. */
  navVisible: boolean
  /** Whether the page is visible to the public. */
  published: boolean
}

/**
 * Storage for pages and their content. The seam that lets the database change
 * without touching the rest of the project: it moves whole copies of content in
 * and out and holds no rules of its own.
 */
export interface ContentRepository {
  /**
   * Finds a page's settings.
   * @param slug The page's slug.
   * @returns The settings, or null if there is no such page.
   */
  findPage(slug: string): Promise<PageRecord | null>

  /**
   * Lists every page's settings, in nav order.
   * @returns The settings of every page.
   */
  listPages(): Promise<PageRecord[]>

  /**
   * Reads one copy of a page's content.
   * @param slug The page's slug.
   * @param kind Which copy to read.
   * @returns The content, or null if there is no such page.
   */
  findContent(slug: string, kind: PageVersionKind): Promise<PageContent | null>

  /**
   * Adds a page, with the same content in both copies.
   * @param page The page's settings.
   * @param content The content both copies start with.
   */
  createPage(page: PageRecord, content: PageContent): Promise<void>

  /**
   * Replaces a page's settings, keeping both copies of its content. The page is found
   * by its `id`, so the slug can be changed.
   * @param page The settings to store.
   */
  savePage(page: PageRecord): Promise<void>

  /**
   * Replaces one copy of a page's content.
   * @param slug The page's slug.
   * @param kind Which copy to replace.
   * @param content The content to store.
   */
  saveContent(slug: string, kind: PageVersionKind, content: PageContent): Promise<void>

  /**
   * Removes a page and everything under it.
   * @param slug The page's slug.
   * @returns Whether a page was removed.
   */
  deletePage(slug: string): Promise<boolean>
}
