import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import type { ContentRepository } from '@/server/content/repositories/content-repository'
import { createPrismaRepository } from '@/server/content/repositories/prisma-repository'
import type { ListSection, PageContent } from '@/shared/content'
import { imageSection, listSection, pageContent, pageRecord, paragraphSection } from '../fixtures'

// Runs the same round-trip checks as the in-memory repository, against real Postgres.
// It empties the pages table between tests, so it runs against TEST_DATABASE_URL and
// never DATABASE_URL — pointing it at the database you develop against would wipe your
// content. Skipped when TEST_DATABASE_URL is unset, so `npm test` needs no database.
const connectionString = process.env.TEST_DATABASE_URL
const describeWithDatabase = connectionString ? describe : describe.skip

describeWithDatabase('prisma repository', () => {
  let client: PrismaClient
  let repository: ContentRepository

  /**
   * Reads a copy that is known to exist.
   * @param slug The page's slug.
   * @param kind Which copy to read.
   * @returns The content.
   */
  async function read(slug: string, kind: 'draft' | 'published' = 'draft'): Promise<PageContent> {
    const content = await repository.findContent(slug, kind)
    if (!content) {
      throw new Error(`Expected ${slug} to have ${kind} content`)
    }
    return content
  }

  beforeAll(() => {
    client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
    repository = createPrismaRepository(client)
  })

  afterAll(async () => {
    await client.$disconnect()
  })

  beforeEach(async () => {
    await client.page.deleteMany()
  })

  it('round-trips a page holding all three section types', async () => {
    const content = pageContent()

    await repository.createPage(pageRecord(), content)

    expect(await read('activities')).toEqual(content)
    expect(await read('activities', 'published')).toEqual(content)
  })

  it('hands back sections, fields and items in position order', async () => {
    const content = pageContent({ sections: [listSection(), imageSection(), paragraphSection()] })

    await repository.createPage(pageRecord(), content)
    const stored = await read('activities')

    expect(stored.sections.map((section) => section.id)).toEqual([
      'section-intro',
      'section-photo',
      'section-sessions',
    ])
    const list = stored.sections[2] as ListSection
    expect(list.fields.map((field) => field.id)).toEqual(['field-day', 'field-time'])
    expect(list.items.map((item) => item.id)).toEqual(['item-monday', 'item-thursday'])
    expect(list.items[0].values.map((value) => value.fieldId)).toEqual(['field-day', 'field-time'])
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
    const stored = (await read('activities')).sections[0] as ListSection

    expect(stored.items[0].values).toEqual([{ fieldId: 'field-day', value: 'Monday' }])
  })

  it('leaves the published copy alone when the draft changes, and the reverse', async () => {
    await repository.createPage(pageRecord(), pageContent())

    await repository.saveContent('activities', 'draft', pageContent({ title: 'New draft' }))

    expect((await read('activities')).title).toBe('New draft')
    expect((await read('activities', 'published')).title).toBe('Activities')

    await repository.saveContent('activities', 'published', pageContent({ title: 'New published' }))

    expect((await read('activities', 'published')).title).toBe('New published')
    expect((await read('activities')).title).toBe('New draft')
  })

  it('replaces the sections of a copy rather than adding to them', async () => {
    await repository.createPage(pageRecord(), pageContent())

    await repository.saveContent(
      'activities',
      'draft',
      pageContent({ sections: [paragraphSection({ body: 'Only one now.' })] })
    )

    expect((await read('activities')).sections).toHaveLength(1)
    expect((await read('activities', 'published')).sections).toHaveLength(3)
  })

  it('takes sections through a position swap', async () => {
    await repository.createPage(pageRecord(), pageContent())

    await repository.saveContent(
      'activities',
      'draft',
      pageContent({
        sections: [paragraphSection({ position: 1 }), imageSection({ position: 0 })],
      })
    )

    expect((await read('activities')).sections.map((section) => section.id)).toEqual([
      'section-photo',
      'section-intro',
    ])
  })

  it('removes a page, its sections, fields, items and values', async () => {
    await repository.createPage(pageRecord(), pageContent())

    expect(await repository.deletePage('activities')).toBe(true)

    expect(await repository.findPage('activities')).toBeNull()
    expect(await repository.findContent('activities', 'draft')).toBeNull()
    expect(await client.section.count()).toBe(0)
    expect(await client.listField.count()).toBe(0)
    expect(await client.listItem.count()).toBe(0)
    expect(await client.listValue.count()).toBe(0)
    expect(await client.pageVersion.count()).toBe(0)
  })

  it('reports nothing removed for an unknown slug', async () => {
    expect(await repository.deletePage('nope')).toBe(false)
  })

  it('finds pages and lists them in nav order', async () => {
    const record = pageRecord()
    await repository.createPage(record, pageContent())
    await repository.createPage(pageRecord({ id: 'p-home', slug: 'home', navOrder: 0 }), pageContent())

    expect(await repository.findPage('activities')).toEqual(record)
    expect(await repository.findPage('nope')).toBeNull()
    expect((await repository.listPages()).map((page) => page.slug)).toEqual(['home', 'activities'])
  })

  it('replaces a page’s settings, its slug included, keeping both copies', async () => {
    await repository.createPage(pageRecord(), pageContent())

    await repository.savePage(pageRecord({ slug: 'what-we-do', navVisible: false, published: false }))

    expect(await repository.findPage('activities')).toBeNull()
    expect((await read('what-we-do')).sections).toHaveLength(3)
  })

  it('refuses to write content for a page that does not exist', async () => {
    await expect(repository.saveContent('nope', 'draft', pageContent())).rejects.toThrow(
      'There is no page with the slug "nope"'
    )
  })
})
