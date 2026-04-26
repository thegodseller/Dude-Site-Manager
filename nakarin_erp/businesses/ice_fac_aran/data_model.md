# Data Model

Possible local entities:

- machine
- production_batch
- sensor_reading
- gauge_reading
- downtime_event
- output_lot
- employee_profile
- leave_request
- cash_advance_request
- complaint_case
- water_quality_check
- maintenance_request
- vehicle_repair_request
- line_approval_event

## Confirmed Modeling Direction

- Employee registration requires an employee-oriented entity.
- Leave request and cash advance request require approval-tracked request entities.
- Complaint handling requires a trackable complaint case entity.
- Water quality check requires a quality-check entity.
- LINE approval flow requires an approval event or approval message trace.

Field-level definitions are `UNKNOWN: requires owner confirmation`.
