# KAGZI All-in-One PDF Studio — Implementation Plan

## Goal
Provide one mobile-friendly entry point for every verified PDF workflow while preserving existing standalone tools and stating where document state is not shared yet.

## Scope
- Add `pdf-studio.html` as the central PDF tools hub.
- Inventory and link only verified existing workflows: PDF editor, OCR, camera scanner, merge, split, page management, watermark/page numbers, compression guide, JPG/PNG-to-PDF guide, and image text editor.
- Route the PDF Tools directory's main CTA to the hub.
- Add navigation/availability regression tests.
- Keep original tools and URLs intact; no main-branch direct edits.

## Important implementation boundary
This phase consolidates discovery/navigation, not a single shared in-memory PDF session across separate pages. The hub must explicitly disclose that moving between standalone tools may require selecting the file again. A later phase can unify compatible operations behind one shared editor state after each tool is ported and verified.

## Acceptance
- Hub is responsive on phone and desktop.
- All cards link to existing paths.
- Directory primary CTA opens hub.
- No inactive or invented features are advertised.
- Existing PDF editor tests remain untouched.
- GitHub Actions runs the new static hub test.

## Verification
Run `node --test tests/pdf-studio-hub.test.mjs tests/pdf-editor-workspace.test.mjs` and the existing PDF Studio syntax workflow checks.
