import {
  ContentValidationError,
  validatePage,
  validatePageContent,
  type ListSection,
  type Page,
  type PageContent,
  type Section,
} from '@/shared/content'

/**
 * Builds a list section holding one field and one item filled in against it.
 * @param overrides Parts of the section to replace.
 * @returns A valid list section.
 */
function listSection(overrides: Partial<ListSection> = {}): ListSection {
  return {
    id: 'section-list',
    type: 'list',
    position: 2,
    title: 'Sessions',
    fields: [{ id: 'field-day', label: 'Day', position: 0 }],
    items: [{ id: 'item-1', position: 0, values: [{ fieldId: 'field-day', value: 'Monday' }] }],
    ...overrides,
  }
}

/**
 * Builds page content holding all three section types.
 * @param sections Sections to use instead of the default three.
 * @returns Valid page content.
 */
function content(sections?: Section[]): PageContent {
  return {
    title: 'Activities',
    heroImageName: 'hero.jpg',
    sections: sections ?? [
      { id: 'section-intro', type: 'paragraph', position: 0, title: 'Intro', body: 'What we do.' },
      { id: 'section-photo', type: 'image', position: 1, imageName: 'hall.jpg', caption: null },
      listSection(),
    ],
  }
}

/**
 * Builds a whole page.
 * @param overrides Parts of the page to replace.
 * @returns A valid page.
 */
function page(overrides: Partial<Page> = {}): Page {
  return {
    id: 'page-activities',
    slug: 'activities',
    navOrder: 1,
    navVisible: true,
    published: true,
    kind: 'draft',
    content: content(),
    ...overrides,
  }
}

/**
 * Runs a check expected to fail and hands back the issues it reported.
 * @param run The check to run.
 * @returns The issues.
 */
function issuesFrom(run: () => unknown): ContentValidationError['issues'] {
  try {
    run()
  } catch (error) {
    if (error instanceof ContentValidationError) {
      return error.issues
    }
    throw error
  }
  throw new Error('Expected the content to be rejected')
}

