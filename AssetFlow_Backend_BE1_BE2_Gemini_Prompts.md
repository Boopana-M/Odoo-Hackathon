# AssetFlow Single Backend Developer Execution Plan

## Backend Ownership

I am the sole Backend Developer for AssetFlow.

I own the complete backend implementation:

- Authentication
- Users
- Role-Based Access Control
- Departments
- Asset Categories
- Employee Directory
- Asset Registration
- Asset Directory
- Asset Lifecycle
- Asset Allocation and Return
- Asset Transfer
- Resource Booking
- Maintenance
- Asset Audit
- Notifications
- Activity Logs
- Reports
- Dashboard APIs
- Backend Integration
- Backend Security and Hardening

Owned backend areas include:

- controllers/auth

- controllers/assets

- controllers/organization

- controllers/allocation

- controllers/transfer

- controllers/booking

- controllers/maintenance

- controllers/audit

- controllers/report

- routes/auth

- routes/assets

- routes/organization

- routes/allocation

- routes/transfer

- routes/booking

- routes/maintenance

- routes/audit

- routes/report

- models

- middleware

- backend services/utilities where required

- backend configuration and integration where required

Core domain models include:

- User
- Employee
- Department
- AssetCategory
- Asset

Workflow models include:

- Allocation
- TransferRequest
- ResourceBooking
- MaintenanceRequest
- AuditCycle
- AuditItem
- Notification
- ActivityLog

Use actual repository naming when equivalent files or models already exist.

Do not create duplicate models simply because the conceptual name differs.

# Mandatory Phase Rule

The backend must be implemented phase by phase.

Implement ONLY the phase explicitly assigned in the current Gemini prompt.

When the current phase reaches its acceptance criteria, STOP.

DO NOT automatically continue to the next phase.

DO NOT interpret completion of one phase as permission to start another phase.

Wait for a new explicit Gemini prompt before continuing.

You may inspect later-phase files and models to understand compatibility and dependencies.

However, you must not implement later-phase features early.

If the current phase requires a foundation that should have been completed in an earlier phase:

1. Inspect the earlier implementation.
2. Identify the exact missing or incompatible contract.
3. Make a minimal correction only if it is directly required to preserve backend correctness and belongs to backend ownership.
4. Clearly report the correction.
5. Do not use the correction as permission to broadly rewrite earlier phases.

If a later-phase feature is required, do not implement it as a workaround.

Report the dependency and STOP at the current phase boundary.

Do not modify unrelated frontend code.

Do not perform broad repository refactors.

Do not replace the established technology stack without explicit permission.

# Phase Execution Order

## Phase 1 — Core Models and Backend Foundation

Implement or complete:

- User/authentication identity model
- Department model
- Asset Category model
- Employee model
- Asset model
- canonical application roles
- canonical Asset lifecycle states
- core model relationships
- model validation
- indexes
- security foundations

Canonical roles:

- Admin
- Asset Manager
- Department Head
- Employee

Canonical Asset lifecycle states:

- Available
- Allocated
- Reserved
- Under Maintenance
- Lost
- Retired
- Disposed

Phase 1 establishes stable model contracts for all later phases.

Do not implement full controllers or routes for later phases.

STOP after Phase 1.

## Phase 2 — Authentication

Implement:

- public signup
- login
- password hashing
- JWT/session authentication according to repository architecture
- authentication middleware integration
- current-user identity endpoint if required
- Active/Inactive account checks

Security rule:

Public signup creates only an Employee-level account.

Public users must never self-assign:

- Admin
- Asset Manager
- Department Head

Do not implement admin role promotion yet.

STOP after Phase 2.

## Phase 3 — Users and RBAC

Implement:

- canonical role authorization
- role-based middleware/guards
- admin-controlled role promotion
- role demotion where required
- user Active/Inactive controls
- protected-role field handling
- authorization tests

Roles:

- Admin
- Asset Manager
- Department Head
- Employee

Do not trust frontend-provided role authority.

STOP after Phase 3.

## Phase 4 — Departments

Implement Department APIs:

- create Department
- list Departments
- get Department
- update Department
- activate/deactivate Department
- assign Department Head
- parent Department hierarchy

Validate:

- duplicate names
- self-parenting
- invalid parent relationships
- invalid Department Head references

Prefer lifecycle status over hard deletion.

STOP after Phase 4.

## Phase 5 — Asset Categories

Implement Asset Category APIs:

- create Category
- list Categories
- get Category
- update Category
- activate/deactivate Category
- controlled custom field definitions

Supported field definition types may include:

- string
- number
- boolean
- date

Validate:

- duplicate category names
- duplicate field keys
- invalid field types
- malformed field definitions

Do not create a dynamic executable form engine.

