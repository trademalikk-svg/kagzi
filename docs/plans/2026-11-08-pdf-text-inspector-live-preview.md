# PDF Text Inspector Live Preview Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the KAGZI PDF Text Inspector visually match the approved layout and provide immediate, undoable preview changes for supported text selections.

**Architecture:** Keep the existing PDF.js canvas and pdf-lib export pipeline. Treat Inspector input as a draft style model applied to the selected text-layer span immediately; commit the draft as one textEdits record on Apply, then regenerate the working PDF preview from the exported bytes. Keep native source-object replacement isolated behind its existing fail-closed gate until browser Save/Reopen tests prove it.

**Tech Stack:** Vanilla JavaScript, PDF.js 3.11, pdf-lib 1.17, CSS, Node test runner, GitHub Actions / Playwright.

## Global Constraints

- Browser-local processing only; no paid API, server upload, or recurring service.
- Production `main` and Cloudflare Pages deployment remain unchanged.
- An overlay edit must never be described as native source-text replacement.
- Unsupported native replacement remains fail-closed.
- Preview changes are immediate; Apply commits; export/reopen preserves committed edits.
- Desktop Inspector is on the right; mobile Inspector is above the PDF canvas and collapsible.

---

### Task 1: Add focused regression tests for inspector draft preview

**Files:**
- Create: `tests/pdf-text-inspector-preview.test.js`
- Modify: existing PDF editor test workflow only if required by its test discovery pattern.

**Interfaces:**
- Test the editor's exported test seam `window.KAGZIPdfInspectorPreview` with `createDraft`, `updateDraft`, `applyDraftToElement`, and `serializeDraft`.
- Production editor will expose this pure helper without changing the PDFium native gate.

- [ ] **Step 1: Add the focused failing test**

Test that each draft property (text, font size, family, bold, italic, underline, strike-through, alignment, colour, background, opacity) is serialized and reflected on a preview span immediately; changing one property preserves all others.

- [ ] **Step 2: Verify the relevant failure**

Run: `node --test tests/pdf-text-inspector-preview.test.js`
Expected: fails because the preview helper does not exist yet.

- [ ] **Step 3: Implement the minimum behavior**

Add a pure draft helper in `pdf-editor.js`; bind Inspector input/change events to the selected span; maintain committed values separately from draft values; ensure selection changes reset the draft to the newly selected object. Do not mutate PDF bytes on every keystroke.

- [ ] **Step 4: Verify the focused pass**

Run: `node --test tests/pdf-text-inspector-preview.test.js`
Expected: all property and preservation assertions pass.

- [ ] **Step 5: Run the affected integration check**

Run: `node --test`
Expected: existing Node tests remain green.

- [ ] **Step 6: Commit the passing deliverable**

```bash
git add pdf-editor.js tests/pdf-text-inspector-preview.test.js
git commit -m "feat: add live PDF text inspector preview"
```

### Task 2: Commit Inspector styling and responsive layout

**Files:**
- Modify: `pdf-editor.html`
- Modify: `pdf-editor.css`
- Modify: `pdf-editor.js`

**Interfaces:**
- Existing IDs `pdfInspector`, `inspectorText`, `inspectorFontSize`, `inspectorFontColor`, `inspectorFontFamily`, `inspectorOpacity`, `inspectorAlignment`, `inspectorBold`, and `applyTextEdit` remain stable.
- Add stable IDs for italic, underline, strike-through, background fill, and inspector collapse toggle.

- [ ] **Step 1: Add the focused failing test**

Assert the HTML includes the additional controls and collapse toggle, and CSS places the inspector in the right desktop column and before the document canvas on mobile.

- [ ] **Step 2: Verify the relevant failure**

Run: `node --test tests/pdf-text-inspector-preview.test.js`
Expected: fails on missing controls/layout contract.

- [ ] **Step 3: Implement the minimum behavior**

Replace the existing generic properties card with the approved Text Inspector card. On mobile, use a collapsible Inspector section that precedes the canvas in reading order; keep it expanded by default when a text selection is made.

- [ ] **Step 4: Verify the focused pass**

Run: `node --test tests/pdf-text-inspector-preview.test.js`
Expected: Inspector structure and responsive contract assertions pass.

- [ ] **Step 5: Run the affected integration check**

Run: `node --test`
Expected: no existing editor regressions.

- [ ] **Step 6: Commit the passing deliverable**

```bash
git add pdf-editor.html pdf-editor.css pdf-editor.js tests/pdf-text-inspector-preview.test.js
git commit -m "feat: redesign responsive PDF text inspector"
```

### Task 3: Commit Apply, undo, export, and reopen behavior

**Files:**
- Modify: `pdf-editor.js`
- Modify: `tests/pdf-text-inspector-preview.test.js`
- Modify: PDF editor browser regression test file identified from the repository test workflow.

**Interfaces:**
- `selectedText` remains the selected text-layer target.
- `textEdits` remains the export source for overlay-based edits.
- Apply consumes the current Inspector draft and creates exactly one undoable edit.

- [ ] **Step 1: Add the focused failing test**

Verify preview updates before Apply; Apply records one committed edit; Undo restores the previous PDF and preview; export contains the replacement overlay; reopening exported bytes renders the committed text and style.

- [ ] **Step 2: Verify the relevant failure**

Run: `node --test tests/pdf-text-inspector-preview.test.js`
Expected: current implementation fails live-preview and full-style persistence assertions.

- [ ] **Step 3: Implement the minimum behavior**

Apply snapshots once, commits the draft into `textEdits`, updates working bytes through the existing pdf-lib overlay export path, and reloads the PDF.js document. Persist style fields used by export, including opacity, fill, alignment, and supported text decorations. Preserve fail-closed behavior for native PDFium replacement.

- [ ] **Step 4: Verify the focused pass**

Run: `node --test tests/pdf-text-inspector-preview.test.js`
Expected: apply/undo/export/reopen tests pass.

- [ ] **Step 5: Run the affected integration check**

Run: `node --test` and the repository's PDF Editor Checks / Playwright browser preview workflow.
Expected: all relevant tests pass; exported PDF reloads without page errors.

- [ ] **Step 6: Commit the passing deliverable**

```bash
git add pdf-editor.js tests/pdf-text-inspector-preview.test.js
git commit -m "fix: persist PDF text inspector edits"
```

## Unresolved externally observable decisions

- Native replacement of arbitrary existing PDF text remains outside this Inspector delivery and stays disabled until separate browser runtime, compatibility, and Save/Reopen gates pass.
- Italic, underline, strike-through, and background fill are preview/export decorations for overlay edits; they do not change the underlying font program or source PDF text objects.
