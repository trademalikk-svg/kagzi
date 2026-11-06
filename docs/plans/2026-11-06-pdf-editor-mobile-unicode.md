# KAGZI PDF Editor Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the KAGZI PDF editor easier to use on Android, render verified Hindi/Urdu text in exported overlays, and clearly describe the existing visual-replacement model.

**Architecture:** Preserve the current PDF.js viewer and pdf-lib export pipeline. Improve the existing inspector layout and focus behavior; add a local embedded-font path only for scripts that pass shaping and export-render tests; keep visual replacement separate from native PDF content-stream rewriting. All changes remain on `feat/all-in-one-pdf-studio`.

**Tech Stack:** HTML, CSS, browser JavaScript, PDF.js 3.11.174, pdf-lib 1.17.1, Node.js 22 built-in test runner, GitHub Actions.

## Global Constraints

- Keep the browser-only workflow; do not introduce a paid PDF API or server upload.
- Keep the original PDF unchanged until the user exports a copy.
- Do not claim that visual replacement rewrites or securely erases the original PDF text.
- Do not enable a Hindi/Urdu script/font combination until the exported PDF renders the representative sample correctly.
- Preserve desktop behavior while improving narrow-screen layout.
- Do not merge the feature branch into `main` or claim the production site has changed.
- Real Android Chrome verification must be recorded separately from automated viewport tests.

---

### Task 1: Make the mobile text inspector usable with the Android keyboard

**Files:**
- Modify: `pdf-editor.html`
- Modify: `pdf-editor.css`
- Modify: `pdf-editor.js`
- Test: `tests/pdf-editor-workspace.test.mjs`

**Interfaces:**
- Existing DOM IDs remain stable: `pdfInspector`, `inspectorText`, `applyTextEdit`, `pdfCanvasHost`, `editorStatus`.
- Add a small editor helper, exposed for deterministic tests as `window.KAGZIPdfMobileInspector`, with `bind({ inspector, field, actions, viewport })` and `revealActiveField()`.
- `bind` listens to field focus and `visualViewport.resize` / `visualViewport.scroll` when available; it must safely fall back when `visualViewport` is absent.

- [ ] **Step 1: Add focused failing tests**

Add tests that assert:
- The mobile inspector contains a visible text-entry label or accessible name, plus separate Apply and Cancel controls.
- The inspector remains before the page canvas in document order.
- CSS has a narrow-screen layout rule that avoids horizontal overflow and gives the inspector an independently scrollable region.
- The mobile helper exposes a focus/reveal method and safely guards the optional `visualViewport` API.
- Existing text selection and add-text controls remain present.

- [ ] **Step 2: Verify the relevant failure**

Run: `node --test tests/pdf-editor-workspace.test.mjs`

Expected: new assertions fail because the explicit Cancel action, focus helper, and associated mobile behavior do not yet exist.

- [ ] **Step 3: Implement the minimum behavior**

- Keep the inspector in the document flow directly before `#pdfCanvasHost`.
- Add a Cancel action that clears the pending selection/edit state, restores the original text-layer preview where necessary, disables Apply, and returns focus to the editor status region without changing the PDF bytes.
- Give the textarea an explicit accessible label and use `dir="auto"` so mixed Hindi/English/Urdu entry follows the text direction.
- On focus, use `visualViewport` measurements when present and call `scrollIntoView({block:"nearest"})` for the active field/actions; do not assume a fixed keyboard height.
- On viewport resize/scroll, recalculate only while the inspector field is focused. Remove listeners on blur or when the helper is disposed.
- Keep Apply/Cancel controls reachable and avoid sticky elements overlapping one another; use one coherent mobile sticky layer rather than competing sticky z-index values.
- If the browser does not expose `visualViewport`, keep normal document scrolling and do not throw.

- [ ] **Step 4: Verify the focused pass**

Run: `node --test tests/pdf-editor-workspace.test.mjs`

Expected: all workspace tests pass, including new mobile inspector and focus-helper assertions.

- [ ] **Step 5: Run affected integration checks**

Run: `node --check pdf-editor.js`

Expected: no JavaScript syntax errors. Then manually inspect 360 px and 390 px browser widths; automated tests do not prove the Android keyboard behavior.

