# Dashboard route and availability audit

This audit is intentionally conservative: catalogue presence does not mean a tool is working.

## Dashboard destinations

| Dashboard entry | Destination | Expected behavior |
|---|---|---|
| All tools / View all tools | `modules.html` | Open the complete catalogue |
| PDF tools | `index.html#pdfWorkbench` | Open the PDF workspace |
| Scanner & OCR | `index.html#scanner` | Open the OCR workspace |
| Photo studio | `index.html#photoStudio` | Open image resize/export |
| AI assistant | `modules.html?category=ai` | Filter the AI catalogue |
| Office tools | `modules.html?category=photo` | Filter Photo & Office |
| Government documents | `modules.html?category=gov` | Filter government guides |
| Forms & signatures | `modules.html?category=manage` | Filter forms and management |
| Document locker | `modules.html?category=storage` | Filter storage tools |
| Settings | `modules.html?category=storage` | Open storage/settings-related catalogue |

## Availability policy

A module is labelled **Available** only when it routes to an existing, implemented browser workflow. **In development** means a partial workflow or supporting page exists but is not a complete tool. **Coming soon** means there is no complete usable workflow.

Current available IDs are assigned explicitly in `modules.js`; all other IDs are classified as in-development or coming-soon. Re-audit before changing any status.

## Important limits

- The module count (65) is a catalogue count, not a count of 65 finished tools.
- Browser-local workflows do not upload files to KAGZI.
- The generic document draft panel is not proof that each government, office, or AI module is implemented.
- Android and desktop end-to-end checks remain a manual acceptance requirement.
