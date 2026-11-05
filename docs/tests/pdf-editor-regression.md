# PDF Editor Regression Checks

Run these checks on the feature branch before merging.

## Duplicate page
1. Open a valid two-page PDF.
2. Select page 1 and activate **Duplicate page**.
3. Confirm the document now has three pages and the selected page is the inserted copy (page 2).
4. Export the PDF and reopen it in a separate PDF viewer.
5. Confirm the output has three pages and page 1 and page 2 render identically.
6. Undo and confirm the document returns to two pages.
7. Try the action with no PDF open; the control must remain disabled.

## Insert pages from another PDF
1. Open a destination PDF with at least two pages and select page 1.
2. Choose a separate valid PDF in the Merge PDF files picker.
3. Activate **Insert first PDF after current page**.
4. Confirm all pages from the selected source PDF appear immediately after page 1, and the editor selects the first inserted page.
5. Export and reopen the destination; confirm the inserted pages and order persist.
6. Try with no source file and with a malformed source PDF; confirm a clear error and no partial document change.

## Image placement controls
1. Open a PDF and choose a PNG or JPG image.
2. Set image width and click the page to create a pending image preview.
3. Drag the preview to a different location; confirm it moves without creating duplicate previews.
4. Tap **Place image** and confirm the image is embedded at the preview position.
5. Export and reopen the PDF; confirm the image position and aspect ratio persist.
6. Start another image placement and tap **Cancel image**; confirm the preview is removed and no image is added.
7. Use Undo after placement and confirm the embedded image is removed.

## Select, reposition and visually cover an image added in this session
1. Add an image using the placement preview and confirm it appears on the current page.
2. Drag its selection outline to a new location; confirm the image moves and the previous area is visually covered.
3. Use Undo and Redo; confirm image placement metadata and selection outlines remain consistent.
4. Click the image outline; confirm the **Cover selected image** control becomes enabled.
5. Activate the control and confirm the image area is covered in the page preview and after export.
6. Confirm the editor warns that original image data may remain embedded; this is not secure redaction or guaranteed data erasure.
7. Reopen a different page and confirm the selection outline is not shown there.

## Image placement controls (size bounds)
1. Open a PDF and choose a PNG or JPG image.
2. Set image width to a valid percentage between 5 and 100.
3. Click the page to place the image and confirm the exported image width follows the chosen percentage while preserving aspect ratio.
4. Use Undo to remove the most recently placed image, then place it again at a different position to verify the reposition workflow.
5. Clear a pending image before placement and confirm no image is inserted.
6. Try a width below 5 and above 100; confirm the editor clamps to the supported range.

## Inspector text styling
1. Open a PDF containing selectable text and select a text span.
2. Change the replacement text, font size, font family, bold, alignment, color and opacity in the Inspector.
3. Apply the edit and confirm the preview reflects the selected style.
4. Export and reopen the PDF; confirm the replacement overlay retains the selected style.
5. Confirm nearby content and page layout remain acceptable; complex scripts and non-standard fonts require separate compatibility testing.

## Text edit history and styling bounds
1. Select existing text, change it in the Inspector, and apply the edit.
2. Confirm Undo restores the prior text preview and Redo restores the replacement.
3. Set opacity to 100% and confirm the exported overlay is fully opaque; set 50% and confirm it is visibly translucent.
4. Enable Bold for newly added text and confirm the exported text uses a bold built-in font where available.
5. Confirm text edits remain attached to their original page after moving, deleting, duplicating, or inserting pages.

## Watermark and page numbers
1. Open a multi-page PDF and enter a short watermark label.
2. Apply watermark and confirm it appears on every page with readable content still visible.
3. Add page numbers and confirm each page shows its correct `current / total` number.
4. Export and reopen the PDF to confirm both operations persist.
5. Undo after each operation and confirm the previous document state is restored.

## Existing page actions
- Rotate the current page and confirm its rotation persists after export/reopen.
- Move a page up/down and confirm thumbnail order and exported order match.
- Delete a page from a multi-page PDF and confirm the page count decreases.
- Attempt to delete the only page and confirm the editor refuses without changing the document.

## General regression
- Open a valid PDF, navigate, zoom, merge, split, and export.
- Open a non-PDF file and confirm a clear error.
- Open a malformed PDF and confirm the existing document remains unchanged.
- Verify Local mode makes no network upload request.

## Execution note
These are manual browser acceptance checks. They have not been executed in this change environment; do not treat them as passing until run in a browser.
