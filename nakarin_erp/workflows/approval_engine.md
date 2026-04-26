# Approval Engine

Shared approval lifecycle:

1. Request created.
2. Required approver identified.
3. Approval decision recorded.
4. Approved request executes or queues downstream work.
5. Rejected request closes with reason.
6. Audit log stores who, when, and why.

Approval roles by business are `UNKNOWN: requires owner confirmation` unless documented locally.
