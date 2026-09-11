import 'server-only'
import type { Prisma, PrismaClient } from '@/generated/prisma/client'
import type { ListSection, PageContent, PageVersionKind, Section } from '@/shared/content'
import type { ContentRepository } from './content-repository'

/** Everything hanging off a section, pulled in with it and already in order. */
const sectionInclude = {
  paragraph: true,
  image: true,
  list: {
    include: {
      fields: { orderBy: { position: 'asc' } },
      items: {
        orderBy: { position: 'asc' },
        include: { values: { orderBy: { field: { position: 'asc' } }, include: { field: true } } },
      },
    },
  },
} satisfies Prisma.SectionInclude

/** A section row with its children. */
type SectionRow = Prisma.SectionGetPayload<{ include: typeof sectionInclude }>

/** A list section row with its fields, items and values. */
type ListRow = NonNullable<SectionRow['list']>

/** The client inside a transaction. */
type Tx = Prisma.TransactionClient

/**
 * Builds a repository backed by Postgres. Maps the domain model to the tables and
 * back, and holds no rules of its own.
 * @param client The Prisma client to run against.
 * @returns A repository backed by the database.
 */
export function createPrismaRepository(client: PrismaClient): ContentRepository {
  return {
    async findPage(slug) {
      return client.page.findUnique({ where: { slug }, select: PAGE_FIELDS })
    },

    async listPages() {
      return client.page.findMany({ select: PAGE_FIELDS, orderBy: { navOrder: 'asc' } })
    },

    async findContent(slug, kind) {
      return readCopy(client, slug, kind)
    },

    async createPage(record, content) {
      await client.$transaction(async (tx) => {
        await tx.page.create({ data: { ...record } })
        await writeCopy(tx, record.id, 'draft', content)
        await writeCopy(tx, record.id, 'published', content)
      })
    },

    async savePage(record) {
      await client.page.update({
        where: { id: record.id },
        data: {
          slug: record.slug,
          navOrder: record.navOrder,
          navVisible: record.navVisible,
          published: record.published,
        },
      })
    },

    async saveContent(slug, kind, content) {
      await client.$transaction(async (tx) => {
        const page = await tx.page.findUnique({ where: { slug }, select: { id: true } })
        if (!page) {
          throw new Error(`There is no page with the slug "${slug}"`)
        }
        await writeCopy(tx, page.id, kind, content)
      })
    },

    async deletePage(slug) {
      const { count } = await client.page.deleteMany({ where: { slug } })
      return count > 0
    },
  }
}

/**
 * Reads one copy of a page's content, pulling the whole copy in one query.
 * @param client The Prisma client to run against.
 * @param slug The page's slug.
 * @param kind Which copy to read.
 * @returns The content, or null if there is no such page.
 */
async function readCopy(
  client: PrismaClient,
  slug: string,
  kind: PageVersionKind
): Promise<PageContent | null> {
  const page = await client.page.findUnique({
    where: { slug },
    include: {
      versions: { where: { kind } },
      sections: { where: { kind }, orderBy: { position: 'asc' }, include: sectionInclude },
    },
  })
  const version = page?.versions[0]
  if (!page || !version) {
    return null
  }
  return {
    title: version.title,
    heroImageName: version.heroImageName,
    sections: page.sections.map(toSection),
  }
}

/** The columns that make up a page's settings. */
const PAGE_FIELDS = {
  id: true,
  slug: true,
  navOrder: true,
  navVisible: true,
  published: true,
} satisfies Prisma.PageSelect

/**
 * Replaces one copy of a page's content. The sections are written fresh rather than
 * matched up row by row: their row ids are internal, so nothing outside notices, and
 * it keeps positions from clashing while they are being moved about.
 * @param tx The open transaction.
 * @param pageId The page's id.
 * @param kind Which copy to write.
 * @param content The content to store.
 */
