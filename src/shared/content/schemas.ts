import { z } from 'zod'
import { ContentValidationError, type ContentValidationIssue } from './errors'
import type { Page, PageContent } from './types'

/** Lowercase words joined by single hyphens — no spaces, no leading or trailing hyphen. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** A page's URL path segment. Reports one reason at a time, missing before malformed. */
export const slugSchema = z.string().superRefine((slug, ctx) => {
  if (slug.length === 0) {
    ctx.addIssue({ code: 'custom', message: 'Slug is required' })
  } else if (!SLUG_PATTERN.test(slug)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Slug must be lowercase letters, numbers and hyphens, with no spaces',
    })
  }
})

/** Any stable id carried by content. */
const idSchema = z.string().min(1, 'Id is required')

/** A zero-based ordering number. */
const positionSchema = z.number().int('Position must be a whole number').min(0, 'Position cannot be negative')

/** Body text with an optional heading. */
export const paragraphSectionSchema = z.object({
  id: idSchema,
  type: z.literal('paragraph'),
  position: positionSchema,
  title: z.string().min(1, 'Title cannot be empty').nullable(),
  body: z.string().min(1, 'Body is required'),
})

/** A single image, referenced by name. */
export const imageSectionSchema = z.object({
  id: idSchema,
  type: z.literal('image'),
  position: positionSchema,
  imageName: z.string().min(1, 'Image name is required'),
  caption: z.string().min(1, 'Caption cannot be empty').nullable(),
})

/** One column of a list section. */
export const listFieldSchema = z.object({
  id: idSchema,
  label: z.string().min(1, 'Field label is required'),
  position: positionSchema,
})

/** What one item holds for one field. */
export const listValueSchema = z.object({
  fieldId: idSchema,
  value: z.string(),
})

/** One row of a list section. */
export const listItemSchema = z.object({
  id: idSchema,
  position: positionSchema,
  values: z.array(listValueSchema),
})

/** A table of items, with the columns the admin defined. */
export const listSectionSchema = z
  .object({
    id: idSchema,
    type: z.literal('list'),
    position: positionSchema,
    title: z.string().min(1, 'Title cannot be empty').nullable(),
    fields: z.array(listFieldSchema),
    items: z.array(listItemSchema),
  })
  .superRefine(checkListConsistency)

/** Any section, picked by its `type`. */
export const sectionSchema = z.discriminatedUnion('type', [
  paragraphSectionSchema,
  imageSectionSchema,
  listSectionSchema,
])

/** One copy — draft or published — of what a page shows. */
export const pageContentSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    heroImageName: z.string().min(1, 'Hero image name cannot be empty').nullable(),
    sections: z.array(sectionSchema),
  })
  .superRefine(checkSectionOrder)

/** A page and the copy of its content that goes with it. */
export const pageSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  navOrder: positionSchema,
  navVisible: z.boolean(),
  published: z.boolean(),
  kind: z.enum(['draft', 'published']),
  content: pageContentSchema,
})

/**
 * Rejects sections that share an id or a position, both of which would make the
 * page's order ambiguous and break saving by id.
 * @param content The page copy being checked.
 * @param ctx Where issues are reported.
 */
function checkSectionOrder(content: { sections: { id: string; position: number }[] }, ctx: z.RefinementCtx): void {
  const seenIds = new Set<string>()
  const seenPositions = new Set<number>()
  content.sections.forEach((section, index) => {
    if (seenIds.has(section.id)) {
      addIssue(ctx, ['sections', index, 'id'], `Two sections share the id "${section.id}"`)
    }
    if (seenPositions.has(section.position)) {
      addIssue(ctx, ['sections', index, 'position'], `Two sections share the position ${section.position}`)
    }
    seenIds.add(section.id)
    seenPositions.add(section.position)
  })
}

/**
 * Rejects a list whose fields or items clash, or whose items are filled in against a
 * field the list does not define. Each of these would break a unique column in the
 * database, so they are caught here with a reason instead.
 * @param section The list section being checked.
 * @param ctx Where issues are reported.
 */
