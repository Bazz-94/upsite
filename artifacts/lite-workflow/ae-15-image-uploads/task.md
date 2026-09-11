# ae-15 - Image uploads

* **Status**: Not started
* **Description**: Admins upload images once, into blob storage, and reuse them anywhere on the site.
* **Dependencies**: ae-00

## Requirements
1. An admin can upload an image, which is recorded under its filename.
2. An image library shows every uploaded image, newest first.
3. Uploading a filename that already exists asks whether to replace the existing image.
4. An admin can delete an image, and is warned first if it is being used somewhere.
5. Anything that pointed at a deleted image keeps its name, and reconnects if an image with that name is uploaded again.
6. Files that are too large, or are not images, are refused with a clear message.
7. Other admin screens can open a shared picker to choose an existing image or upload a new one.

## Out of Scope
* Cropping, resizing or editing images.
* Exporting images (that is ae-40).
* Sign-in and access control.

## Context
Hero images, image sections and image fields inside lists all need the same thing, so uploading is built once here and reused by ae-20 and ae-25. Referencing images by name is what makes the "delete, then re-upload the same filename and the link comes back" behaviour work, and it is also what lets the image export in ae-40 act as a backup.

## Notes
1. Images are stored in blob storage.