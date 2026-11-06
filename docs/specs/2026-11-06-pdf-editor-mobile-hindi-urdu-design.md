# KAGZI PDF Editor — Mobile Editing and Hindi/Urdu Text Design

**Status:** Proposed for review  
**Target branch:** `feat/all-in-one-pdf-studio`  
**Scope:** Improve the existing browser-based PDF editor without changing the production branch.

## Goals

1. Make adding and editing text practical on Android-sized screens.
2. Support Hindi and Urdu text in newly added or visually replaced text where the selected font and shaping pipeline can render it correctly.
3. Make the distinction between visual replacement and true native PDF text rewriting explicit.
4. Preserve the current browser-only, low-cost workflow and avoid a paid processing service.

## Current behavior and constraints

- Existing text is selected through the PDF.js text layer.
- Applying a replacement currently paints over the old text and draws replacement text on top. This changes the visible page, but does not rewrite the original PDF content stream; old text may remain searchable or extractable.
- New text is added as an overlay.
- The current built-in PDF fonts are not sufficient for reliable Devanagari and Urdu glyph coverage.
- Mobile inspector placement and keyboard visibility need refinement and real-device verification.
- The editor uses PDF.js for viewing and pdf-lib for export. A general-purpose, lossless native text-stream editor is not available in this stack.

## Proposed implementation

### A. Text editing behavior

- Keep the current visual replacement model for the first iteration.
- Label it accurately in the UI as **Visual text replacement**.
- Keep a clear warning that this does not securely erase or rewrite the original text layer.
- Retain the original text selection and preview workflow; make the selected text and replacement field easier to understand.
- Keep add-text as a separate action from replace-text.

### B. Hindi and Urdu font handling

- Add a client-side embedded-font path using a compatible fontkit integration with pdf-lib.
- Use properly licensed Noto font assets for Devanagari and Urdu/Arabic script, with attribution/license files retained in the repository.
- Verify glyph coverage and shaping before enabling a script/font combination. If shaping is not correct, show a clear unsupported-font warning rather than exporting broken glyphs.
- Do not claim universal Hindi/Urdu support until exported PDFs are reopened and checked.

### C. Android/mobile editing experience

- Keep the text inspector adjacent to the PDF page on narrow screens.
- When the text field receives focus, keep the active field and relevant actions visible above the virtual keyboard as far as Android Chrome permits.
- Provide compact, clearly labeled actions for Apply, Cancel, and Add text.
- Avoid relying on CSS grid `order` to reposition an element; use an explicit mobile layout structure.
- Preserve desktop layout behavior.

### D. Export verification

- Reopen the exported PDF with PDF.js after export.
- Verify page count and that the new visible text is present in the rendered output.
- Add automated tests for editor state, text edit metadata, font selection/fallback, and mobile layout hooks where testable.
- Manually verify representative Latin, Hindi, and Urdu samples. Record unsupported cases instead of silently accepting malformed output.

## Explicit non-goals for this iteration

- Guaranteed native rewriting of arbitrary PDF text streams.
- Secure redaction or removal of original hidden/searchable text.
- OCR-based reconstruction of every scanned or outlined document.
- Server-side processing or paid PDF APIs.
- A claim that all Android devices and browsers have been physically tested.

## Acceptance criteria

1. On a narrow viewport, the active text field and Apply/Cancel actions remain usable while editing.
2. Adding text and visually replacing selected text remain separate, predictable operations.
3. Exported PDFs reopen successfully and preserve the expected page count.
4. Supported Hindi/Urdu samples render correctly in the exported PDF; unsupported shaping cases are clearly reported.
5. The UI clearly explains that visual replacement is not native text rewriting or secure redaction.
6. Changes remain on the feature branch and are not merged into `main` without separate approval.

## Risks and mitigations

- **Complex-script shaping:** font embedding alone may not provide correct shaping. Gate support by real export tests and show a fallback warning.
- **Font size:** font assets can increase page weight. Prefer subset fonts where licensing and tooling allow; measure actual bundle impact.
- **Visual replacement artifacts:** background colors, transparency, rotated text, and non-white page regions can make a white mask inaccurate. Preserve the limitation and avoid claiming pixel-perfect replacement for all PDFs.
- **Mobile keyboard differences:** viewport behavior varies by browser and OS. Use responsive layout and verify on Android Chrome; do not claim universal behavior based only on emulation.
- **Native text editing expectations:** clearly distinguish this feature from true content-stream editing and secure redaction.
