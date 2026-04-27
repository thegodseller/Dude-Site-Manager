# Ice Fac Aran Owner Confirmation Checklist

## Purpose
This file is used to lock business rules before LINE cards, ERP workflows, automation, IoT, or approval logic are implemented. It serves as a single source of truth for requirements that require explicit confirmation from the business owner ("เสี่ย" / "คุณที").

## Approval Roles
- **Who can approve leave requests?**
  - UNKNOWN: requires owner confirmation
- **Who can approve cash/material withdrawal requests?**
  - UNKNOWN: requires owner confirmation
- **Are "เสี่ย" and "คุณที" both required, or is either one enough?**
  - UNKNOWN: requires owner confirmation
- **Is approval sequential or parallel?**
  - UNKNOWN: requires owner confirmation
- **What happens if one approver is unavailable?**
  - UNKNOWN: requires owner confirmation
- **What actions require owner-only approval?**
  - UNKNOWN: requires owner confirmation

## Employee Identity and Photo Capture
- **What employee fields are required?**
  - UNKNOWN: requires owner confirmation
- **Is face/photo capture required for every request?**
  - UNKNOWN: requires owner confirmation
- **Who can view employee photos?**
  - UNKNOWN: requires owner confirmation
- **Retention period for employee photos?**
  - UNKNOWN: requires owner confirmation
- **How to handle workers without formal documents?**
  - UNKNOWN: requires owner confirmation

## Leave Request Workflow
- **Required fields:**
  - UNKNOWN: requires owner confirmation
- **Leave types:**
  - UNKNOWN: requires owner confirmation
- **Approval flow:**
  - UNKNOWN: requires owner confirmation
- **Emergency leave handling:**
  - UNKNOWN: requires owner confirmation
- **Attachment/photo requirement:**
  - UNKNOWN: requires owner confirmation
- **Notification recipients:**
  - UNKNOWN: requires owner confirmation

## Withdrawal / Advance / Material Request Workflow
- **Types of withdrawal:**
  - UNKNOWN: requires owner confirmation
- **Cash limit:**
  - UNKNOWN: requires owner confirmation
- **Material categories:**
  - UNKNOWN: requires owner confirmation
- **Receipt/photo proof:**
  - UNKNOWN: requires owner confirmation
- **Approval thresholds:**
  - UNKNOWN: requires owner confirmation
- **Daily/monthly limits:**
  - UNKNOWN: requires owner confirmation
- **Audit requirements:**
  - UNKNOWN: requires owner confirmation

## Job Application Workflow
- **Required applicant fields:**
  - UNKNOWN: requires owner confirmation
- **Photo requirement:**
  - UNKNOWN: requires owner confirmation
- **ID document policy:**
  - UNKNOWN: requires owner confirmation
- **Work permit / worker document handling:**
  - UNKNOWN: requires owner confirmation
- **Who approves hiring:**
  - UNKNOWN: requires owner confirmation
- **Probation status handling:**
  - UNKNOWN: requires owner confirmation

## Complaint Workflow
- **Complaint categories:**
  - UNKNOWN: requires owner confirmation
- **Anonymous complaint allowed?**
  - UNKNOWN: requires owner confirmation
- **Escalation path:**
  - UNKNOWN: requires owner confirmation
- **SLA / response time:**
  - UNKNOWN: requires owner confirmation
- **Who can close complaint?**
  - UNKNOWN: requires owner confirmation

## Water Quality Check / QC
- **What measurements are recorded?**
  - UNKNOWN: requires owner confirmation
- **Who records them?**
  - UNKNOWN: requires owner confirmation
- **Frequency:**
  - UNKNOWN: requires owner confirmation
- **Pass/fail thresholds:**
  - UNKNOWN: requires owner confirmation
- **Photo requirement:**
  - UNKNOWN: requires owner confirmation
- **Alert recipients:**
  - UNKNOWN: requires owner confirmation
- **Corrective action flow:**
  - UNKNOWN: requires owner confirmation

