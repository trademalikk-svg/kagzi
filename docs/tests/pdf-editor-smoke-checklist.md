# KAGZI PDF Editor — Manual Smoke Checklist

Run against the deployed preview URL after the branch is published.

## Workspace and privacy
- [ ] Open `pdf-editor.html` from the homepage PDF Studio navigation.
- [ ] Open it from `pdf-tools.html`.
- [ ] Confirm the page fits a 360px-wide mobile viewport without horizontal page overflow.
- [ ] Confirm keyboard focus reaches file selection, toolbar buttons, page number, and download.
- [ ] Open browser DevTools Network, select a PDF, edit locally, and export. Confirm no request contains the PDF bytes or extracted document text.
- [ ] Confirm the server-processing control is visibly unavailable and no upload request is made.

## PDF loading and rendering
- [ ] Select a valid one-page PDF; page count displays 1 and the page preview renders.
- [ ] Select a valid multi-page PDF; page count matches the file.
- [ ] Navigate next/previous; navigation cannot move outside the first and last pages.
- [ ] Enter a valid page number and an invalid/out-of-range page number.
- [ ] Zoom in and out; controls stop at their supported limits.
- [ ] Select a non-PDF file renamed with a .pdf suffix; parsing fails with a useful message.
- [ ] Select a damaged or encrypted PDF; show an error and retain the previous valid document.
- [ ] Block the PDF.js CDN and refresh; show a readable library-load error.

## Editing and export
- [ ] Add a text overlay; export and verify the text in an independent PDF viewer.
- [ ] Choose a PNG and add it; export and verify the image.
- [ ] Choose a JPG and add it; export and verify the image.
- [ ] Choose an unsupported image type; show a specific error and do not alter the working PDF.
- [ ] Add a highlight overlay; verify it is visual annotation only.
- [ ] Rotate the current page; export and verify orientation.
- [ ] Delete a page from a multi-page PDF; verify page count and page content.
- [ ] Attempt to delete the only page; verify the operation is refused.
- [ ] Move a page up/down; verify the output page order.
- [ ] Undo a recent edit and verify the previous document state is restored.
- [ ] Download an unchanged PDF and an edited PDF; verify both open and the original selected file remains unchanged.

## Existing KAGZI regression
- [ ] Homepage loads and its existing merge, split, compress, image-to-PDF and page tools remain available.
- [ ] `pdf-tools.html` links to the editor and existing PDF tools.
- [ ] About, Contact, Privacy and Terms pages still load.
