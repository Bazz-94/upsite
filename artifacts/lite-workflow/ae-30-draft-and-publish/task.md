# ae-30 - Draft and publish

* **Status**: Not started
* **Description**: Edits stay in a draft until an admin previews and publishes them.
* **Dependencies**: ae-20, ae-25

## Requirements
1. A page shows whether its draft differs from what is currently published.
2. An admin can preview a page's draft as visitors would see it.
3. Publishing makes the draft the live version of the page.
4. Discarding throws the draft away and restores the published version.
5. Publishing a page that has never been published makes it appear on the site and in the nav.
6. Unpublishing takes a page off the site without deleting it.
7. A preview is not reachable to ordinary visitors.

## Out of Scope
* Scheduled publishing.
* Version history and rolling back to an older published version.
* Publishing several pages in one go.

## Context
The draft and published copies have existed in the store since ae-00; this task adds the screens and actions that move content between them. Until this lands, seeded content is the only thing published, so this is the point where an admin's own edits can first reach the public site.

## Notes
