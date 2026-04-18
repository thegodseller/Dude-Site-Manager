#!/usr/bin/env python3
import cv2
import os
from pathlib import Path
from daily_panel_report import DISPLAY_REGIONS, capture_snapshot

def run_calibration():
    print("--- DuDe OCR Calibration Mode ---")
    
    # Use existing snapshot if available, or capture new one
    try:
        # Mocking source for this script if needed, but let's try to capture
        # If NVR is not available, this might fail, so we handle it.
        print("Step 1: Capturing snapshot...")
        source = os.environ.get("SNAPSHOT_SOURCE", "nvr")
        try:
            snapshot_path = capture_snapshot(source)
        except Exception as e:
            print(f"Capture failed ({e}). Searching for existing snapshots in var/snapshots...")
            snapshots = sorted(Path("var/snapshots").glob("panel_*.jpg"))
            if not snapshots:
                print("No snapshots found. Please ensure NVR is reachable or provide a file.")
                return
            snapshot_path = snapshots[-1]
            
        print(f"Using snapshot: {snapshot_path}")
        img = cv2.imread(str(snapshot_path))
        if img is None:
            print("Failed to read image.")
            return

        # Draw regions
        for label, x1, y1, x2, y2 in DISPLAY_REGIONS:
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(img, label, (x1, y1-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

        output_path = "calibration_result.jpg"
        cv2.imwrite(output_path, img)
        print(f"Calibration image saved to: {output_path}")
        print("Please review the boxes and adjust DISPLAY_REGIONS in daily_panel_report.py if necessary.")

    except Exception as e:
        print(f"Error during calibration: {e}")

if __name__ == "__main__":
    run_calibration()
