# Hindi scanned-PDF OCR accuracy check

This is a repeatable accuracy check, not a claim that OCR has already passed on real scans.

1. Use a non-sensitive Hindi scanned PDF with a clear, manually verified transcription for the same page.
2. Select Hindi in the PDF Editor OCR language control and run OCR on that page.
3. Compare the OCR output with the verified transcription using `window.KAGZIPdfOcrScore(actual, reference)`.
4. Record Character Error Rate (CER) and Word Error Rate (WER). The scorer normalizes Unicode to NFC and counts grapheme clusters, so dependent vowel marks and nukta combinations are not split into unrelated code points.
5. Repeat for clean print, low-resolution scan, skewed page, and mixed Hindi/English. Keep separate results per scan condition.

Do not publish or commit personal documents. The PDF should remain local to the browser. A real sample PDF and its verified transcription are still required before reporting OCR accuracy.
