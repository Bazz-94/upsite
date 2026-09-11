import 'server-only'
import type { NewPage } from './services/pages'
import type { ContentStore } from './store'

/**
 * The pages the site starts with: placeholder content the admin replaces. Published
 * from the outset, so the public site is never blank before the publishing screens
 * exist. Between them they use all three section types.
 */
export const seedPages: NewPage[] = [
  {
    slug: 'home',
    navOrder: 0,
    published: true,
    content: {
      title: 'Home',
      heroImageName: 'home-hero.jpg',
      sections: [
        {
          id: 'home-welcome',
          type: 'paragraph',
          position: 0,
          title: 'Welcome',
          body: 'Replace this text from the admin page. It is here so the site has something to show.',
        },
        {
          id: 'home-photo',
          type: 'image',
          position: 1,
          imageName: 'home-hall.jpg',
          caption: 'Replace this picture from the admin page.',
        },
      ],
    },
  },
  {
    slug: 'activities',
    navOrder: 1,
    published: true,
    content: {
      title: 'Activities',
      heroImageName: 'activities-hero.jpg',
      sections: [
        {
          id: 'activities-intro',
          type: 'paragraph',
          position: 0,
          title: null,
          body: 'What we do and when we do it. Replace this text from the admin page.',
        },
        {
          id: 'activities-sessions',
          type: 'list',
          position: 1,
          title: 'Weekly sessions',
          fields: [
            { id: 'activities-field-what', label: 'What', position: 0 },
            { id: 'activities-field-day', label: 'Day', position: 1 },
            { id: 'activities-field-time', label: 'Time', position: 2 },
          ],
          items: [
            {
              id: 'activities-item-first',
              position: 0,
              values: [
                { fieldId: 'activities-field-what', value: 'First activity' },
                { fieldId: 'activities-field-day', value: 'Monday' },
                { fieldId: 'activities-field-time', value: '19:00' },
              ],
            },
            {
              id: 'activities-item-second',
              position: 1,
              values: [
                { fieldId: 'activities-field-what', value: 'Second activity' },
                { fieldId: 'activities-field-day', value: 'Thursday' },
                { fieldId: 'activities-field-time', value: '18:30' },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'about',
    navOrder: 2,
    published: true,
    content: {
      title: 'About',
      heroImageName: null,
      sections: [
        {
          id: 'about-who',
          type: 'paragraph',
          position: 0,
          title: 'Who we are',
          body: 'A few words about the group. Replace this text from the admin page.',
        },
        {
          id: 'about-contact',
          type: 'paragraph',
          position: 1,
          title: 'Contact',
          body: 'How to get in touch. Replace this text from the admin page.',
        },
      ],
    },
  },
]

/**
 * Loads the starting pages, once. Does nothing if any of them is already there, so it
 * is safe to run on every deploy.
 * @param store The store to seed.
 * @returns Whether the pages were added.
 */
export async function seedContent(store: ContentStore): Promise<boolean> {
  const existing = await Promise.all(seedPages.map((page) => store.pages.getDraft(page.slug)))
  if (existing.some((page) => page !== null)) {
    return false
  }
  for (const page of seedPages) {
    await store.pages.create(page)
  }
  return true
}
