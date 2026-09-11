import type { PageRecord } from '@/server/content/repositories/content-repository'
import type {
  ImageSection,
  ListSection,
  PageContent,
  ParagraphSection,
  Section,
} from '@/shared/content'

/**
 * Builds a paragraph section.
 * @param overrides Parts of the section to replace.
 * @returns A valid paragraph section.
 */
export function paragraphSection(overrides: Partial<ParagraphSection> = {}): ParagraphSection {
  return {
    id: 'section-intro',
    type: 'paragraph',
    position: 0,
    title: 'Welcome',
    body: 'We meet every week.',
    ...overrides,
  }
}

/**
 * Builds an image section.
 * @param overrides Parts of the section to replace.
 * @returns A valid image section.
 */
export function imageSection(overrides: Partial<ImageSection> = {}): ImageSection {
  return {
    id: 'section-photo',
    type: 'image',
    position: 1,
    imageName: 'hall.jpg',
    caption: 'The hall',
    ...overrides,
  }
}

/**
 * Builds a list section with two fields and two items.
 * @param overrides Parts of the section to replace.
 * @returns A valid list section.
 */
export function listSection(overrides: Partial<ListSection> = {}): ListSection {
  return {
    id: 'section-sessions',
    type: 'list',
    position: 2,
    title: 'Sessions',
    fields: [
      { id: 'field-day', label: 'Day', position: 0 },
      { id: 'field-time', label: 'Time', position: 1 },
    ],
    items: [
      {
        id: 'item-monday',
        position: 0,
        values: [
          { fieldId: 'field-day', value: 'Monday' },
          { fieldId: 'field-time', value: '19:00' },
        ],
      },
      {
        id: 'item-thursday',
        position: 1,
        values: [
          { fieldId: 'field-day', value: 'Thursday' },
          { fieldId: 'field-time', value: '18:30' },
        ],
      },
    ],
    ...overrides,
  }
}

/**
 * Builds page content holding all three section types.
 * @param overrides Parts of the content to replace.
 * @returns Valid page content.
 */
export function pageContent(overrides: Partial<PageContent> = {}): PageContent {
  const sections: Section[] = [paragraphSection(), imageSection(), listSection()]
  return {
    title: 'Activities',
    heroImageName: 'hero.jpg',
    sections,
    ...overrides,
  }
}

/**
 * Builds a page's settings.
 * @param overrides Parts of the settings to replace.
 * @returns Valid page settings.
 */
export function pageRecord(overrides: Partial<PageRecord> = {}): PageRecord {
  return {
    id: 'page-activities',
    slug: 'activities',
    navOrder: 1,
    navVisible: true,
    published: true,
    ...overrides,
  }
}