STOP after Phase 5.

## Phase 6 — Employee Directory

Implement:

- Employee creation/linking according to identity architecture
- Employee listing
- Employee detail
- Employee update
- Department assignment
- Employee Active/Inactive controls
- role visibility from the canonical role source
- Employee search and filtering

Do not create conflicting role fields.

STOP after Phase 6.

## Phase 7 — Asset Registration

Implement:

- Asset creation
- safe Asset tag generation
- category validation
- category-specific custom field validation
- acquisition metadata
- location
- condition
- photo/document metadata according to repository architecture
- shared/bookable flag

Asset tag format may follow:

AF-0001

Do not generate tags using:

countDocuments() + 1

Use a concurrency-safe strategy appropriate to the existing database.

New Assets default to:

Available

STOP after Phase 7.

## Phase 8 — Asset Directory and Lifecycle

Implement:

- Asset listing
- Asset detail
- Asset update
- search by Asset tag
- search by serial number
- category filtering
- lifecycle filtering
- location filtering
- Department-related filtering where applicable
- pagination
- sorting
- controlled manual lifecycle operations

Lifecycle states:

- Available
- Allocated
- Reserved
- Under Maintenance
- Lost
- Retired
- Disposed

Protect workflow-controlled lifecycle states from unsafe manual updates.

STOP after Phase 8.

## Phase 9 — Asset Allocation and Return

Implement:

- allocate Asset to Employee
- allocate Asset to Department
- active Allocation tracking
- expected return date
- Asset return
- return condition/notes
- overdue derivation
- Allocation history

Allocation target must be exactly one of:

- Employee
- Department

Prevent multiple simultaneous Active allocations for one Asset.

Coordinate Allocation and Asset lifecycle changes atomically/transactionally where supported.

Allocation:

Available → Allocated

Return:

Allocated → Available

Do not use only a normal find-then-create pre-check for concurrency protection.

STOP after Phase 9.

## Phase 10 — Asset Transfer

Implement:

- Transfer Request creation
- Transfer Request listing
- approval
- rejection
- cancellation where supported
- destination Employee or Department
- transfer history

Workflow:

Requested
→ Approved
→ Re-allocated

On approval, coordinate:

- Transfer approval
- current Allocation closure
- new Allocation creation
- Asset lifecycle consistency

Use transactions or database-appropriate atomic controls where supported.

Prevent duplicate Transfer approval.

STOP after Phase 10.

## Phase 11 — Resource Booking

Implement booking for shared/bookable Assets.

Support:

- create Booking
- list Bookings
- Booking detail
- cancel Booking
- Booking history
- status handling

Statuses:

- Upcoming
- Ongoing
- Completed
- Cancelled

Validate:

endTime > startTime

Prevent overlapping active/non-cancelled bookings.

Canonical overlap condition:

existing.startTime < requested.endTime
AND
existing.endTime > requested.startTime

Example:

09:00–10:00 exists.

09:30–10:30 is rejected.

10:00–11:00 is allowed.

Cancelled Bookings do not block new Bookings.

Do not claim a normal unique index solves interval overlap.

STOP after Phase 11.

## Phase 12 — Maintenance

Implement:

- Maintenance Request creation
- approval
- rejection
- technician assignment
- progress updates
- resolution
- Maintenance history

Priority:

- Low
- Medium
- High
- Critical

Workflow:

Pending
→ Approved OR Rejected

Approved
→ Technician Assigned
→ In Progress
→ Resolved

A Pending Maintenance Request does not change Asset lifecycle.

After approval:

Asset → Under Maintenance

After valid resolution:

Asset → Available

Coordinate workflow and Asset lifecycle changes transactionally where supported.

STOP after Phase 12.

## Phase 13 — Asset Audit

Implement:

- Audit Cycle creation
- Department scope
- Location scope
- auditor assignment
- Audit Items
- Asset verification
- discrepancy handling
- Audit closure

Verification results:

- Verified
- Missing
- Damaged

Audit Cycle + Asset must be unique.

Prevent verification changes after Audit closure.

Audit discrepancies include:

- Missing
- Damaged

When closing an Audit, process confirmed outcomes according to business rules.

Confirmed missing Assets may transition to:

Lost

Do not change Asset lifecycle using uncontrolled model hooks.

STOP after Phase 13.

## Phase 14 — Notifications and Activity Logs

Implement Notifications for events such as:

- Asset Assigned
- Maintenance Approved
- Maintenance Rejected
- Booking Confirmed
- Booking Cancelled
- Transfer Approved
- Overdue Return Alert
- Audit Discrepancy Flagged

Support:

- recipient
- type
- title
- message
- read/unread state
- read timestamp
- related entity metadata

