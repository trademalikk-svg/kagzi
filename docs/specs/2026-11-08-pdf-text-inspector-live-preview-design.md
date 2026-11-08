# KAGZI PDF Text Inspector Live Preview Design

## Status
Proposed implementation design for review. Production remains unchanged.

## Goals
- Match the approved right-side Text Inspector layout on desktop.
- On narrow screens, place the inspector above the PDF canvas in a compact collapsible panel.
- Provide immediate visual preview while changing text properties, without requiring Apply for each change.
- Keep Apply as the commit/persist action for the selected text edit.
- Preserve undo/redo, export, save, and reopen behavior.
- Keep original-PDF text replacement separate from adding/editing overlay text. Never label an overlay as native text replacement.

## Inspector controls
- Text content
- Font family and size
- Bold, italic, underline, strike-through
- Left, center, right alignment
- Text colour
- Background fill / no fill
- Opacity
- Apply selected text edit

Controls must be enabled only when a supported text object or editable text overlay is selected. Unsupported operations must explain why they are unavailable.

## Live-preview behavior
- Input/change events update the selected overlay preview immediately.
- Preview changes remain in the editor state and are reflected in the canvas without mutating the original source bytes on every keystroke.
- Apply records one undoable edit and updates the working PDF bytes.
- Save/export then reopen must preserve applied changes.
- Cancel/selection change must not silently commit un-applied preview state.

## Layout
- Desktop: inspector remains the right-hand workspace column, visually grouped in a card with a clear title.
- Mobile: inspector appears before the canvas as a collapsible section; controls remain reachable without scrolling to the bottom of the page.
- Existing page rail and document tool row remain in their current order.

## Native PDF text replacement
This is a distinct capability and is not implicitly enabled by the Inspector redesign. PDFium remains fail-closed until its browser runtime is loaded and actual browser Save/Reopen, rendered output, duplicate/ambiguous text, Unicode, and unsupported-PDF tests pass. If those gates are not met, show a clear unsupported status and do not claim that native source text was replaced.

## Acceptance tests
1. Selecting an editable text overlay populates the Inspector with its current values.
2. Changing font size, colour, opacity, fill, font style, or alignment updates the preview immediately.
3. Apply commits one undoable edit and updates exported PDF output.
4. Save/export and reopen preserves committed text and styling.
5. Unapplied preview changes are discarded on cancel or selection change, with a clear confirmation/status where needed.
6. Desktop Inspector is on the right; mobile Inspector appears above the PDF canvas and can collapse.
7. Unsupported original PDF text cannot be falsely reported as natively replaced.
8. No regression in existing page navigation, image placement, OCR, or PDF export.

## Privacy and cost
All document processing remains local in the browser. No paid APIs, server upload, or new recurring service is introduced.