- [ ] **Step 6: Commit the passing deliverable**

```bash
git add pdf-editor.html pdf-editor.css pdf-editor.js tests/pdf-editor-workspace.test.mjs
git commit -m "fix(pdf): improve mobile text inspector"
```

### Task 2: Add verified embedded Unicode fonts for text overlays

**Files:**
- Modify: `pdf-editor.html`
- Modify: `pdf-editor.js`
- Create: `assets/fonts/NOTO-FONTS-LICENSE.txt`
- Create: `assets/fonts/NotoSansDevanagari-Regular.ttf` (proposed; verify upstream file and license before adding)
- Create: `assets/fonts/NotoSansDevanagari-Bold.ttf` (proposed; verify upstream file and license before adding)
- Create: `assets/fonts/NotoNastaliqUrdu-Regular.ttf` (proposed; verify upstream file and license before adding)
- Create: `tests/pdf-editor-fonts.test.mjs`

**Interfaces:**
- Add `window.KAGZIPdfFonts` with `loadForText(text, style)` returning `{ font, script, direction, family }` or a clear unsupported-script error.
- Add an export helper `embedOverlayFont(pdfDoc, text, style)` that embeds the selected font into the current PDF document and returns a pdf-lib font object plus the text prepared for drawing.
- Preserve the existing Latin StandardFonts fallback for Latin-only strings.

- [ ] **Step 1: Add focused failing tests**

Add tests for:
- Latin text selecting the existing StandardFonts fallback.
- Devanagari text selecting the Devanagari font asset.
- Urdu/Arabic-range text selecting the Urdu font asset and RTL direction metadata.
- Missing font bytes producing a visible, actionable error rather than drawing blank glyphs.
- The editor HTML loading the fontkit integration before `pdf-editor.js`.
- Export helper rejecting a complex-script sample if shaping/bidi support is unavailable rather than silently emitting broken output.

- [ ] **Step 2: Verify the relevant failure**

Run: `node --test tests/pdf-editor-fonts.test.mjs`

Expected: tests fail because no Unicode font loader or embedded-font export path exists.

- [ ] **Step 3: Implement the minimum behavior**

- Verify the upstream Noto font files and their SIL Open Font License terms; retain the license text and source attribution in the repository.
- Use a browser-compatible fontkit build compatible with pdf-lib 1.17.1 and load it before editor initialization.
- Fetch font assets locally from the KAGZI origin only when the user exports text that requires them; cache loaded bytes in memory for the current page session.
- Use fontkit shaping for Devanagari and apply a Unicode bidirectional ordering step for Urdu before passing text to pdf-lib. Do not infer support from glyph coverage alone.
- If the selected font does not provide a tested shaping path, stop export for that text and display the exact unsupported-script message; keep the user-entered text in the field.
- Keep font selection explicit in the inspector, with an automatic script choice for mixed text only when the entire string is supported by the chosen pipeline.
- Keep font embedding client-side and do not transmit document text or font bytes to a server.
- Avoid embedding every font in every PDF; embed only the font(s) used by actual overlay text.
- Keep the current white-mask replacement behavior and its documented limitations; do not imply that font embedding makes the original text disappear from the PDF content stream.

- [ ] **Step 4: Verify the focused pass**

Run: `node --test tests/pdf-editor-fonts.test.mjs`

Expected: script selection, font loading failures, and fallback cases pass deterministically.

- [ ] **Step 5: Run affected integration checks**

Run: `node --check pdf-editor.js && node --test tests/pdf-editor-render-audit.mjs`

Expected: editor syntax is valid and existing render-metrics tests remain green. In a browser, export a Latin, Hindi, and Urdu sample and reopen each output with PDF.js; confirm visible glyph shaping, line direction, page count, and no blank/missing glyphs.

- [ ] **Step 6: Commit the passing deliverable**

```bash
git add pdf-editor.html pdf-editor.js assets/fonts tests/pdf-editor-fonts.test.mjs
git commit -m "feat(pdf): embed verified Hindi and Urdu fonts"
```

### Task 3: Clarify visual replacement and verify exported PDF output

