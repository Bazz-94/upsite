import { createMemoryRepository } from '@/server/content/repositories/memory-repository'
import { createContentStore, type ContentStore } from '@/server/content/store'
import { pageContent } from './fixtures'

describe('publishing service', () => {
  let store: ContentStore

  beforeEach(() => {
    store = createContentStore(createMemoryRepository())
  })

  /**
   * Adds a page that is not yet visible to the public.
   * @param slug The page's slug.
   * @returns Nothing.
   */
  async function add(slug = 'home'): Promise<void> {
    await store.pages.create({ slug, navOrder: 0, content: pageContent({ title: 'First' }) })
  }

  describe('publish', () => {
    it('makes the draft the copy the public sees', async () => {
      await add()
      await store.pages.saveDraft('home', pageContent({ title: 'Second' }))

      expect(await store.publishing.publish('home')).toBe(true)

      const published = await store.pages.getPublished('home')
      expect(published?.content.title).toBe('Second')
      expect(published?.published).toBe(true)
      expect(await store.pages.listNav()).toEqual([{ slug: 'home', title: 'Second', navOrder: 0 }])
    })

    it('reports nothing published for an unknown slug', async () => {
      expect(await store.publishing.publish('nope')).toBe(false)
    })
  })

  describe('discard', () => {
    it('puts the published copy back in the draft', async () => {
      await add()
      await store.publishing.publish('home')
      await store.pages.saveDraft('home', pageContent({ title: 'Second' }))

      expect(await store.publishing.discard('home')).toBe(true)

      expect((await store.pages.getDraft('home'))?.content.title).toBe('First')
    })

    it('reports nothing discarded for an unknown slug', async () => {
      expect(await store.publishing.discard('nope')).toBe(false)
    })
  })

  describe('unpublish', () => {
    it('hides the page without deleting it', async () => {
      await add()
      await store.publishing.publish('home')

      expect(await store.publishing.unpublish('home')).toBe(true)

      expect(await store.pages.getPublished('home')).toBeNull()
      expect(await store.pages.listNav()).toEqual([])
      expect((await store.pages.getDraft('home'))?.content.title).toBe('First')
    })

    it('reports nothing hidden for an unknown slug', async () => {
      expect(await store.publishing.unpublish('nope')).toBe(false)
    })
  })

  describe('hasUnpublishedChanges', () => {
    it('is false straight after publishing', async () => {
      await add()
      await store.pages.saveDraft('home', pageContent({ title: 'Second' }))
      await store.publishing.publish('home')

      expect(await store.publishing.hasUnpublishedChanges('home')).toBe(false)
    })

    it('is true after any draft edit', async () => {
      await add()
      await store.publishing.publish('home')

      await store.pages.saveDraft('home', pageContent({ title: 'Second' }))

      expect(await store.publishing.hasUnpublishedChanges('home')).toBe(true)
    })

    it('is false again once the draft is discarded', async () => {
      await add()
      await store.publishing.publish('home')
      await store.pages.saveDraft('home', pageContent({ title: 'Second' }))

      await store.publishing.discard('home')

      expect(await store.publishing.hasUnpublishedChanges('home')).toBe(false)
    })

    it('ignores the order the content was written in', async () => {
      await add()
      await store.publishing.publish('home')
      const reordered = pageContent({ title: 'First' })

      await store.pages.saveDraft('home', {
        sections: reordered.sections,
        heroImageName: reordered.heroImageName,
        title: reordered.title,
      })

      expect(await store.publishing.hasUnpublishedChanges('home')).toBe(false)
    })

    it('is false for an unknown slug', async () => {
      expect(await store.publishing.hasUnpublishedChanges('nope')).toBe(false)
    })
  })
})