function checkListConsistency(
  section: {
    fields: { id: string; position: number }[]
    items: { id: string; position: number; values: { fieldId: string }[] }[]
  },
  ctx: z.RefinementCtx
): void {
  checkItems(section.items, checkFields(section.fields, ctx), ctx)
}

/**
 * Rejects two fields sharing an id or a position.
 * @param fields The list's fields.
 * @param ctx Where issues are reported.
 * @returns The ids of the fields the list defines.
 */
function checkFields(fields: { id: string; position: number }[], ctx: z.RefinementCtx): Set<string> {
  const ids = new Set<string>()
  const positions = new Set<number>()
  fields.forEach((field, index) => {
    if (ids.has(field.id)) {
      addIssue(ctx, ['fields', index, 'id'], `Two fields share the id "${field.id}"`)
    }
    if (positions.has(field.position)) {
      addIssue(ctx, ['fields', index, 'position'], `Two fields share the position ${field.position}`)
    }
    ids.add(field.id)
    positions.add(field.position)
  })
  return ids
}

/**
 * Rejects two items sharing an id or a position, and checks each item's values.
 * @param items The list's items.
 * @param fieldIds Ids of the fields the list defines.
 * @param ctx Where issues are reported.
 */
function checkItems(
  items: { id: string; position: number; values: { fieldId: string }[] }[],
  fieldIds: Set<string>,
  ctx: z.RefinementCtx
): void {
  const ids = new Set<string>()
  const positions = new Set<number>()
  items.forEach((item, index) => {
    if (ids.has(item.id)) {
      addIssue(ctx, ['items', index, 'id'], `Two items share the id "${item.id}"`)
    }
    if (positions.has(item.position)) {
      addIssue(ctx, ['items', index, 'position'], `Two items share the position ${item.position}`)
    }
    ids.add(item.id)
    positions.add(item.position)
    checkItemValues(item.values, index, fieldIds, ctx)
  })
}

/**
 * Rejects values pointing at an undefined field, and two values for one field.
 * @param values The item's values.
 * @param itemIndex Index of the item, for the issue path.
 * @param fieldIds Ids of the fields the list defines.
 * @param ctx Where issues are reported.
 */
function checkItemValues(
  values: { fieldId: string }[],
  itemIndex: number,
  fieldIds: Set<string>,
  ctx: z.RefinementCtx
): void {
  const seen = new Set<string>()
  values.forEach((value, valueIndex) => {
    const path = ['items', itemIndex, 'values', valueIndex, 'fieldId']
    if (!fieldIds.has(value.fieldId)) {
      addIssue(ctx, path, `This list defines no field with the id "${value.fieldId}"`)
    } else if (seen.has(value.fieldId)) {
      addIssue(ctx, path, `This item has two values for the field "${value.fieldId}"`)
    }
    seen.add(value.fieldId)
  })
}

/**
 * Reports one issue against a field.
 * @param ctx Where issues are reported.
 * @param path Path to the field, relative to the schema being checked.
 * @param message Why it was rejected.
 */
function addIssue(ctx: z.RefinementCtx, path: (string | number)[], message: string): void {
  ctx.addIssue({ code: 'custom', path, message })
}

/**
 * Turns a Zod failure into field-level issues.
 * @param error The Zod error.
 * @returns One issue per failing field.
 */
function toIssues(error: z.ZodError): ContentValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }))
}

/**
 * Parses against a schema, raising a content error naming every failing field.
 * @param schema The schema to parse against.
 * @param value The value to check.
 * @returns The parsed value.
 * @throws ContentValidationError When the value does not fit the schema.
 */
function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new ContentValidationError(toIssues(result.error))
  }
  return result.data
}

/**
 * Checks one copy of a page's content.
 * @param value The content to check.
 * @returns The content, typed.
 * @throws ContentValidationError When the content does not fit the rules.
 */
export function validatePageContent(value: unknown): PageContent {
  return parseOrThrow(pageContentSchema, value)
}

/**
 * Checks a whole page, its slug and nav settings included.
 * @param value The page to check.
 * @returns The page, typed.
 * @throws ContentValidationError When the page does not fit the rules.
 */
export function validatePage(value: unknown): Page {
  return parseOrThrow(pageSchema, value)
}
