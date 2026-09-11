import { createMemoryRepository } from '@/server/content/repositories/memory-repository'
import { createContentStore, type ContentStore } from '@/server/content/store'
import { ContentValidationError } from '@/shared/content'
import { pageContent, paragraphSection } from './fixtures'

describe('page service', () => {
  let store: ContentStore

  beforeEach(() => {
    store = createContentStore(createMemoryRepository())
  })

  /**
   * Adds a page through the store.
   * @param slug The page's slug.
   * @param published Whether it is visible to the public.
   * @param navOrder Its place in the navigation.
   * @returns Nothing.
   */
  async function add(slug: string, published = true, navOrder = 0): Promise<void> {
    await store.pages.create({
      slug,
      navOrder,
      published,
      content: pageContent({ title: slug }),
    })
  }

  describe('create', () => {
    it('adds a page with both copies holding the same content', async () => {
      const page = await store.pages.create({ slug: 'about', navOrder: 3, content: pageContent() })

      expect(page.kind).toBe('draft')
      expect(page.id).toHaveLength(36)
      expect(page.navVisible).toBe(true)
      expect(page.published).toBe(false)
      expect((await store.pages.getDraft('about'))?.content).toEqual(page.content)
    })

    it('rejects a page whose slug or content breaks the rules', async () => {
      await expect(
        store.pages.create({ slug: 'not a slug', navOrder: 0, content: pageContent() })
      ).rejects.toThrow(ContentValidationError)
      await expect(
        store.pages.create({ slug: 'about', navOrder: 0, content: pageContent({ title: '' }) })
      ).rejects.toThrow(ContentValidationError)

      expect(await store.pages.getDraft('about')).toBeNull()
    })

    it('rejects a slug another page already uses, naming the field', async () => {
      await add('about')

      await expect(
        store.pages.create({ slug: 'about', navOrder: 9, content: pageContent() })
      ).rejects.toThrow(ContentValidationError)
      await expect(
        store.pages.create({ slug: 'about', navOrder: 9, content: pageContent() })
      ).rejects.toThrow('slug: The slug "about" is already taken')
    })
  })

  describe('getPublished', () => {
    it('reads the published copy', async () => {
      await add('home')

      expect((await store.pages.getPublished('home'))?.kind).toBe('published')
    })

    it('returns null for an unknown slug', async () => {
      expect(await store.pages.getPublished('nope')).toBeNull()
    })

    it('returns null for a page that is not published', async () => {
      await add('home', false)

      expect(await store.pages.getPublished('home')).toBeNull()
      expect(await store.pages.getDraft('home')).not.toBeNull()
    })
  })

  describe('getDraft', () => {
    it('returns null for an unknown slug', async () => {
      expect(await store.pages.getDraft('nope')).toBeNull()
    })
  })

  describe('listNav', () => {
    it('lists published, nav-visible pages in nav order', async () => {
      await add('about', true, 2)
      await add('home', true, 0)
      await add('hidden', false, 1)
      await store.pages.create({
        slug: 'secret',
        navOrder: 3,
        published: true,
        navVisible: false,
        content: pageContent(),
      })

      expect(await store.pages.listNav()).toEqual([
        { slug: 'home', title: 'home', navOrder: 0 },
        { slug: 'about', title: 'about', navOrder: 2 },
      ])
    })

    it('takes each title from the published copy, not the draft', async () => {
      await add('home')
      await store.pages.saveDraft('home', pageContent({ title: 'Draft title' }))

      expect(await store.pages.listNav()).toEqual([{ slug: 'home', title: 'home', navOrder: 0 }])
    })

    it('is empty when nothing is published', async () => {
      expect(await store.pages.listNav()).toEqual([])
    })
  })

  describe('saveDraft', () => {
    it('replaces the draft and leaves the published copy alone', async () => {
      await add('home')

      const saved = await store.pages.saveDraft('home', pageContent({ title: 'Draft title' }))

      expect(saved?.content.title).toBe('Draft title')
      expect((await store.pages.getPublished('home'))?.content.title).toBe('home')
    })

    it('returns null for an unknown slug', async () => {
      expect(await store.pages.saveDraft('nope', pageContent())).toBeNull()
    })

    it('rejects invalid content and leaves the stored draft unchanged', async () => {
      await add('home')
      const broken = pageContent({
        sections: [paragraphSection({ body: '' })],
      })

      await expect(store.pages.saveDraft('home', broken)).rejects.toThrow(ContentValidationError)

      expect((await store.pages.getDraft('home'))?.content).toEqual(pageContent({ title: 'home' }))
    })

    it('names the field and the reason when it rejects content', async () => {
      await add('home')
      const broken = pageContent({ sections: [paragraphSection({ body: '' })] })

      await expect(store.pages.saveDraft('home', broken)).rejects.toThrow(
        'sections.0.body: Body is required'
      )
    })
  })

  describe('delete', () => {
    it('removes the page', async () => {
      await add('home')

      expect(await store.pages.delete('home')).toBe(true)

      expect(await store.pages.getDraft('home')).toBeNull()
      expect(await store.pages.listNav()).toEqual([])
    })

    it('reports nothing removed for an unknown slug', async () => {
      expect(await store.pages.delete('nope')).toBe(false)
    })
  })
})
