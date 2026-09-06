# ae-25 - List sections

* **Status**: Not started
* **Description**: List sections whose fields the admin defines, and the items filled in against them.
* **Dependencies**: ae-20

## Requirements
1. An admin can define the fields of a list: each field has a name and a type — text, long text, image, or link.
2. An admin can add, rename, reorder and remove fields on a list.
3. Removing a field warns that the values held in it will be lost.
4. An admin can add, edit, reorder and delete the items in a list.
5. Each item is edited through the fields defined for that list, with the right kind of input per field type.
6. Image fields use the shared image picker.
7. The public site renders list items using the same field definitions.

## Out of Scope
* Filtering, sorting or paging lists on the public site.
* Sharing one set of field definitions between several lists.
* Previewing and publishing.

## Context
Lists are how the Activities page holds repeated entries, but nothing about them is specific to activities — the admin decides what fields an entry has. This is the most involved editing work in the project and is kept separate from ae-20 for that reason.

## Notes
