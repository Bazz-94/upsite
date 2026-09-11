import { createMemoryRepository } from '@/server/content/repositories/memory-repository'
import { seedContent, seedPages } from '@/server/content/seed-data'
import { createContentStore, type ContentStore } from '@/server/content/store'
import { validatePage } from '@/shared/content'

describe('seed data', () => {
  let store: ContentStore

  beforeEach(() => {
    store = createContentStore(createMemoryRepository())
  })

  it('holds Home, Activities and About', () => {
    expect(seedPages.map((page) => page.slug)).toEqual(['home', 'activities', 'about'])
  })

  it('uses all three section types between them', () => {
    const types = seedPages.flatMap((page) => page.content.sections.map((section) => section.type))

    expect(new Set(types)).toEqual(new Set(['paragraph', 'image', 'list']))
  })

  it('passes the content rules', () => {
    for (const page of seedPages) {
      expect(() =>
        validatePage({ id: 'seed', kind: 'draft', navVisible: true, ...page })
      ).not.toThrow()
    }
  })

  it('creates every page, published, with the draft matching', async () => {
    expect(await seedContent(store)).toBe(true)

    for (const page of seedPages) {
      const published = await store.pages.getPublished(page.slug)
      const draft = await store.pages.getDraft(page.slug)

      expect(published?.published).toBe(true)
      expect(draft?.content).toEqual(published?.content)
      expect(await store.publishing.hasUnpublishedChanges(page.slug)).toBe(false)
    }
  })

  it('puts every page in the navigation, in order', async () => {
    await seedContent(store)

    expect(await store.pages.listNav()).toEqual([
      { slug: 'home', title: 'Home', navOrder: 0 },
      { slug: 'activities', title: 'Activities', navOrder: 1 },
      { slug: 'about', title: 'About', navOrder: 2 },
    ])
  })

  it('changes nothing when run a second time', async () => {
    await seedContent(store)
    await store.pages.saveDraft('home', {
      ...seedPages[0].content,
      title: 'Edited since seeding',
    })

    expect(await seedContent(store)).toBe(false)

    expect((await store.pages.getDraft('home'))?.content.title).toBe('Edited since seeding')
    expect(await store.pages.listNav()).toHaveLength(3)
  })

  it('does nothing when only some of the pages are there', async () => {
    await store.pages.create(seedPages[2])

    expect(await seedContent(store)).toBe(false)

    expect(await store.pages.getDraft('home')).toBeNull()
  })
})
