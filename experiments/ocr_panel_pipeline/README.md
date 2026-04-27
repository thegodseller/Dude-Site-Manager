# Experimental OCR Panel Pipeline

This patch preserves an experimental OCR rewrite for `daily_panel_report.py`.

It is not production-ready.

The patch changes ROI definitions, preprocessing, OCR decoder, output path, CLI args, debug artifact behavior, and multi-source flow.

It should be split into smaller commits before production use.

Syntax check had passed before restore:

```bash
python3 -m py_compile daily_panel_report.py
```
