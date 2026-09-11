# ae-40 - Export images

* **Status**: Not started
* **Description**: Every uploaded image downloaded as one zip file.
* **Dependencies**: ae-15

## Requirements
1. Export downloads a zip containing every uploaded image, each keeping its original filename.
2. Uploading an image from that zip again, under the same name, reconnects everything that referenced it.
3. A library with many or large images still exports without the download timing out.
4. If there are no images, the admin is told rather than given an empty download.

## Out of Scope
* Importing the zip directly — images are put back by uploading them.
* Exporting content (that is ae-35).

## Context
This is the other half of the backup story: ae-35 saves the content, this saves the picture files. The two are separate downloads on purpose. Restoring is done by importing the JSON and then uploading the images from the zip; the name-based references mean the pictures reattach themselves.

## Notes
1. Import of the zip was considered and left out; re-uploading by name was judged good enough.
