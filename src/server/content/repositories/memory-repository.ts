import 'server-only'
import type { ListSection, PageContent, PageVersionKind, Section } from '@/shared/content'
import type { ContentRepository, PageRecord } from './content-repository'

/** A page as the in-memory repository holds it: its settings plus both copies of its content. */
interface StoredPage {
  /** The page's settings. */
  record: PageRecord
  /** The draft and published copies. */
  copies: Record<PageVersionKind, PageContent>
}

/**
 * Builds a repository that keeps everything in memory. Used by the unit tests, so
 * they need no database. Behaves like the Postgres one: it hands back copies, orders
 * content by position, and refuses a slug that is already taken.
 * @returns A repository backed by a map.
 */
export function createMemoryRepository(): ContentRepository {
  const pages = new Map<string, StoredPage>()

  return {
    async findPage(slug) {
      const page = find(pages, slug)
      return page ? { ...page.record } : null
    },

    async listPages() {
      return [...pages.values()]
        .map((page) => ({ ...page.record }))
        .sort((left, right) => left.navOrder - right.navOrder)
    },

    async findContent(slug, kind) {
      const page = find(pages, slug)
      return page ? structuredClone(page.copies[kind]) : null
    },

    async createPage(record, content) {
      refuseTakenSlug(pages, record)
      pages.set(record.id, {
        record: { ...record },
        copies: { draft: order(content), published: order(content) },
      })
    },

    async savePage(record) {
      const page = pages.get(record.id)
      if (!page) {
        throw new Error(`There is no page with the id "${record.id}"`)
      }
      refuseTakenSlug(pages, record)
      page.record = { ...record }
    },

    async saveContent(slug, kind, content) {
      findOrThrow(pages, slug).copies[kind] = order(content)
    },

    async deletePage(slug) {
      const page = find(pages, slug)
      return page ? pages.delete(page.record.id) : false
    },
  }
}

/**
 * Finds a stored page by its slug.
 * @param pages Everything stored.
 * @param slug The page's slug.
 * @returns The stored page, or undefined if there is no such page.
 */
function find(pages: Map<string, StoredPage>, slug: string): StoredPage | undefined {
  return [...pages.values()].find((page) => page.record.slug === slug)
}

/**
 * Finds a stored page by its slug, or fails.
 * @param pages Everything stored.
 * @param slug The page's slug.
 * @returns The stored page.
 * @throws Error When there is no such page.
 */
function findOrThrow(pages: Map<string, StoredPage>, slug: string): StoredPage {
  const page = find(pages, slug)
  if (!page) {
    throw new Error(`There is no page with the slug "${slug}"`)
  }
  return page
}

/**
 * Refuses a slug another page already uses, the way the unique column in Postgres would.
 * @param pages Everything stored.
 * @param record The settings about to be stored.
 * @throws Error When another page holds that slug.
 */
function refuseTakenSlug(pages: Map<string, StoredPage>, record: PageRecord): void {
  const clash = find(pages, record.slug)
  if (clash && clash.record.id !== record.id) {
    throw new Error(`The slug "${record.slug}" is already taken`)
  }
}

/**
 * Copies content and puts its sections, fields and items in position order, the way
 * reading it back out of a database would.
 * @param content The content to copy.
 * @returns An ordered copy.
 */
function order(content: PageContent): PageContent {
  const copy = structuredClone(content)
  return {
    ...copy,
    sections: byPosition(copy.sections).map(orderSection),
  }
}

/**
 * Puts one section's own lists in position order.
 * @param section The section to order.
 * @returns The section, ordered.
 */
function orderSection(section: Section): Section {
  return section.type === 'list' ? orderList(section) : section
}

/**
 * Puts a list section's fields and items, and each item's values, in order. Values
 * follow the field order so two items always line up, and a value whose field the
 * list does not define is dropped — there is nothing for it to hang off, the same as
 * in Postgres. Validation rejects those before they reach here.
 * @param section The list section to order.
 * @returns The section, ordered.
 */
function orderList(section: ListSection): ListSection {
  const fields = byPosition(section.fields)
  const fieldOrder = new Map(fields.map((field, index) => [field.id, index]))
  return {
    ...section,
    fields,
    items: byPosition(section.items).map((item) => ({
      ...item,
      values: item.values
        .filter((value) => fieldOrder.has(value.fieldId))
        .sort((left, right) => fieldOrder.get(left.fieldId)! - fieldOrder.get(right.fieldId)!),
    })),
  }
}

/**
 * Sorts anything carrying a position, leaving the input untouched.
 * @param values The values to sort.
 * @returns A sorted copy.
 */
function byPosition<T extends { position: number }>(values: T[]): T[] {
  return [...values].sort((left, right) => left.position - right.position)
}