## Production Gauge / Vision
- **Which camera sees the gauge?**
  - UNKNOWN: requires owner confirmation
- **Gauge crop location:**
  - UNKNOWN: requires owner confirmation
- **Reading schedule:**
  - UNKNOWN: requires owner confirmation
- **What to do if OCR/vision confidence is low?**
  - UNKNOWN: requires owner confirmation
- **Who receives report?**
  - UNKNOWN: requires owner confirmation
- **Daily production report format:**
  - UNKNOWN: requires owner confirmation

## IoT / Tuya Devices
- **Actual devices to be used:**
  - UNKNOWN: requires owner confirmation
- **Temperature sensors:**
  - UNKNOWN: requires owner confirmation
- **Switches/lights:**
  - UNKNOWN: requires owner confirmation
- **Zigbee/WiFi gateway:**
  - UNKNOWN: requires owner confirmation
- **Who can control devices:**
  - UNKNOWN: requires owner confirmation
- **Manual override policy:**
  - UNKNOWN: requires owner confirmation
- **Failure mode if Tuya is unavailable:**
  - UNKNOWN: requires owner confirmation

## Vehicle / Repair Department
- **Vehicle list fields:**
  - UNKNOWN: requires owner confirmation
- **Repair ticket fields:**
  - UNKNOWN: requires owner confirmation
- **Spare parts withdrawal:**
  - UNKNOWN: requires owner confirmation
- **Mechanic assignment:**
  - UNKNOWN: requires owner confirmation
- **Approval for repair cost:**
  - UNKNOWN: requires owner confirmation
- **Status workflow:**
  - UNKNOWN: requires owner confirmation

## LINE / LIFF Card Requirements
- **Which workflows must have LIFF cards?**
  - UNKNOWN: requires owner confirmation
- **What fields appear on each card?**
  - UNKNOWN: requires owner confirmation
- **Required photo buttons:**
  - UNKNOWN: requires owner confirmation
- **Confirmation screen requirements:**
  - UNKNOWN: requires owner confirmation
- **Thai language wording:**
  - UNKNOWN: requires owner confirmation
- **Who receives notification:**
  - UNKNOWN: requires owner confirmation

## ERP / Nakarin Data Model Impact
- **Which fields become shared standards?**
  - UNKNOWN: requires owner confirmation
- **Which fields are Ice Fac Aran specific?**
  - UNKNOWN: requires owner confirmation
- **Which fields should be reusable for AM Nexus / 121C / POS / Room Service?**
  - UNKNOWN: requires owner confirmation
- **Required audit fields:**
  - UNKNOWN: requires owner confirmation
- **Required status fields:**
  - UNKNOWN: requires owner confirmation

## Permission / Audit / Privacy Rules
- **Who can view requests?**
  - UNKNOWN: requires owner confirmation
- **Who can approve?**
  - UNKNOWN: requires owner confirmation
- **Who can export reports?**
  - UNKNOWN: requires owner confirmation
- **What must be audit-logged?**
  - UNKNOWN: requires owner confirmation
- **Photo/data retention policy:**
  - UNKNOWN: requires owner confirmation
- **Sensitive data masking policy:**
  - UNKNOWN: requires owner confirmation

## MVP Scope Confirmation
- [ ] Leave request (UNKNOWN: requires owner confirmation)
- [ ] Withdrawal request (UNKNOWN: requires owner confirmation)
- [ ] Job application (UNKNOWN: requires owner confirmation)
- [ ] Complaint (UNKNOWN: requires owner confirmation)
- [ ] Water QC (UNKNOWN: requires owner confirmation)
- [ ] Production gauge vision report (UNKNOWN: requires owner confirmation)
- [ ] Vehicle repair ticket (UNKNOWN: requires owner confirmation)
- [ ] IoT monitoring (UNKNOWN: requires owner confirmation)
- [ ] IoT control (UNKNOWN: requires owner confirmation)
- [ ] Daily owner report (UNKNOWN: requires owner confirmation)

## Open Questions
- All items marked with UNKNOWN above require owner confirmation before implementation.
