import 'server-only'
import type { PageContent } from '@/shared/content'
import type { ContentRepository } from '../repositories/content-repository'

/** Moving content between a page's draft and published copies. */
export interface PublishingService {
  /**
   * Makes the draft the copy the public sees, and marks the page published.
   * @param slug The page's slug.
   * @returns Whether a page was published.
   */
  publish(slug: string): Promise<boolean>

  /**
   * Throws the draft away, putting the published copy back in its place.
   * @param slug The page's slug.
   * @returns Whether a draft was discarded.
   */
  discard(slug: string): Promise<boolean>

  /**
   * Hides the page from the public, keeping both copies of its content.
   * @param slug The page's slug.
   * @returns Whether a page was hidden.
   */
  unpublish(slug: string): Promise<boolean>

  /**
   * Says whether the draft differs from what the public sees.
   * @param slug The page's slug.
   * @returns True when the two copies differ. False for an unknown page.
   */
  hasUnpublishedChanges(slug: string): Promise<boolean>
}

/**
 * Builds the publishing service on a repository.
 * @param repository Where pages are stored.
 * @returns The service.
 */
export function createPublishingService(repository: ContentRepository): PublishingService {
  return {
    async publish(slug) {
      const record = await repository.findPage(slug)
      const draft = record && (await repository.findContent(slug, 'draft'))
      if (!record || !draft) {
        return false
      }
      await repository.saveContent(slug, 'published', draft)
      await repository.savePage({ ...record, published: true })
      return true
    },

    async discard(slug) {
      const published = await repository.findContent(slug, 'published')
      if (!published) {
        return false
      }
      await repository.saveContent(slug, 'draft', published)
      return true
    },

    async unpublish(slug) {
      const record = await repository.findPage(slug)
      if (!record) {
        return false
      }
      await repository.savePage({ ...record, published: false })
      return true
    },

    async hasUnpublishedChanges(slug) {
      const [draft, published] = await Promise.all([
        repository.findContent(slug, 'draft'),
        repository.findContent(slug, 'published'),
      ])
      if (!draft || !published) {
        return false
      }
      return canonical(draft) !== canonical(published)
    },
  }
}

/**
 * Writes content out with its object keys in a fixed order, so two copies holding
 * the same thing always come out the same text.
 * @param content The content to write out.
 * @returns The content as canonical JSON.
 */
function canonical(content: PageContent): string {
  return JSON.stringify(content, (_key, value) => (isPlainObject(value) ? sortKeys(value) : value))
}

/**
 * Says whether a value is a plain object rather than an array or a primitive.
 * @param value The value to check.
 * @returns True for a plain object.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Copies an object with its keys in alphabetical order.
 * @param value The object to copy.
 * @returns The same entries, sorted by key.
 */
function sortKeys(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)))
}
