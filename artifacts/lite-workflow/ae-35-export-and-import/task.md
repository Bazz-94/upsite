# ae-35 - Export and import

* **Status**: Not started
* **Description**: All site content out as one JSON file, and back in again.
* **Dependencies**: ae-25, ae-30

## Requirements
1. Export downloads a single JSON file holding every page, section, list field definition and list item, including both draft and published versions.
2. Import reads such a file back and replaces the site's content with it.
3. Import checks the file first and refuses one that is damaged or from an incompatible version, changing nothing.
4. Before importing, the admin is told what will be replaced and has to confirm.
5. An import that fails partway leaves the site exactly as it was.
6. Image references survive the round trip, because they travel as names.

## Out of Scope
* The admin allowlist — it is never exported or imported.
* The image files themselves (that is ae-40).
* Merging with existing content, or importing only part of a file.

## Context
This is the backup and move-between-environments tool: take a JSON file out of one site and load it into another. Because images are referenced by name, an imported file lines up with whatever images are already uploaded on the target site, and any that are missing reconnect as soon as an image of that name is uploaded.

## Notes
1. The allowlist is excluded from both export and import on purpose — access should not travel with content.
