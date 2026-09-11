# ae-10 - Admin pages area

* **Status**: Not started
* **Description**: An admin area where the pages themselves are created, renamed, reordered and deleted.
* **Dependencies**: ae-00

## Requirements
1. The admin area lists every page with its slug and whether it is published.
2. An admin can create a page by giving it a title and a slug.
3. An admin can rename a page and change its slug.
4. An admin can delete a page, after confirming.
5. An admin can reorder the pages, which sets the order they appear in the site nav.
6. An admin can hide a page from the nav without deleting it.
7. A slug that is already taken, or is not a valid URL, is refused with a clear message.

## Out of Scope
* Editing what is on a page (that is ae-20).
* Sign-in and access control (that is ae-45).
* Publishing and previewing (that is ae-30).

## Context
This is the first admin screen and the entry point to everything else in the admin area. There is no sign-in yet, so the admin area is open to anyone who knows the URL until ae-45 lands — it should not be on a public address before then.

## Notes
1. Sign-in was deliberately ordered last, so every admin task before ae-45 is built unprotected.
