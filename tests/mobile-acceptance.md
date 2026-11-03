# KAGZI dashboard mobile and desktop acceptance

## Automated audit
- [ ] Run `node --test tests/dashboard-audit.mjs`
- [ ] Confirm all 65 catalogue IDs are unique and classified.
- [ ] Confirm dashboard in-page links resolve and element IDs are unique.

## Android Chrome (360–390 px)
- [ ] Open the dashboard directly.
- [ ] Open and close the sidebar.
- [ ] Tap every sidebar entry and verify the intended page/section.
- [ ] Tap every quick-access category card.
- [ ] Confirm filtered categories appear correctly in `modules.html`.
- [ ] Open each module labelled Available and verify its actual workspace.
- [ ] Refresh and use browser Back.
- [ ] Confirm no dead tap target or horizontal overflow.

## Desktop Chromium
- [ ] Repeat category, sidebar, quick-access, refresh and Back checks.
- [ ] Search modules and filter each category.
- [ ] Verify unavailable modules do not claim to be open tools.

## Existing workflow regression
- [ ] PDF merge
- [ ] PDF split / extract
- [ ] Image to PDF
- [ ] PDF compression (confirm raster/text-loss warning)
- [ ] Remove, rotate and reorder pages
- [ ] Add-text PDF overlay
- [ ] OCR image-to-text
- [ ] Photo resize and format export
- [ ] Document list and folder metadata
- [ ] Privacy checker

## Privacy and failure cases
- [ ] Confirm local file workflows do not upload automatically.
- [ ] Test unsupported or corrupt input and readable recovery messages.
- [ ] Test denied camera/file permissions where applicable.

## Release gate
- [ ] Record actual browser/device results.
- [ ] Review a Cloudflare Pages preview branch on Android.
- [ ] Do not merge to `main` or launch until the user reviews the preview.
