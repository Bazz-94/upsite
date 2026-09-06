# ae-05 - Public site

* **Status**: Not started
* **Description**: The public pages render their published content, with a shared nav and footer.
* **Dependencies**: ae-00

## Requirements
1. A page is served at its slug; Home is served at the site root.
2. A page renders its hero image, then its title, then each of its sections in order.
3. Each section type renders in its own way: paragraph, list, and image.
4. The nav lists the pages that are set to appear in it, in their set order.
5. A slug that does not exist, or belongs to a page that is not published, gives a "not found" page.
6. An image that is missing leaves the rest of the page working rather than breaking it.
7. Layout and section styling come from shared design tokens, not one-off values, and the pages work on phone screens.

## Out of Scope
* The admin area.
* Drafts and previewing unpublished content.
* Filtering, sorting or paging of list sections.

## Context
This is the visitor-facing half of the site. It only ever shows published content, read through the content store from ae-00. The three starting pages come from the seed data, so this task can be finished and checked before any admin screen exists.

## Notes
* Make use of Server Side Rendering, the client should not have to make calls to get the published or draft preview content. 
