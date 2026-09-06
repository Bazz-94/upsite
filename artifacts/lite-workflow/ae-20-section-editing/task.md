# ae-20 - Section editing

* **Status**: Not started
* **Description**: Editing a page's draft: its hero and title, and its paragraph and image sections.
* **Dependencies**: ae-10, ae-15

## Requirements
1. An admin can edit a page's title, and pick or clear its hero image using the shared image picker.
2. An admin can add a section of any of the three types to a page.
3. An admin can reorder the sections on a page, and delete one.
4. A paragraph section has an optional title and a body of text.
5. An image section has a chosen image, alt text and a caption.
6. Changes are saved to the page's draft and do not change the live site.
7. Leaving the screen with unsaved changes warns first.

## Out of Scope
* The inside of list sections — fields and items (that is ae-25).
* Previewing and publishing (that is ae-30).
* Creating and deleting pages (that is ae-10).

## Context
This is the main editing screen. A list section can be added here, but setting up its fields and items belongs to ae-25. Everything saves to the draft copy; until ae-30 adds publishing there is no way to push a draft live, so this task is checked by looking at the saved draft rather than at the public site.

## Notes
