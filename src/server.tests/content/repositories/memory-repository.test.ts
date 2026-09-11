import type { ContentRepository } from '@/server/content/repositories/content-repository'
import { createMemoryRepository } from '@/server/content/repositories/memory-repository'
import type { ListSection, PageContent } from '@/shared/content'
import { imageSection, listSection, pageContent, pageRecord, paragraphSection } from '../fixtures'

/**
 * Reads a copy that is known to exist.
 * @param repository The repository to read from.
 * @param slug The page's slug.
 * @param kind Which copy to read.
 * @returns The content.
 */
async function read(
  repository: ContentRepository,
  slug: string,
  kind: 'draft' | 'published' = 'draft'
): Promise<PageContent> {
  const content = await repository.findContent(slug, kind)
  if (!content) {
    throw new Error(`Expected ${slug} to have ${kind} content`)
  }
  return content
}

describe('memory repository', () => {
  let repository: ContentRepository

  beforeEach(() => {
    repository = createMemoryRepository()
  })

  it('round-trips a page holding all three section types', async () => {
    const content = pageContent()

    await repository.createPage(pageRecord(), content)

    expect(await read(repository, 'activities')).toEqual(content)
    expect(await read(repository, 'activities', 'published')).toEqual(content)
  })

  it('hands back sections, fields and items in position order', async () => {
    const content = pageContent({
      sections: [listSection(), imageSection(), paragraphSection()],
    })

    await repository.createPage(pageRecord(), content)
    const stored = await read(repository, 'activities')

    expect(stored.sections.map((section) => section.id)).toEqual([
      'section-intro',
      'section-photo',
      'section-sessions',
    ])
    const list = stored.sections[2] as ListSection
    expect(list.fields.map((field) => field.id)).toEqual(['field-day', 'field-time'])
    expect(list.items.map((item) => item.id)).toEqual(['item-monday', 'item-thursday'])
  })

  it('drops a list value whose field the list does not define', async () => {
    const section = listSection({
      items: [
        {
          id: 'item-monday',
          position: 0,
          values: [
            { fieldId: 'field-gone', value: 'x' },
            { fieldId: 'field-day', value: 'Monday' },
          ],
        },
      ],
    })

    await repository.createPage(pageRecord(), pageContent({ sections: [section] }))
    const stored = (await read(repository, 'activities')).sections[0] as ListSection

    expect(stored.items[0].values).toEqual([{ fieldId: 'field-day', value: 'Monday' }])
  })

  it('leaves the published copy alone when the draft changes', async () => {
    await repository.createPage(pageRecord(), pageContent())

    await repository.saveContent('activities', 'draft', pageContent({ title: 'New title' }))

    expect((await read(repository, 'activities')).title).toBe('New title')
    expect((await read(repository, 'activities', 'published')).title).toBe('Activities')
  })

  it('leaves the draft alone when the published copy changes', async () => {
    await repository.createPage(pageRecord(), pageContent())

    await repository.saveContent('activities', 'published', pageContent({ title: 'New title' }))

    expect((await read(repository, 'activities', 'published')).title).toBe('New title')
    expect((await read(repository, 'activities')).title).toBe('Activities')
  })

  it('stores a copy, so changing the caller’s content changes nothing', async () => {
    const content = pageContent()
    await repository.createPage(pageRecord(), content)

    content.title = 'Changed after saving'
    content.sections.pop()

    expect((await read(repository, 'activities')).title).toBe('Activities')
    expect((await read(repository, 'activities')).sections).toHaveLength(3)
  })

  it('hands back a copy, so changing what was read changes nothing', async () => {
    await repository.createPage(pageRecord(), pageContent())

    const first = await read(repository, 'activities')
    first.sections.length = 0

    expect((await read(repository, 'activities')).sections).toHaveLength(3)
  })

  it('removes a page and both copies of its content', async () => {
    await repository.createPage(pageRecord(), pageContent())

    expect(await repository.deletePage('activities')).toBe(true)

    expect(await repository.findPage('activities')).toBeNull()
    expect(await repository.findContent('activities', 'draft')).toBeNull()
    expect(await repository.findContent('activities', 'published')).toBeNull()
    expect(await repository.listPages()).toEqual([])
  })

  it('reports nothing removed for an unknown slug', async () => {
    expect(await repository.deletePage('nope')).toBe(false)
  })

  it('finds a page by slug and nothing for an unknown one', async () => {
    const record = pageRecord()
    await repository.createPage(record, pageContent())

    expect(await repository.findPage('activities')).toEqual(record)
    expect(await repository.findPage('nope')).toBeNull()
  })

  it('lists pages in nav order', async () => {
    await repository.createPage(pageRecord({ id: 'p-about', slug: 'about', navOrder: 2 }), pageContent())
    await repository.createPage(pageRecord({ id: 'p-home', slug: 'home', navOrder: 0 }), pageContent())

    expect((await repository.listPages()).map((page) => page.slug)).toEqual(['home', 'about'])
  })

  it('replaces a page’s settings, its slug included, keeping both copies', async () => {
    await repository.createPage(pageRecord(), pageContent())

    await repository.savePage(pageRecord({ slug: 'what-we-do', navVisible: false, published: false }))

    expect(await repository.findPage('activities')).toBeNull()
    expect(await repository.findPage('what-we-do')).toEqual(
      pageRecord({ slug: 'what-we-do', navVisible: false, published: false })
    )
    expect((await read(repository, 'what-we-do')).sections).toHaveLength(3)
  })

  it('refuses a slug another page already uses', async () => {
    await repository.createPage(pageRecord(), pageContent())
    await repository.createPage(pageRecord({ id: 'p-home', slug: 'home', navOrder: 0 }), pageContent())

    await expect(repository.createPage(pageRecord({ id: 'p-other' }), pageContent())).rejects.toThrow(
      'The slug "activities" is already taken'
    )
    await expect(repository.savePage(pageRecord({ id: 'p-home', slug: 'activities' }))).rejects.toThrow(
      'The slug "activities" is already taken'
    )
  })

  it('refuses to write to a page that does not exist', async () => {
    await expect(repository.savePage(pageRecord())).rejects.toThrow(
      'There is no page with the id "page-activities"'
    )
    await expect(repository.saveContent('nope', 'draft', pageContent())).rejects.toThrow(
      'There is no page with the slug "nope"'
    )
  })
})