**Files:**
- Modify: `pdf-editor.html`
- Modify: `pdf-editor.js`
- Modify: `pdf-editor.css`
- Modify: `tests/pdf-editor-workspace.test.mjs`
- Create: `tests/pdf-editor-export.test.mjs`
- Modify: `tests/mobile-acceptance.md`

**Interfaces:**
- Keep `textEdits` as the editor's overlay edit metadata; no new claim of native PDF text rewriting.
- Add `window.KAGZIPdfExportAudit` with a testable `validatePdfBytes(bytes, expectedPageCount, PDFLib)` function returning `{ valid, pageCount, reason }`.
- Export status messages distinguish successful visible overlay export from native text-stream rewriting.

- [ ] **Step 1: Add focused failing tests**

Add tests that assert:
- The UI calls the action **Visual text replacement** and explains that original PDF text may remain searchable/extractable.
- The UI explicitly says this is not secure redaction.
- Export validation rejects empty/corrupt bytes and a zero-page PDF.
- Export validation accepts a valid PDF with the expected page count.
- Export success text does not claim that the original PDF text was rewritten.
- The mobile acceptance checklist includes keyboard-open, Hindi/Urdu export, and reopened-output checks.

- [ ] **Step 2: Verify the relevant failure**

Run: `node --test tests/pdf-editor-export.test.mjs tests/pdf-editor-workspace.test.mjs`

Expected: new semantic and export-audit assertions fail before implementation.

- [ ] **Step 3: Implement the minimum behavior**

- Update inspector labels and helper text to consistently say **Visual text replacement**.
- State that the original text stream can remain searchable/extractable and that the operation is not secure redaction.
- Keep adding text as a distinct action from replacing selected text.
- Before download, validate the saved bytes by reopening them with pdf-lib, checking non-zero page count and expected page count, then reopen the same bytes with PDF.js and render the current page before triggering the download.
- If validation or PDF.js reopening fails, do not download; show a specific failure message and preserve the working document.
- On success, say the visual overlay copy was exported and the original PDF file remains unchanged.
- Add mobile acceptance steps for keyboard focus, cancel/apply, export, and opening the exported file again.

- [ ] **Step 4: Verify the focused pass**

Run: `node --test tests/pdf-editor-export.test.mjs tests/pdf-editor-workspace.test.mjs`

Expected: semantic disclosure and export validation tests pass.

- [ ] **Step 5: Run affected integration checks**

Run:
```bash
node --check pdf-editor.js
node --test tests/pdf-editor-workspace.test.mjs tests/pdf-editor-render-audit.mjs tests/pdf-editor-export.test.mjs
```

Expected: all focused editor tests pass. Then run the existing workflow-equivalent commands:
```bash
node --check pdf-ocr.js
node --check pdf-scanner.js
node --check pdf-server-adapter.js
node --test tests/image-text-editor.test.mjs
```

Expected: all affected JavaScript parses and existing image-editor tests remain green.

- [ ] **Step 6: Commit the passing deliverable**

```bash
git add pdf-editor.html pdf-editor.css pdf-editor.js tests/pdf-editor-workspace.test.mjs tests/pdf-editor-export.test.mjs tests/mobile-acceptance.md
git commit -m "fix(pdf): clarify replacement and verify exports"
```

## Manual release verification

- [ ] Open the feature-branch preview in Android Chrome at 360 px and 390 px widths.
- [ ] Open a PDF, select existing text, edit it, cancel, then repeat and apply.
- [ ] Add new text separately from replacing selected text.
- [ ] Focus the text field with the Android keyboard open; confirm the field and actions remain visible and no horizontal scrolling is required.
- [ ] Export a PDF and reopen the downloaded file in the editor or a PDF reader.
- [ ] Test one Latin, one Hindi, and one Urdu sample; record the exact browser/device and result.
- [ ] Confirm the source PDF is unchanged.
- [ ] Do not merge PR #37 or claim production deployment until the user separately approves.

## Unresolved product decisions

- Whether Urdu Nastaliq is a mandatory supported output or whether the first release may support only the tested Naskh/Arabic shaping path. This changes font asset choice and acceptance samples.
- Whether the user expects the PDF's original text to be securely erased. The approved first iteration is visual replacement only; true native rewriting and secure redaction remain outside this plan.