Implement Activity Logs for important backend actions.

Support:

- actor
- action
- entity type
- entity identifier
- controlled metadata/change summary
- timestamp

Never log:

- passwords
- password hashes
- authentication tokens
- secrets
- complete sensitive request bodies

STOP after Phase 14.

## Phase 15 — Reports and Dashboard APIs

Implement backend reporting APIs for:

- total Assets
- Assets by lifecycle status
- Assets by category
- Assets by Department where applicable
- active Allocations
- overdue Allocations
- active Maintenance Requests
- Booking utilization
- Audit discrepancies
- workflow summary metrics

Implement dashboard-oriented APIs according to frontend requirements.

Use database aggregation/query capabilities appropriately.

Do not create accounting or financial ledger features.

Acquisition cost remains operational/reporting metadata.

STOP after Phase 15.

## Phase 16 — Integration and Hardening

Perform complete backend integration review.

Verify:

- authentication
- authorization
- User/Employee relationships
- Department relationships
- Category relationships
- Asset lifecycle transitions
- Allocation consistency
- Transfer consistency
- Booking overlap protection
- Maintenance lifecycle consistency
- Audit closure protection
- Notifications
- Activity Logs
- Reports

Review:

- validation
- indexes
- error handling
- duplicate model registration
- environment variables
- secret handling
- route registration
- middleware order
- API consistency
- concurrency risks
- transaction usage
- protected field mass assignment
- pagination
- query filtering

Run:

- lint if available
- tests if available
- build/type-check if available
- backend startup validation
- model import validation

Do not introduce a new test framework solely for hardening if the project does not already use one.

Report pre-existing issues separately.

STOP after Phase 16.

# Gemini Working Procedure for Every Phase

Before editing:

1. Inspect the complete repository structure.
2. Identify the backend root.
3. Read package configuration and scripts.
4. Detect runtime and framework.
5. Detect database and ORM/ODM.
6. Inspect database configuration.
7. Inspect application/server bootstrap.
8. Inspect route registration.
9. Inspect middleware order.
10. Inspect existing files related to the current phase.
11. Search imports and exports before renaming models or modules.
12. Inspect existing tests.
13. Understand naming and architecture conventions.

Before implementation, summarize:

- detected backend stack
- database/ORM or ODM
- relevant architecture
- current-phase files found
- existing implementation found
- dependencies on earlier phases
- integration risks

Extend existing code where possible.

Do not blindly replace working code.

Preserve:

- existing technology stack
- module syntax
- naming conventions
- error handling conventions
- async patterns
- validation conventions
- environment variable strategy

# Security Rules for All Phases

Always preserve:

- no plaintext passwords
- no password hash leakage
- no public privileged-role self-assignment
- no hardcoded JWT/session/database secrets
- no trust in frontend role authority
- no unsafe mass assignment
- no executable category metadata
- no secrets in Activity Logs
- no authentication tokens in workflow records
- no hidden privileged approval logic in model hooks

Approval fields such as:

- approvedBy
- rejectedBy
- closedBy
- decisionTimestamp
- resolutionTimestamp

must be controlled by server-side workflow logic.

# Testing Rule

After every phase:

1. Run existing backend lint if available.
2. Run existing backend tests if available.
3. Run build/type-check if available.
4. For JavaScript projects without a build step, perform appropriate syntax/startup validation.
5. Verify changed model/controller/route modules import correctly.
6. Verify there are no duplicate model registration errors.
7. Add focused tests only when the existing test infrastructure supports them.
8. Do not introduce an unrelated test framework.
9. Report exact commands.
10. Report exact results.
11. If a failure comes from unrelated pre-existing code, report it instead of broadly rewriting another module.

# Final Response Format for Every Phase

Respond with:

1. Repository Inspection Summary
2. Detected Backend Stack and Database
3. Current Phase Objective
4. Existing Implementation Found
5. Files Created
6. Files Modified
7. Features Implemented
8. Database Relationships Established or Used
9. Validation and Indexes Added
10. Security Decisions
11. Integration and Concurrency Considerations
12. Tests / Build / Lint Commands and Exact Results
13. Pre-existing Issues or Risks
14. Recommended Git Commit Message
15. Phase Status

For Phase Status, explicitly write:

"[CURRENT PHASE] complete. STOPPED. Waiting for review/new prompt."

If a later-phase dependency blocks the current phase, write:

"STOPPED: Later-phase dependency detected. The dependency must be addressed in its assigned phase or explicitly approved before continuing."

DO NOT automatically continue to the next phase.

STOP after the final report.

# One-Line Rule

Your current Gemini prompt authorizes one backend phase only. Complete the explicitly assigned phase, run checks, report the result, STOP, and wait for the next explicit prompt.

