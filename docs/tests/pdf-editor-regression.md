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
