# KAGZI dashboard and studio acceptance

## Automated checks
- [ ] Run `node --check script.js`.
- [ ] Run `node --test tests/dashboard-audit.mjs tests/studio-ui-audit.mjs`.
- [ ] Confirm 65 catalogue IDs are unique and classified.
- [ ] Confirm studio IDs are unique and labels resolve.

## Android Chrome (360–390 px)
- [ ] Open the dashboard directly; open and close the sidebar.
- [ ] Tap PDF Studio and Photo Studio cards and use browser Back.
- [ ] Confirm studio navigation links scroll to the correct tool cards.
- [ ] Confirm no horizontal overflow or dead tap targets.
- [ ] Photo: resize, format conversion, passport presets, crop, rotate and target-KB compression.
- [ ] Photo: request AI background removal, verify CDN/model notice and manual colour fill.
- [ ] PDF: preview, merge, split, extract, compress, remove, rotate, reorder, image-to-PDF, PDF-to-images and add-text.
- [ ] Confirm clear errors for corrupt files, missing selections and unavailable libraries.

## Desktop Chromium
- [ ] Repeat all Photo/PDF workflow checks.
- [ ] Confirm previews and downloads work and originals remain unchanged.

## Privacy and release gate
- [ ] Confirm files are never automatically uploaded to KAGZI.
- [ ] Confirm AI model assets load only after the user requests background removal.
- [ ] Confirm compression warning explains that PDF text may no longer be selectable.
- [ ] Verify common passport size presets are clearly labelled as starting sizes, not official guarantees.
- [ ] Record real Android and desktop results.
- [ ] Do not merge to `main` or launch until the user reviews the preview and approves.