describe('validatePageContent', () => {
  it('accepts content holding all three section types', () => {
    expect(validatePageContent(content())).toEqual(content())
  })

  it('accepts content with no hero image and no sections', () => {
    expect(validatePageContent({ title: 'About', heroImageName: null, sections: [] }).sections).toEqual([])
  })

  it('rejects a paragraph section with an empty body', () => {
    const sections: Section[] = [{ id: 's1', type: 'paragraph', position: 0, title: null, body: '' }]

    expect(issuesFrom(() => validatePageContent(content(sections)))).toEqual([
      { path: 'sections.0.body', message: 'Body is required' },
    ])
  })

  it('rejects an image section with no image name', () => {
    const sections: Section[] = [{ id: 's1', type: 'image', position: 0, imageName: '', caption: null }]

    expect(issuesFrom(() => validatePageContent(content(sections)))).toEqual([
      { path: 'sections.0.imageName', message: 'Image name is required' },
    ])
  })

  it('rejects two sections sharing a position', () => {
    const sections: Section[] = [
      { id: 's1', type: 'paragraph', position: 0, title: null, body: 'One' },
      { id: 's2', type: 'paragraph', position: 0, title: null, body: 'Two' },
    ]

    expect(issuesFrom(() => validatePageContent(content(sections)))).toEqual([
      { path: 'sections.1.position', message: 'Two sections share the position 0' },
    ])
  })

  it('rejects two sections sharing an id', () => {
    const sections: Section[] = [
      { id: 's1', type: 'paragraph', position: 0, title: null, body: 'One' },
      { id: 's1', type: 'paragraph', position: 1, title: null, body: 'Two' },
    ]

    expect(issuesFrom(() => validatePageContent(content(sections)))).toEqual([
      { path: 'sections.1.id', message: 'Two sections share the id "s1"' },
    ])
  })

  it('rejects a list item holding a value for an undefined field', () => {
    const section = listSection({
      position: 0,
      items: [{ id: 'item-1', position: 0, values: [{ fieldId: 'field-time', value: '19:00' }] }],
    })

    expect(issuesFrom(() => validatePageContent(content([section])))).toEqual([
      {
        path: 'sections.0.items.0.values.0.fieldId',
        message: 'This list defines no field with the id "field-time"',
      },
    ])
  })

  it('rejects a list item holding two values for one field', () => {
    const section = listSection({
      position: 0,
      items: [
        {
          id: 'item-1',
          position: 0,
          values: [
            { fieldId: 'field-day', value: 'Monday' },
            { fieldId: 'field-day', value: 'Tuesday' },
          ],
        },
      ],
    })

    expect(issuesFrom(() => validatePageContent(content([section])))).toEqual([
      {
        path: 'sections.0.items.0.values.1.fieldId',
        message: 'This item has two values for the field "field-day"',
      },
    ])
  })

  it('rejects two list fields sharing an id', () => {
    const section = listSection({
      position: 0,
      fields: [
        { id: 'field-day', label: 'Day', position: 0 },
        { id: 'field-day', label: 'Time', position: 1 },
      ],
    })

    expect(issuesFrom(() => validatePageContent(content([section])))).toEqual([
      { path: 'sections.0.fields.1.id', message: 'Two fields share the id "field-day"' },
    ])
  })

  it('rejects two list fields sharing a position', () => {
    const section = listSection({
      position: 0,
      fields: [
        { id: 'field-day', label: 'Day', position: 0 },
        { id: 'field-time', label: 'Time', position: 0 },
      ],
    })

    expect(issuesFrom(() => validatePageContent(content([section])))).toEqual([
      { path: 'sections.0.fields.1.position', message: 'Two fields share the position 0' },
    ])
  })

  it('rejects two list items sharing an id', () => {
    const section = listSection({
      position: 0,
      items: [
        { id: 'item-1', position: 0, values: [] },
        { id: 'item-1', position: 1, values: [] },
      ],
    })

    expect(issuesFrom(() => validatePageContent(content([section])))).toEqual([
      { path: 'sections.0.items.1.id', message: 'Two items share the id "item-1"' },
    ])
  })

  it('rejects two list items sharing a position', () => {
    const section = listSection({
      position: 0,
      items: [
        { id: 'item-1', position: 0, values: [] },
        { id: 'item-2', position: 0, values: [] },
      ],
    })

    expect(issuesFrom(() => validatePageContent(content([section])))).toEqual([
      { path: 'sections.0.items.1.position', message: 'Two items share the position 0' },
    ])
  })

  it('rejects an empty page title', () => {
    expect(issuesFrom(() => validatePageContent({ ...content(), title: '' }))).toEqual([
      { path: 'title', message: 'Title is required' },
    ])
  })

  it('reports a path-less issue when the value is not content at all', () => {
    const issues = issuesFrom(() => validatePageContent(null))

    expect(issues).toHaveLength(1)
    expect(issues[0].path).toBe('')
  })
})

describe('validatePage', () => {
  it('accepts a whole page', () => {
    expect(validatePage(page())).toEqual(page())
  })

  it('rejects an empty slug', () => {
    expect(issuesFrom(() => validatePage(page({ slug: '' })))).toEqual([
      { path: 'slug', message: 'Slug is required' },
    ])
  })

  it('rejects a slug containing spaces', () => {
    expect(issuesFrom(() => validatePage(page({ slug: 'our activities' })))).toEqual([
      {
        path: 'slug',
        message: 'Slug must be lowercase letters, numbers and hyphens, with no spaces',
      },
    ])
  })

  it('rejects a negative nav order', () => {
    expect(issuesFrom(() => validatePage(page({ navOrder: -1 })))).toEqual([
      { path: 'navOrder', message: 'Position cannot be negative' },
    ])
  })

  it('reports every failing field at once', () => {
    const issues = issuesFrom(() => validatePage(page({ slug: '', navOrder: 1.5 })))

    expect(issues.map((issue) => issue.path)).toEqual(['slug', 'navOrder'])
  })
})

describe('ContentValidationError', () => {
  it('names the field and the reason in its message', () => {
    const error = new ContentValidationError([{ path: 'sections.0.body', message: 'Body is required' }])

    expect(error.message).toBe('Content is invalid — sections.0.body: Body is required')
    expect(error.name).toBe('ContentValidationError')
  })

  it('leaves out the path when there is none', () => {
    const error = new ContentValidationError([{ path: '', message: 'Expected an object' }])

    expect(error.message).toBe('Content is invalid — Expected an object')
  })
})