async function writeCopy(
  tx: Tx,
  pageId: string,
  kind: PageVersionKind,
  content: PageContent
): Promise<void> {
  const version = { title: content.title, heroImageName: content.heroImageName }
  await tx.pageVersion.upsert({
    where: { pageId_kind: { pageId, kind } },
    create: { pageId, kind, ...version },
    update: version,
  })
  await tx.section.deleteMany({ where: { pageId, kind } })
  for (const section of content.sections) {
    await writeSection(tx, pageId, kind, section)
  }
}

/**
 * Writes one section and the child row its type needs.
 * @param tx The open transaction.
 * @param pageId The page's id.
 * @param kind Which copy the section belongs to.
 * @param section The section to write.
 */
async function writeSection(
  tx: Tx,
  pageId: string,
  kind: PageVersionKind,
  section: Section
): Promise<void> {
  const { rowId } = await tx.section.create({
    data: { sectionId: section.id, pageId, kind, position: section.position, type: section.type },
    select: { rowId: true },
  })
  if (section.type === 'paragraph') {
    await tx.paragraphSection.create({
      data: { sectionRowId: rowId, title: section.title, body: section.body },
    })
  } else if (section.type === 'image') {
    await tx.imageSection.create({
      data: { sectionRowId: rowId, imageName: section.imageName, caption: section.caption },
    })
  } else {
    await writeList(tx, rowId, section)
  }
}

/**
 * Writes a list section's own row, its fields, its items and their values.
 * A value whose field the list does not define is dropped — there is nothing for it
 * to hang off. Validation rejects those before they reach here.
 * @param tx The open transaction.
 * @param sectionRowId Row id of the section the list belongs to.
 * @param section The list section to write.
 */
async function writeList(tx: Tx, sectionRowId: string, section: ListSection): Promise<void> {
  await tx.listSection.create({ data: { sectionRowId, title: section.title } })
  const fieldRowIds = new Map<string, string>()
  for (const field of section.fields) {
    const { rowId } = await tx.listField.create({
      data: { sectionRowId, fieldId: field.id, label: field.label, position: field.position },
      select: { rowId: true },
    })
    fieldRowIds.set(field.id, rowId)
  }
  for (const item of section.items) {
    const { rowId } = await tx.listItem.create({
      data: { sectionRowId, itemId: item.id, position: item.position },
      select: { rowId: true },
    })
    await tx.listValue.createMany({
      data: item.values.flatMap((value) => {
        const fieldRowId = fieldRowIds.get(value.fieldId)
        return fieldRowId ? [{ itemRowId: rowId, fieldRowId, value: value.value }] : []
      }),
    })
  }
}

/**
 * Turns a section row and its child row back into a section.
 * @param row The section row.
 * @returns The section.
 * @throws Error When the child row its type calls for is missing.
 */
function toSection(row: SectionRow): Section {
  const base = { id: row.sectionId, position: row.position }
  if (row.paragraph) {
    return { ...base, type: 'paragraph', title: row.paragraph.title, body: row.paragraph.body }
  }
  if (row.image) {
    return { ...base, type: 'image', imageName: row.image.imageName, caption: row.image.caption }
  }
  if (row.list) {
    return toListSection(base, row.list)
  }
  throw new Error(`The ${row.type} section "${row.sectionId}" is missing its own row`)
}

/**
 * Turns a list row and everything under it back into a list section.
 * @param base The id and position shared by every section.
 * @param row The list row.
 * @returns The list section.
 */
function toListSection(base: { id: string; position: number }, row: ListRow): ListSection {
  return {
    ...base,
    type: 'list',
    title: row.title,
    fields: row.fields.map((field) => ({
      id: field.fieldId,
      label: field.label,
      position: field.position,
    })),
    items: row.items.map((item) => ({
      id: item.itemId,
      position: item.position,
      values: item.values.map((value) => ({ fieldId: value.field.fieldId, value: value.value })),
    })),
  }
}
