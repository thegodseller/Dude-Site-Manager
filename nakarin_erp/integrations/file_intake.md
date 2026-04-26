# File Intake Integration

## Candidate Detection Layer

- Google Magika is approved as a candidate file type detection layer for DuDe and Nakarin ERP.
- Magika should be used to detect file content type from uploaded bytes.
- Magika must not be treated as antivirus or malware scanning.

## Local Evaluation Support

- Magika can be installed through `tools/install_magika.sh`.
- Magika can be evaluated through `tools/eval_magika.sh`.
- The antivirus warning still applies: Magika is not a malware scanner.

## Recommended Use Cases

- LINE uploaded images
- LIFF form attachments
- PDF documents
- CSV and Excel imports
- employee registration photos
- production gauge images
- quality-check attachments

## Safe Intake Flow

1. Upload received.
2. File saved to temporary storage.
3. Magika detects likely file content type.
4. Intake policy checks the detected type against the business allowlist.
5. File moves to approved storage or quarantine.

## Initial Allowed Types

- jpeg
- png
- pdf
- csv
- xlsx
- docx
- plain text

## Policy Notes

- Exact production allowlist is `UNKNOWN: requires owner confirmation`.
- Exact quarantine policy is `UNKNOWN: requires owner confirmation`.
- Additional controls such as antivirus, document sanitization, OCR, or PII review should be treated as separate layers.
