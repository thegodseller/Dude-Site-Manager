#!/usr/bin/env python3
"""
daily_panel_report.py — DuDe Daily Control Panel Report

Automated pipeline that runs at 05:00 via cron:
  1. Capture snapshot of the control panel
  2. Run OCR to extract 7-segment display values (4 rows × left/right)
  3. Format the report message
  4. POST to ag_negotiator for LINE push notification

Usage:
  python3 daily_panel_report.py                          # production run (NVR default)
  python3 daily_panel_report.py --dry-run                # send test data
  python3 daily_panel_report.py --source file --image-path /path/to/img.jpg
  python3 daily_panel_report.py --source nvr              # Hikvision IP camera
  python3 daily_panel_report.py --test-ocr-only           # capture + OCR only, no LINE push
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from datetime import datetime
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Configuration via environment variables (overridable)
# ---------------------------------------------------------------------------
NEGOTIATOR_URL = os.environ.get(
    "NEGOTIATOR_URL", "http://192.168.11.150:11112"
)
WATCHER_URL = os.environ.get(
    "WATCHER_URL", "http://127.0.0.1:8081"
)
SNAPSHOT_SOURCE = os.environ.get("SNAPSHOT_SOURCE", "nvr")  # file|nvr|camera

# Hikvision IP Camera (ISAPI)
NVR_SNAPSHOT_URL = os.environ.get(
    "NVR_SNAPSHOT_URL",
    "http://192.168.11.25/ISAPI/Streaming/channels/101/picture",
)
NVR_USERNAME = os.environ.get("NVR_USERNAME", "admin")
NVR_PASSWORD = os.environ.get("NVR_PASSWORD", "")
DEFAULT_IMAGE_PATH = os.environ.get("DEFAULT_IMAGE_PATH", "")

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
LOGS_DIR = PROJECT_DIR / "logs"
SNAPSHOT_DIR = PROJECT_DIR / "var" / "snapshots"

LOG = logging.getLogger("daily_panel_report")

# ---------------------------------------------------------------------------
# Step 1: Capture Snapshot
# ---------------------------------------------------------------------------

def capture_snapshot(
    source: str,
    image_path: str | None = None,
    nvr_url: str | None = None,
) -> Path:
    """
    Capture or retrieve a snapshot image of the control panel.

    Returns the path to the saved image file.
    """
    import cv2  # deferred import to keep startup light

    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = SNAPSHOT_DIR / f"panel_{timestamp}.jpg"

    if source == "file":
        src = Path(image_path or DEFAULT_IMAGE_PATH)
        if not src.exists():
            raise FileNotFoundError(f"Snapshot source file not found: {src}")
        img = cv2.imread(str(src))
        if img is None:
            raise ValueError(f"Could not decode image: {src}")
        cv2.imwrite(str(output_path), img)
        LOG.info("Snapshot loaded from file: %s → %s", src, output_path)

    elif source == "nvr":
        import requests
        from requests.auth import HTTPDigestAuth
        url = nvr_url or NVR_SNAPSHOT_URL
        if not url:
            raise ValueError("NVR URL not configured. Set NVR_SNAPSHOT_URL env or --nvr-url flag.")
        LOG.info("Requesting snapshot from Hikvision: %s", url)
        resp = requests.get(
            url,
            auth=HTTPDigestAuth(NVR_USERNAME, NVR_PASSWORD),
            timeout=15,
            stream=True,
        )
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "")
        if "image" not in content_type and "octet-stream" not in content_type:
            raise ValueError(f"Unexpected content-type from NVR: {content_type}")
        raw_bytes = resp.content
        if len(raw_bytes) < 1000:
            raise ValueError(f"NVR returned suspiciously small image ({len(raw_bytes)} bytes)")
        output_path.write_bytes(raw_bytes)
        LOG.info("Snapshot captured from NVR: %s → %s (%d bytes)", url, output_path, len(raw_bytes))

    elif source == "camera":
        # Use libcamera-still (Pi Camera)
        libcamera = shutil.which("libcamera-still")
        if not libcamera:
            raise RuntimeError("libcamera-still not found. Is Pi Camera connected?")
        result = subprocess.run(
            [libcamera, "-o", str(output_path), "--width", "1280", "--height", "720",
             "--timeout", "2000", "--nopreview"],
            capture_output=True, text=True, check=False,
        )
        if result.returncode != 0:
            raise RuntimeError(f"libcamera-still failed: {result.stderr.strip()}")
        LOG.info("Snapshot captured from Pi Camera → %s", output_path)

    else:
        raise ValueError(f"Unknown snapshot source: {source}")

    return output_path


# ---------------------------------------------------------------------------
# Step 1.5: Image Preprocessing for 7-Segment OCR
# ---------------------------------------------------------------------------

# Display regions in the 1920x1080 camera frame (3 rows × 2 columns).
# Each tuple is (x1, y1, x2, y2) — the bounding box of the LED digit area.
# These coordinates target the dark display windows where red 7-segment
# digits are shown. Adjust if camera angle changes.
#
# Layout from the image:
#   Row 1: INDICATOR (top-left)     | INDICATOR (top-right)
#   Row 2: TOTAL COUNTER (mid-left) | TOTAL COUNTER (mid-right)
#   Row 3: TOTAL COUNTER (bot-left) | TOTAL COUNTER (bot-right)
#
DISPLAY_REGIONS: list[tuple[str, int, int, int, int]] = [
    # (label, x1, y1, x2, y2)
    ("R1L", 875, 65, 1005, 145),
    ("R1R", 1100, 50, 1230, 130),
    ("R2L", 885, 250, 1005, 330),
    ("R2R", 1110, 235, 1230, 315),
    ("R3L", 895, 395, 1015, 475),
    ("R3R", 1120, 380, 1240, 460),
    ("R4L", 910, 540, 1030, 620),
    ("R4R", 1135, 525, 1255, 605),
]


def _preprocess_single_display(img_region, label: str) -> tuple[str, any]:
    """
    Preprocess a single cropped display region for OCR.

    Strategy for red LED 7-segment on dark background:
      1. Extract red channel (red LEDs are strongest in R channel)
      2. Threshold to isolate bright digits
      3. Invert for tesseract (dark text on white background)
      4. Morphological cleanup

    Returns (label, processed_image).
    """
    import cv2
    import numpy as np

    # Red LED digits: the R channel has the strongest signal
    if len(img_region.shape) == 3:
        # Extract just the red channel
        red_ch = img_region[:, :, 2]  # BGR format → channel 2 = Red
    else:
        red_ch = img_region

    # Threshold: red LED pixels are bright in the R channel
    # Use a relatively high threshold to isolate the glowing digits
    _, binary = cv2.threshold(red_ch, 150, 255, cv2.THRESH_BINARY)

    # Invert: tesseract expects dark text on white background
    inverted = cv2.bitwise_not(binary)

    # Morphological cleanup: close small gaps in digit strokes
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    cleaned = cv2.morphologyEx(inverted, cv2.MORPH_CLOSE, kernel, iterations=1)

    # Remove small noise
    kernel_open = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel_open, iterations=1)

    # Scale up for better OCR (tesseract works better with larger text)
    h, w = cleaned.shape[:2]
    scaled = cv2.resize(cleaned, (w * 3, h * 3), interpolation=cv2.INTER_NEAREST)

    return label, scaled


def preprocess_for_ocr(image_path: Path) -> Path:
    """
    Preprocess a control panel image for 7-segment OCR.

    Crops each of the 6 display regions, processes them individually
    for red-LED 7-segment extraction, and stitches them into a clean
    vertical layout that tesseract can read row by row.

    Returns path to the preprocessed composite image.
    """
    import cv2
    import numpy as np

    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Could not read image for preprocessing: {image_path}")

    h, w = img.shape[:2]
    LOG.info("Original image size: %dx%d", w, h)

    # Process each display region
    processed_regions: list[tuple[str, any]] = []
    for label, x1, y1, x2, y2 in DISPLAY_REGIONS:
        # Clamp coordinates to image bounds
        x1c = max(0, min(x1, w))
        y1c = max(0, min(y1, h))
        x2c = max(0, min(x2, w))
        y2c = max(0, min(y2, h))

        if x2c - x1c < 10 or y2c - y1c < 10:
            LOG.warning("Display region %s too small after clamping, skipping", label)
            continue

        crop = img[y1c:y2c, x1c:x2c]
        label_result, processed = _preprocess_single_display(crop, label)
        processed_regions.append((label_result, processed))

        # Also save individual crops for debugging
        crop_path = image_path.with_name(f"{image_path.stem}_crop_{label}.png")
        cv2.imwrite(str(crop_path), processed)
        LOG.info("Saved crop %s: region=(%d,%d,%d,%d) → %s", label, x1c, y1c, x2c, y2c, crop_path)

    if not processed_regions:
        raise ValueError("No display regions could be extracted from the image")

    # Stitch into composite: arrange as rows for tesseract
    # Each row: [Left display]  [spacing]  [Right display]
    SPACER_WIDTH = 100
    composite_rows = []

    for i in range(0, len(processed_regions), 2):
        left_label, left_img = processed_regions[i]
        if i + 1 < len(processed_regions):
            right_label, right_img = processed_regions[i + 1]
        else:
            right_img = np.ones_like(left_img) * 255  # white placeholder

        # Match heights
        max_h = max(left_img.shape[0], right_img.shape[0])
        left_padded = np.ones((max_h, left_img.shape[1]), dtype=np.uint8) * 255
        left_padded[:left_img.shape[0], :] = left_img
        right_padded = np.ones((max_h, right_img.shape[1]), dtype=np.uint8) * 255
        right_padded[:right_img.shape[0], :] = right_img

        spacer = np.ones((max_h, SPACER_WIDTH), dtype=np.uint8) * 255
        row = np.hstack([left_padded, spacer, right_padded])
        composite_rows.append(row)

        # Add vertical spacer between rows
        if i + 2 < len(processed_regions):
            v_spacer = np.ones((30, row.shape[1]), dtype=np.uint8) * 255
            composite_rows.append(v_spacer)

    # Match all row widths
    max_w = max(r.shape[1] for r in composite_rows)
    padded_rows = []
    for r in composite_rows:
        if r.shape[1] < max_w:
            pad = np.ones((r.shape[0], max_w - r.shape[1]), dtype=np.uint8) * 255
            r = np.hstack([r, pad])
        padded_rows.append(r)

    composite = np.vstack(padded_rows)

    # Add white border for tesseract
    border = 20
    bordered = cv2.copyMakeBorder(
        composite, border, border, border, border,
        cv2.BORDER_CONSTANT, value=255,
    )

    preprocessed_path = image_path.with_name(image_path.stem + "_preprocessed.png")
    cv2.imwrite(str(preprocessed_path), bordered)
    LOG.info("Preprocessed composite saved: %s (%dx%d)", preprocessed_path, bordered.shape[1], bordered.shape[0])

    return preprocessed_path


# ---------------------------------------------------------------------------
# Step 2: Run OCR
# ---------------------------------------------------------------------------

def run_ocr_via_watcher(image_path: Path) -> str:
    """Call the watcher service /api/ocr endpoint."""
    import requests

    url = f"{WATCHER_URL}/api/ocr"
    try:
        with open(image_path, "rb") as f:
            resp = requests.post(url, files={"file": f}, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        if data.get("status") != "ok":
            raise RuntimeError(f"Watcher OCR error: {data.get('error', data.get('summary', 'unknown'))}")
        return data.get("text", "")
    except Exception as exc:
        LOG.warning("Watcher OCR failed, will try direct tesseract: %s", exc)
        return ""


def run_ocr_direct(image_path: Path) -> str:
    """Call tesseract CLI directly as fallback."""
    tesseract_bin = shutil.which("tesseract")
    if not tesseract_bin:
        raise RuntimeError(
            "tesseract is not installed. Install with: sudo apt install tesseract-ocr"
        )
    result = subprocess.run(
        [tesseract_bin, str(image_path), "stdout",
         "--psm", "6",  # assume uniform block of text
         "-c", "tessedit_char_whitelist=0123456789.-+ "],
        capture_output=True, text=True, check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"tesseract failed: {result.stderr.strip()}")
    return result.stdout.strip()


def run_ocr_single_region(image_path: Path) -> str:
    """OCR a single cropped display region (single text line, digits only)."""
    tesseract_bin = shutil.which("tesseract")
    if not tesseract_bin:
        raise RuntimeError("tesseract not installed")
    result = subprocess.run(
        [tesseract_bin, str(image_path), "stdout",
         "--psm", "7",  # treat image as a single text line
         "-c", "tessedit_char_whitelist=0123456789.-"],
        capture_output=True, text=True, check=False,
    )
    text = result.stdout.strip()
    # Clean: remove stray spaces/dots that aren't part of a number
    text = re.sub(r"\s+", "", text)  # remove all whitespace
    text = re.sub(r"^\.+", "", text)  # strip leading dots
    text = re.sub(r"\.+$", "", text)  # strip trailing dots
    text = re.sub(r"\.{2,}", ".", text)  # collapse multiple dots
    return text or "0"


def run_ocr(image_path: Path, skip_preprocess: bool = False) -> tuple[list[tuple[str, str]], Path]:
    """
    Run per-region OCR on the control panel image.

    Preprocesses the image, then OCR's each display crop individually
    for maximum accuracy.

    Returns (list of (label, value) pairs, preprocessed_composite_path).
    """
    # Preprocess: creates individual crop files + composite
    if not skip_preprocess:
        processed_path = preprocess_for_ocr(image_path)
    else:
        processed_path = image_path

    # OCR each individual crop
    results: list[tuple[str, str]] = []
    for label, *_ in DISPLAY_REGIONS:
        crop_file = image_path.with_name(f"{image_path.stem}_crop_{label}.png")
        if crop_file.exists():
            value = run_ocr_single_region(crop_file)
            LOG.info("OCR region %s: %r", label, value)
            results.append((label, value))
        else:
            LOG.warning("Crop file missing for region %s", label)
            results.append((label, "---"))

    return results, processed_path


# ---------------------------------------------------------------------------
# Step 3: Build Rows from Per-Region OCR Results
# ---------------------------------------------------------------------------

def build_rows_from_regions(region_results: list[tuple[str, str]]) -> list[tuple[str, str]]:
    """
    Convert per-region OCR results into display rows.

    Input: [("R1L", "0"), ("R1R", "0"), ("R2L", "0"), ...]
    Output: [("0", "0"), ("0", "0"), ("0", "0")]  — 3 rows
    """
    # Group by row number
    row_map: dict[str, dict[str, str]] = {}
    for label, value in region_results:
        # label format: "R1L", "R1R", "R2L", etc.
        row_key = label[:2]  # "R1", "R2", "R3"
        side = label[2]      # "L" or "R"
        if row_key not in row_map:
            row_map[row_key] = {}
        row_map[row_key][side] = value

    # Build ordered rows
    rows: list[tuple[str, str]] = []
    for rk in sorted(row_map.keys()):
        left = row_map[rk].get("L", "---")
        right = row_map[rk].get("R", "---")
        rows.append((left, right))

    # Pad to at least 4 rows
    while len(rows) < 4:
        rows.append(("---", "---"))

    return rows


# For backward compatibility: parse from raw text (fallback)
def parse_7segment(ocr_text: str) -> list[tuple[str, str]]:
    """
    Parse OCR text into rows of (left_value, right_value).
    Fallback for when per-region OCR is not available.
    """
    rows: list[tuple[str, str]] = []
    lines = [line.strip() for line in ocr_text.strip().splitlines() if line.strip()]

    for line in lines:
        parts = re.split(r"[\s\t|/,;]+", line)
        nums = [p for p in parts if re.match(r"^[-+]?\d+\.?\d*$", p)]
        if len(nums) >= 2:
            rows.append((nums[0], nums[1]))
        elif len(nums) == 1:
            rows.append((nums[0], "---"))

    while len(rows) < 3:
        rows.append(("---", "---"))

    return rows


# ---------------------------------------------------------------------------
# Step 3.5: Save Latest Results (for WebUI)
# ---------------------------------------------------------------------------

def save_ocr_result_json(rows: list[tuple[str, str]], output_path: str | None = None) -> None:
    """Save the latest OCR results as a JSON file for the dashboard."""
    # Default to a path accessible by the WebUI
    path = output_path or "/home/pi/DuDe_Watcher/last_ocr_report.json"
    
    # In this environment, we might need to use a different path
    if not os.path.exists(os.path.dirname(path)):
        # Fallback for Dell server simulation
        path = "/home/thegodseller/DuDe_Hawaiian/tHe_DuDe_WebUI/dude_hawaiian_webui/public/last_ocr_report.json"
        os.makedirs(os.path.dirname(path), exist_ok=True)

    data = {
        "timestamp": datetime.now().isoformat(),
        "date": datetime.now().strftime("%d-%m-%Y"),
        "rows": [{"left": r[0], "right": r[1]} for r in rows],
        "status": "online"
    }
    
    try:
        with open(path, "w") as f:
            json.dump(data, f, indent=4)
        LOG.info("OCR result JSON dumped to %s", path)
    except Exception as e:
        LOG.error("Failed to dump OCR JSON: %s", e)


# ---------------------------------------------------------------------------
# Step 4: Format Report
# ---------------------------------------------------------------------------

def format_report(
    date_str: str,
    rows: list[tuple[str, str]],
    is_test: bool = False,
) -> str:
    """
    Format the report message.

    Panel layout (3 rows × 2 columns):
      {DD-MM-YYYY}
      {row1_left}          {row1_right}

      {row2_left}          {row2_right}
      {row3_left}          {row3_right}
    """
    prefix = "[Test Run]\n" if is_test else ""
    spacer = "    "  # 4 spaces for cleaner alignment

    lines = [f"{prefix}{date_str}"]
    for row in rows:
        lines.append(f"{row[0]}{spacer}{row[1]}")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Step 5: Send to ag_negotiator
# ---------------------------------------------------------------------------

def send_to_negotiator(message: str, negotiator_url: str | None = None) -> dict[str, Any]:
    """POST the formatted report to ag_negotiator for LINE push."""
    import requests

    url = negotiator_url or NEGOTIATOR_URL
    payload = {
        "message": message,
        "channel": "line",
        "source": "pi5_watcher",
        "type": "daily_panel_report",
        "timestamp": datetime.now().isoformat(),
    }

    push_url = url.rstrip("/") + "/push"
    LOG.info("Sending report to negotiator: %s", push_url)
    LOG.debug("Payload: %s", json.dumps(payload, ensure_ascii=False, indent=2))

    try:
        resp = requests.post(
            push_url,
            json=payload,
            timeout=15,
            headers={"Content-Type": "application/json"},
        )
        resp.raise_for_status()
        result = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {"status": "sent", "http_code": resp.status_code}
        LOG.info("Negotiator response: %s", result)
        return result
    except Exception as exc:
        LOG.error("Failed to send to negotiator: %s", exc)
        return {"status": "error", "error": str(exc)}


# ---------------------------------------------------------------------------
# Main Pipeline
# ---------------------------------------------------------------------------

def generate_mock_data() -> tuple[str, list[tuple[str, str]]]:
    """Generate mock 7-segment data for dry-run testing."""
    date_str = datetime.now().strftime("%d-%m-%Y")
    rows = [
        ("123.4", "567.8"),
        ("90.1", "234.5"),
        ("678.9", "12.3"),
        ("456.7", "890.1"),
    ]
    return date_str, rows


def run_pipeline(
    source: str = "nvr",
    image_path: str | None = None,
    nvr_url: str | None = None,
    negotiator_url: str | None = None,
    dry_run: bool = False,
    test_ocr_only: bool = False,
) -> int:
    """Execute the full daily panel report pipeline."""

    mode_label = "TEST" if dry_run else ("OCR-TEST" if test_ocr_only else "PRODUCTION")
    LOG.info("=" * 60)
    LOG.info("Daily Panel Report Pipeline — %s", datetime.now().isoformat())
    LOG.info("Mode: %s | Source: %s | Dry-run: %s | OCR-test: %s", mode_label, source, dry_run, test_ocr_only)
    LOG.info("=" * 60)

    date_str = datetime.now().strftime("%d-%m-%Y")

    if dry_run and not test_ocr_only:
        # Use mock data for testing
        LOG.info("DRY RUN: Using mock 7-segment data")
        date_str, rows = generate_mock_data()
        message = format_report(date_str, rows, is_test=True)
    else:
        # Step 1: Capture
        LOG.info("Step 1: Capturing snapshot (source=%s)", source)
        snapshot_path = capture_snapshot(source, image_path, nvr_url)
        LOG.info("Snapshot saved: %s", snapshot_path)

        # Step 2: Per-region OCR (with preprocessing)
        LOG.info("Step 2: Running per-region OCR with preprocessing")
        region_results, preprocessed_path = run_ocr(snapshot_path)
        LOG.info("Preprocessed composite: %s", preprocessed_path)
        for label, value in region_results:
            LOG.info("  Region %s → %s", label, value)

        if test_ocr_only:
            # Just show OCR results, don't send
            LOG.info("=" * 60)
            LOG.info("TEST-OCR-ONLY: Per-region OCR results")
            for label, value in region_results:
                LOG.info("  %s: %r", label, value)
            rows = build_rows_from_regions(region_results)
            for i, (left, right) in enumerate(rows, 1):
                LOG.info("  Parsed Row %d: %-12s | %s", i, left, right)
            message = format_report(date_str, rows, is_test=True)
            LOG.info("Formatted report:\n%s", message)
            LOG.info("=" * 60)
            LOG.info("Snapshot: %s", snapshot_path)
            LOG.info("Preprocessed: %s", preprocessed_path)
            LOG.info("Done. Review images and OCR output above.")
            return 0

        # Step 3: Build rows from per-region results
        LOG.info("Step 3: Building rows from per-region OCR")
        rows = build_rows_from_regions(region_results)
        for i, (left, right) in enumerate(rows, 1):
            LOG.info("  Row %d: %s | %s", i, left, right)

        # Step 4: Format
        message = format_report(date_str, rows)
        
        # Step 4.5: Dump JSON for WebUI
        save_ocr_result_json(rows)

    LOG.info("Formatted report:\n%s", message)

    # Step 5: Send
    LOG.info("Step 5: Sending to negotiator")
    result = send_to_negotiator(message, negotiator_url)

    if result.get("status") == "error":
        LOG.error("Pipeline completed with send error: %s", result.get("error"))
        return 1

    LOG.info("Pipeline completed successfully")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="DuDe Daily Control Panel Report Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Send mock test data instead of real OCR (adds [Test Run] prefix)",
    )
    parser.add_argument(
        "--source", choices=["file", "nvr", "camera"],
        default=os.environ.get("SNAPSHOT_SOURCE", "nvr"),
        help="Snapshot source (default: nvr)",
    )
    parser.add_argument(
        "--image-path",
        default=DEFAULT_IMAGE_PATH or None,
        help="Path to local image file (for --source file)",
    )
    parser.add_argument(
        "--nvr-url",
        default=NVR_SNAPSHOT_URL or None,
        help="NVR snapshot URL (for --source nvr)",
    )
    parser.add_argument(
        "--negotiator-url",
        default=NEGOTIATOR_URL,
        help=f"ag_negotiator URL (default: {NEGOTIATOR_URL})",
    )
    parser.add_argument(
        "--test-ocr-only", action="store_true",
        help="Capture + OCR only, show results without sending to LINE",
    )
    parser.add_argument(
        "--verbose", action="store_true",
        help="Enable verbose logging",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    # Configure logging
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Ensure logs directory exists
    LOGS_DIR.mkdir(parents=True, exist_ok=True)

    try:
        return run_pipeline(
            source=args.source,
            image_path=args.image_path,
            nvr_url=args.nvr_url,
            negotiator_url=args.negotiator_url,
            dry_run=args.dry_run,
            test_ocr_only=args.test_ocr_only,
        )
    except Exception as exc:
        LOG.exception("Pipeline failed with unhandled error: %s", exc)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
