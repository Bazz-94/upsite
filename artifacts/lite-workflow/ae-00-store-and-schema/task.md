# ae-00 - Store and schema

* **Status**: Done
* **Description**: The database and the single interface every part of the site uses to read and write content.
* **Dependencies**: none

## Requirements
1. The store holds pages (slug, title, hero image, nav order and nav visibility), the sections on each page in order, and for list sections their field definitions and their items.
2. There are three section types: paragraph (optional title plus body), list, and image.
3. Every page keeps a draft copy and a published copy of its content.
4. Images are referenced by name rather than by storage location, so an image re-uploaded under the same name reconnects on its own.
5. All reading and writing goes through one interface, so pages and admin screens never touch the database directly.
6. On first run the store is seeded with Home, Activities and About, published, holding placeholder content.
7. Content that does not fit the rules is rejected with a clear reason instead of being saved.

## Out of Scope
* Any user interface.
* Uploading or storing the image files themselves.
* Sign-in and the admin allowlist.

## Context
The site is a small content-managed website: three pages to start with, each made of a hero image, a title and a list of sections the admin arranges. Everything else in this project reads and writes through this task's interface, so the storage choice can change later without touching pages. Draft and published copies exist from the start even though the publishing screens come later (ae-30); until then the seeded content is already published so the public site is never blank.

## Notes
1. Postgres is used for both development (local) and production (Neon), with the same schema.
2. Images are referenced by name because deleting and re-uploading an image with the same filename must repair the link (agreed during ideation).
3. The write side of the interface is one whole-page draft save, not per-section operations. ae-20 and ae-25 read a draft, change it and save it back, so validation only ever runs in one place (agreed during planning).
4. "On first run" (requirement 6) means an explicit, idempotent seed script run as a setup step, not a check on every app boot (agreed during planning).
