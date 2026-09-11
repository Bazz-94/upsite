/** Which copy of a page's content is being read or written. */
export type PageVersionKind = 'draft' | 'published'

/** The kinds of section a page can hold. */
export type SectionType = 'paragraph' | 'list' | 'image'

/** What every section carries, whatever its type. */
export interface SectionBase {
  /** Stable id, kept across saves so an edit updates the section instead of replacing it. */
  id: string
  /** Discriminator telling the section types apart. */
  type: SectionType
  /** Zero-based place in the page, unique within one copy of the page. */
  position: number
}

/** Body text with an optional heading. */
export interface ParagraphSection extends SectionBase {
  /** Discriminator value for this type. */
  type: 'paragraph'
  /** Heading shown above the body, or null for none. */
  title: string | null
  /** The text itself. */
  body: string
}

/** A single image. */
export interface ImageSection extends SectionBase {
  /** Discriminator value for this type. */
  type: 'image'
  /** Name of the uploaded image. A name, never a storage location. */
  imageName: string
  /** Caption shown under the image, or null for none. */
  caption: string | null
}

/** One column of a list section. */
export interface ListField {
  /** Stable id, referenced by every item's values. */
  id: string
  /** Column heading. */
  label: string
  /** Zero-based place among the list's fields. */
  position: number
}

/** What one item holds for one field. */
export interface ListValue {
  /** Id of the field this value belongs to. Must be a field the list defines. */
  fieldId: string
  /** The value as text. */
  value: string
}

/** One row of a list section. */
export interface ListItem {
  /** Stable id, kept across saves. */
  id: string
  /** Zero-based place among the list's items. */
  position: number
  /** This item's value per field. */
  values: ListValue[]
}

/** A table of items the admin defines the columns of. */
export interface ListSection extends SectionBase {
  /** Discriminator value for this type. */
  type: 'list'
  /** Heading shown above the list, or null for none. */
  title: string | null
  /** The columns every item is filled in against. */
  fields: ListField[]
  /** The rows. */
  items: ListItem[]
}

/** Any section, narrowed by its `type`. */
export type Section = ParagraphSection | ImageSection | ListSection

/** One copy — draft or published — of what a page shows. */
export interface PageContent {
  /** Page title, shown as the heading and in the nav. */
  title: string
  /** Name of the hero image, or null for none. A name, never a storage location. */
  heroImageName: string | null
  /** The sections, in `position` order. */
  sections: Section[]
}

/** A page together with the copy of its content that was asked for. */
export interface Page {
  /** Stable id. */
  id: string
  /** URL path segment, unique across pages. */
  slug: string
  /** Place in the site navigation. */
  navOrder: number
  /** Whether the page appears in the navigation. */
  navVisible: boolean
  /** Whether the page is visible to the public at all. */
  published: boolean
  /** Which copy `content` holds. */
  kind: PageVersionKind
  /** The content of that copy. */
  content: PageContent
}

/** One link in the site navigation. */
export interface NavEntry {
  /** URL path segment of the page linked to. */
  slug: string
  /** Text of the link. */
  title: string
  /** Place in the navigation. */
  navOrder: number
}
