# AssetFlow Backend Developer Execution Plan and Gemini CLI Prompts

## Purpose

This document defines the working order, ownership boundaries, and
Gemini CLI prompts for **Backend Developer 1 (BE-1)** and **Backend
Developer 2 (BE-2)**.

The goal is to keep backend work separated, reduce merge conflicts,
preserve one-way dependencies, and stop Gemini from crossing into
another backend developer's turn or ownership.

------------------------------------------------------------------------

# 1. Final Backend Ownership

## Backend Developer 1 (BE-1): Core Domain

BE-1 owns:

-   Authentication
-   Users
-   Departments
-   Asset Categories
-   Employees
-   Asset registration and directory
-   Core asset lifecycle definition
-   Authentication/authorization middleware

BE-1-owned areas:

``` text
controllers/auth/
controllers/assets/
controllers/organization/

routes/auth/
routes/assets/
routes/organization/

middleware/
```

BE-1 core model files:

``` text
User
Employee
Department
AssetCategory
Asset
```

BE-1 must **not implement**:

-   Allocation
-   Return workflow
-   Transfer workflow
-   Resource booking
-   Maintenance workflow
-   Audit workflow
-   Notifications
-   Reports/workflow analytics

------------------------------------------------------------------------

## Backend Developer 2 (BE-2): Operational Workflows

BE-2 owns:

-   Asset Allocation and Return
-   Asset Transfer
-   Resource Booking
-   Maintenance
-   Asset Audit
-   Notifications / Activity Logs
-   Reports and workflow analytics

BE-2-owned areas:

``` text
controllers/allocation/
controllers/transfer/
controllers/booking/
controllers/maintenance/
controllers/audit/
controllers/report/

routes/allocation/
routes/transfer/
routes/booking/
routes/maintenance/
routes/audit/
routes/report/
```

BE-2 workflow model files:

``` text
Allocation
TransferRequest
ResourceBooking
MaintenanceRequest
AuditCycle
AuditItem
Notification
ActivityLog
```

BE-2 must **not implement or rewrite**:

-   Authentication
-   Signup/login
-   User identity model
-   Role promotion
-   Department CRUD
-   Category CRUD
-   Employee Directory CRUD
-   Asset registration/directory
-   BE-1 middleware
-   BE-1 core entity models

------------------------------------------------------------------------

# 2. Dependency Direction

The backend dependency direction is:

``` text
BE-1 CORE DOMAIN
User
Employee
Department
AssetCategory
Asset
        |
        v
BE-2 WORKFLOWS
Allocation
TransferRequest
ResourceBooking
MaintenanceRequest
AuditCycle
AuditItem
Notification
ActivityLog
```

BE-2 may reference BE-1 models.

BE-1 must not depend on BE-2 workflow models for core-domain
implementation unless a later explicitly coordinated integration phase
requires a read-only integration.

------------------------------------------------------------------------

# 3. Mandatory Working Order

Use this order.

  -----------------------------------------------------------------------
  Order                   BE-1                    BE-2
  ----------------------- ----------------------- -----------------------
  1                       Phase 1 --- Core        **STOP / WAIT**
                          models/foundation       

  2                       Phase 2 ---             Phase 1 --- Workflow
                          Authentication          models

  3                       Phase 3 --- Users/RBAC  Phase 2 ---
                                                  Allocation + Return

  4                       Phase 4 --- Departments Phase 3 --- Transfer

  5                       Phase 5 --- Categories  Phase 4 --- Booking

  6                       Phase 6 --- Employee    Phase 5 --- Maintenance
                          Directory               

  7                       Phase 7 --- Asset       Phase 6 --- Audit
                          Registration            

  8                       Phase 8 --- Asset       Phase 7 ---
                          Directory/Lifecycle     Notifications/Logs

  9                       Phase 9 --- Integration Phase 8 ---
                          contracts               Reports/Dashboard APIs

  10                      Phase 10 --- Hardening  Phase 9--10 ---
                                                  Integration/Hardening
  -----------------------------------------------------------------------

## Critical startup sequence

``` text
1. Run BE-1 Phase 1.
2. BE-1 Gemini MUST STOP after Phase 1.
3. Review/merge the BE-1 core model contract.
4. Run BE-2 Phase 1 against the reviewed BE-1 models.
5. BE-2 Gemini MUST STOP after Phase 1.
6. Review BE-1/BE-2 model compatibility.
7. Only after review, continue with the next explicitly assigned phase.
```

## Mandatory Gemini turn rule

Every Gemini prompt in this project must follow this rule:

> **Implement only the phase explicitly assigned in the current prompt.
> When the current phase reaches its acceptance criteria, STOP. Do not
> automatically continue to the next phase. If the next work item
> belongs to the other backend developer, STOP immediately and report
> that the other backend developer's turn/dependency must complete
> first. Do not implement the other developer's work as a workaround.
> Wait for a new explicit prompt before continuing.**

------------------------------------------------------------------------

# 4. Gemini CLI Prompt --- BE-1 Phase 1

Copy the full prompt below into Gemini CLI.

``` text
You are working on AssetFlow, an Enterprise Asset & Resource Management System.

I am Backend Developer 1 (BE-1).

MY OWNERSHIP IS STRICTLY:

- Authentication
- Users
- Departments
- Categories
- Employees
- Assets

My owned backend areas are:

- controllers/auth
- controllers/assets
- controllers/organization
- routes/auth
- routes/assets
- routes/organization
- core BE-1 model files
- middleware

Backend Developer 2 (BE-2) owns:

- Asset Allocation and Return
- Asset Transfer
- Resource Booking
- Maintenance
- Asset Audit
- Reports
- Notifications and workflow activity support

BE-2 owns workflow controllers/routes and BE-2 workflow model files.

MANDATORY TURN-STOP RULE:

Implement ONLY BE-1 Phase 1 from this prompt.

When Phase 1 acceptance criteria are met, STOP.

DO NOT automatically start BE-1 Phase 2.

DO NOT implement BE-2 work.

If you discover that the next required implementation step belongs to BE-2, STOP and report the dependency.

Do not implement the other backend developer's feature as a workaround.

Wait for a new explicit Gemini prompt before continuing.

DO NOT modify BE-2 controllers or routes.
DO NOT rewrite BE-2 workflow models.
DO NOT modify unrelated frontend or backend code.
DO NOT perform a broad repository refactor.

PHASE 1 OBJECTIVE

Inspect the existing repository first, understand the already-established backend architecture and technology stack, and establish or complete the BE-1 core database/domain model foundation.

This phase is primarily about:

- User/authentication identity model
- Department model
- Asset Category model
- Employee model
- Asset model
- canonical roles
- canonical asset lifecycle states
- relationships
- indexes
- model validation
- security foundations

Do not implement full controllers/routes for later phases unless a minimal compatibility correction is absolutely required for the backend to initialize.

==================================================
1. INSPECT THE EXISTING REPOSITORY BEFORE EDITING
==================================================

Before changing code:

1. Inspect the complete repository structure.
2. Identify the backend root directory.
3. Read backend package configuration and scripts.
4. Identify the exact backend framework and runtime.
5. Identify the database and ORM/ODM.
6. Inspect database connection/configuration.
7. Inspect:
   - controllers/auth
   - controllers/assets
   - controllers/organization
   - routes/auth
   - routes/assets
   - routes/organization
   - models
   - middleware
8. Inspect server/application bootstrap.
9. Understand:
   - route registration
   - middleware order
   - environment configuration
   - database initialization
10. Inspect naming conventions, module syntax, error handling, async patterns, model conventions, timestamps, indexes, and validation style.
11. Inspect existing BE-2 workflow code/models only for compatibility understanding.
12. Search all imports of existing User, Employee, Department, Category/AssetCategory, and Asset models before renaming or changing exports.
13. Inspect existing tests.

Before editing, summarize:

- detected backend stack
- detected database/ORM or ODM
- relevant architecture
- existing BE-1 files/models
- model names and exports
- BE-2 integration dependencies found

Then implement this phase.

Extend existing code where possible instead of blindly replacing it.

Preserve the existing tech stack and conventions.

Do not introduce a new ORM, ODM, authentication framework, validation framework, or major dependency unless absolutely necessary and no repository equivalent exists.

==================================================
2. CORE DOMAIN AND ROLE RULES
==================================================

The BE-1 core entities are:

- User/authentication identity
- Employee
- Department
- Asset Category
- Asset

Application roles are:

- Admin
- Asset Manager
- Department Head
- Employee

Use the repository's established enum/naming style.

If no reusable role definition exists, establish one canonical role definition according to the existing architecture.

CRITICAL SECURITY RULE:

Public signup creates only an Employee-level account.

A public user must never select or self-assign:

- Admin
- Asset Manager
- Department Head

Admin-controlled role promotion belongs to a later BE-1 Employee Directory/RBAC phase.

The Phase 1 model design must not enable privileged public self-registration.

==================================================
3. USER / AUTHENTICATION IDENTITY MODEL
==================================================

Inspect whether a User model already exists.

Create or safely complete the authentication identity model using the existing database architecture.

Support at minimum:

- unique email
- password credential storage
- role
- Active/Inactive account state
- timestamps if consistent with the project

Security requirements:

- enforce email uniqueness at model/database level where supported
- normalize email consistently, preferably lowercase and trimmed
- never store plaintext passwords
- do not expose password hashes through normal serialization
- do not hardcode secrets
- do not add privileged-role self-registration
- preserve existing hashing strategy
- prevent duplicate hashing when unchanged passwords are saved
- do not implement the full forgot-password workflow in Phase 1

Determine whether User and Employee are separate or combined in the current architecture.

Prefer the established repository design.

If no design exists, use separate linked entities because authentication identity and employee directory data have separate responsibilities.

If separate:

- Employee references User
- the relationship is queryable
- prevent duplicate Employee records for the same User where supported

==================================================
4. DEPARTMENT MODEL
==================================================

Create or complete Department.

Support:

- department name
- optional department head
- optional parent department
- Active/Inactive status
- timestamps if consistent

Relationships/rules:

- normalize department names appropriately
- enforce name uniqueness if consistent with organization scope
- parentDepartment references Department
- departmentHead references Employee
- parentDepartment is optional
- departmentHead is optional
- Department cannot reference itself as parent
- support later hierarchical queries
- deactivation is represented by status; hard deletion must not be the only lifecycle mechanism

Do not implement Department CRUD controllers in Phase 1.

If self-parenting cannot be fully guaranteed at schema declaration time, add model validation where appropriate or clearly report the required Phase 4 controller/service guard.

==================================================
5. ASSET CATEGORY MODEL
==================================================

Create or complete Asset Category.

Support:

- category name
- optional description if consistent with current architecture
- Active/Inactive status
- optional category-specific field definitions
- timestamps if consistent

Examples include:

- Electronics
- Furniture
- Vehicles

A category can define controlled optional field definitions.

A field definition should support:

- field key/name
- human-readable label
- data type
- required/optional

If appropriate, support:

- string
- number
- boolean
- date

Do not create a full dynamic form engine.

Do not store arbitrary executable logic.

Validate field definitions and prevent duplicate field keys inside one category.

Enforce category name uniqueness where supported by current organization scope.

==================================================
6. EMPLOYEE MODEL
==================================================

Create or complete Employee.

Support Employee Directory requirements:

- employee name
- linked User/authentication identity
- email through the canonical identity architecture
- Department
- role visibility through the canonical role source
- Active/Inactive status
- timestamps if consistent

Relationships:

- Employee belongs to zero or one Department initially unless existing architecture requires a Department
- Employee links reliably to User
- Department.departmentHead can reference Employee
- future workflow models can reference Employee reliably

Avoid conflicting duplicate role fields in User and Employee.

Prefer one canonical role source.

If role is on User, Employee APIs can populate/derive it later.

If the repository intentionally stores role on Employee, preserve the architecture and ensure auth can consume the same canonical value.

Do not implement role promotion APIs in Phase 1.

==================================================
7. ASSET MODEL
==================================================

Create or complete Asset.

Support:

- name
- category
- asset tag
- serial number
- acquisition date
- acquisition cost
- condition
- location
- photo/document metadata or references according to existing storage architecture
- shared/bookable flag
- lifecycle status
- timestamps if consistent

Canonical lifecycle states are:

- Available
- Allocated
- Reserved
- Under Maintenance
- Lost
- Retired
- Disposed

Use one canonical lifecycle definition.

A newly registered Asset defaults to Available.

Relationships:

- Asset.category references Asset Category
- BE-2 Allocation can reference Asset
- BE-2 Booking can reference shared/bookable Asset
- BE-2 Maintenance can reference Asset
- BE-2 Audit can reference Asset

Future search/filter must support:

- asset tag
- serial number
- category
- lifecycle status
- department where applicable
- location

Do NOT implement Allocation records inside Asset unless an existing agreed architecture explicitly has a current allocation reference.

Do NOT implement transfer logic.

Do NOT implement booking logic.

Do NOT implement maintenance request logic.

Do NOT implement audit cycle logic.

Avoid embedding workflow history directly in Asset when dedicated BE-2 workflow records should own history.

Asset tag rules:

- format such as AF-0001
- unique
- field and validation prepared in Phase 1
- do not use "count documents + 1" as a generator
- safe generation belongs to BE-1 Asset Registration phase unless an existing safe sequence strategy already exists

Serial number:

- normalize appropriately
- inspect whether uniqueness is expected
- if optional and unique, handle null/missing values correctly

Acquisition cost:

- operational/reporting metadata only
- non-negative
- do not add accounting, invoicing, payment, purchase-order, or ledger relationships

==================================================
8. MODEL VALIDATION AND DATA INTEGRITY
==================================================

Use the existing ORM/ODM validation capabilities.

At minimum validate:

- required fields
- enum values
- normalized email
- relationship/reference types
- non-negative acquisition cost
- category custom field data types
- duplicate category custom field keys
- Department self-parenting where technically appropriate
- unique User email
- unique Asset tag

Do not rely only on frontend validation.

Add useful indexes following existing conventions for:

- email lookup
- asset tag lookup
- serial number lookup
- category/status filtering
- location filtering

==================================================
9. SECURITY REQUIREMENTS
==================================================

Preserve:

- no plaintext passwords
- no password/hash leakage
- no public privileged-role self-assignment
- no hardcoded JWT/session/database secrets
- no trust in frontend role values
- no arbitrary executable category-field logic
- no unsafe mass assignment of protected role/identity fields
- existing environment-variable strategy

If an existing BE-1-owned model/middleware flaw directly violates these guarantees, make the smallest scoped correction and explain it.

Do not refactor unrelated security code.

==================================================
10. BE-2 INTEGRATION CONTRACT
==================================================

BE-2 will implement:

- Allocation/Return
- Transfer
- Booking
- Maintenance
- Audit
- Reports
- Notifications

Expose stable BE-1 model contracts.

Expected contract:

Employee/User:
- stable identifier
- canonical role
- active/inactive state
- department relationship

Department:
- stable identifier
- department head
- parent department
- active/inactive state

Asset Category:
- stable identifier
- field definitions
- active/inactive state

Asset:
- stable identifier
- unique asset tag
- category
- canonical lifecycle status
- shared/bookable flag
- location
- condition

Do not add BE-2 endpoints.

Do not modify BE-2 controllers/routes.

If BE-2 workflow models already exist, do not delete or broadly rewrite them.

Preserve model names and exports already consumed by other code where possible.

If a breaking model/export change is unavoidable, STOP and report the conflict rather than silently rewriting BE-2 code.

THIS IS A TURN BOUNDARY.

If fixing the issue requires editing a BE-2 workflow model/controller/route, STOP.

Report:
"BE-2 dependency/conflict detected. BE-2 must handle this in its turn."

Do not cross the boundary.

==================================================
11. FILE SCOPE
==================================================

Prefer changes only in BE-1 core model files and, only when directly necessary, BE-1 middleware.

You may inspect BE-1 controllers/routes and bootstrap/configuration.

Do not implement later BE-1 controllers/routes in this phase.

Do not modify frontend files.

Do not modify BE-2 controllers/routes or workflow model files.

Do not rename broad folder structures.

Do not rewrite package configuration unless a required existing dependency/configuration issue prevents initialization.

==================================================
12. ACCEPTANCE CRITERIA
==================================================

Phase 1 is complete only if:

1. Repository architecture was inspected before editing.
2. Existing stack was preserved.
3. Secure User/auth identity exists or is completed.
4. Department supports status, optional head, and optional parent hierarchy.
5. Asset Category supports controlled field definitions.
6. Employee has stable User and Department relationships according to the architecture.
7. Asset supports AssetFlow registration metadata.
8. Asset lifecycle is constrained to Available, Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed.
9. New Assets default to Available.
10. Asset tags are unique and prepared for safe later generation.
11. Model design does not enable public privileged self-assignment.
12. Passwords are not stored/exposed as plaintext.
13. Appropriate indexes exist.
14. BE-2 workflows were not implemented.
15. BE-2 files were not modified.
16. Existing model imports/exports were not silently broken.
17. Backend starts/builds according to existing scripts.

==================================================
13. TESTS AND BUILD CHECKS
==================================================

After implementation:

1. Run existing backend lint if available.
2. Run existing backend tests if available.
3. Run build/type-check if available.
4. If JavaScript has no build step, run appropriate syntax/startup validation.
5. Verify changed model modules import.
6. Verify model initialization has no duplicate model registration errors.
7. If existing test infrastructure supports it, add focused tests for:
   - invalid role enum
   - invalid Asset lifecycle status
   - negative acquisition cost
   - duplicate category field keys
   - Department self-parenting
   - unique email behavior
   - Asset default status is Available
8. Do not introduce an unrelated test framework.
9. Report commands and exact results.
10. If a check fails due to unrelated pre-existing code, report it without rewriting another developer's module.

==================================================
14. FINAL RESPONSE FORMAT
==================================================

Respond with:

1. Repository Inspection Summary
2. Detected Backend Stack and Database
3. Files Created
4. Files Modified
5. Core Models Implemented or Completed
6. Database Relationships Established
7. Validation and Indexes Added
8. Security Decisions
9. BE-2 Integration Considerations
10. Tests / Build / Lint Commands and Exact Results
11. Pre-existing Issues or Integration Risks
12. Recommended Git Commit Message
13. Turn Status

For Turn Status, explicitly write one of:

- "BE-1 Phase 1 complete. STOPPED. Waiting for review/new prompt."
- "STOPPED: BE-2 dependency/conflict detected. BE-2 must handle this in its turn."

DO NOT continue to Phase 2.
DO NOT implement BE-2 work.
DO NOT modify unrelated modules.
DO NOT rewrite another developer's code.
STOP after the final report.
```

------------------------------------------------------------------------

# 5. Gemini CLI Prompt --- BE-2 Phase 1

**Run this only after BE-1 Phase 1 has completed and its core model
contract has been reviewed/merged.**

``` text
You are working on AssetFlow, an Enterprise Asset & Resource Management System.

I am Backend Developer 2 (BE-2).

MY OWNERSHIP IS STRICTLY:

- Asset Allocation and Return
- Asset Transfer
- Resource Booking
- Maintenance
- Asset Audit
- Reports
- Notifications / workflow activity support

My owned workflow areas are:

- controllers/allocation
- controllers/transfer
- controllers/booking
- controllers/maintenance
- controllers/audit
- controllers/report

- routes/allocation
- routes/transfer
- routes/booking
- routes/maintenance
- routes/audit
- routes/report

My workflow model files are conceptually:

- Allocation
- TransferRequest
- ResourceBooking
- MaintenanceRequest
- AuditCycle
- AuditItem
- Notification
- ActivityLog

Use actual repository naming if equivalent files already exist.

Backend Developer 1 (BE-1) owns:

- Authentication
- Users
- Departments
- Categories
- Employees
- Assets
- core BE-1 model files
- middleware

MANDATORY TURN-STOP RULE:

Implement ONLY BE-2 Phase 1 from this prompt.

When Phase 1 acceptance criteria are met, STOP.

DO NOT automatically start BE-2 Phase 2.

DO NOT implement BE-1 work.

If you discover that a required change belongs to BE-1, STOP and report the BE-1 dependency.

Do not edit BE-1 code as a workaround.

Wait for BE-1 to complete its turn and wait for a new explicit Gemini prompt before continuing.

DO NOT modify authentication controllers/routes.
DO NOT modify organization controllers/routes.
DO NOT modify asset registration/directory controllers/routes.
DO NOT modify BE-1 middleware.
DO NOT redesign BE-1 core entity models.
DO NOT rewrite unrelated frontend or backend code.
DO NOT perform a broad repository refactor.

PHASE 1 OBJECTIVE

Inspect the repository and the completed BE-1 core model contract first.

Then establish the database/domain foundation for BE-2 workflow modules:

- Allocation
- Transfer Request
- Resource Booking
- Maintenance Request
- Audit Cycle
- Audit Item/Verification
- Notification
- Activity Log

This phase is about workflow models, relationships, validation, indexes, and concurrency preparation.

Do not implement full workflow controllers/routes.

Do not continue to Phase 2.

==================================================
1. INSPECT THE EXISTING REPOSITORY BEFORE EDITING
==================================================

Before changing code:

1. Inspect the complete repository.
2. Identify backend root.
3. Read package configuration/scripts.
4. Identify runtime, framework, database, ORM/ODM, module system, validation and error conventions.
5. Inspect database connection/configuration.
6. Inspect server/application bootstrap.
7. Inspect route registration and middleware order.
8. Inspect:
   - controllers/allocation
   - controllers/transfer
   - controllers/booking
   - controllers/maintenance
   - controllers/audit
   - controllers/report
   - routes/allocation
   - routes/transfer
   - routes/booking
   - routes/maintenance
   - routes/audit
   - routes/report
9. Search for:
   - Allocation
   - AssetAllocation
   - Transfer
   - TransferRequest
   - Booking
   - ResourceBooking
   - Maintenance
   - MaintenanceRequest
   - Audit
   - AuditCycle
   - AuditItem
   - AuditVerification
   - Discrepancy
   - Notification
   - ActivityLog
10. Inspect BE-1 models:
   - User
   - Employee
   - Department
   - Category/AssetCategory
   - Asset
11. Record actual filenames and exports.
12. Inspect canonical role values.
13. Inspect canonical Asset lifecycle values.
14. Confirm Asset exposes:
   - stable identifier
   - asset tag
   - category
   - lifecycle status
   - shared/bookable flag
   - location
   - condition
15. Confirm Employee exposes:
   - stable identifier
   - linked User
   - Department
   - Active/Inactive state
16. Inspect existing tests.
17. Inspect model registration/export conventions.
18. Search for all imports of workflow models before changing names or exports.

Before editing, summarize:

- backend stack
- database/ORM or ODM
- architecture
- BE-1 contracts found
- existing BE-2 workflow files/models
- integration risks/missing dependencies

If a required BE-1 contract is missing, incompatible, or ambiguous, STOP before editing BE-1 code.

Report:

"STOPPED: BE-1 dependency detected. BE-1 must complete/fix the core contract before BE-2 continues."

Do not fix BE-1's model yourself.

==================================================
2. WORKFLOW DOMAIN
==================================================

AssetFlow workflows are:

1. Asset Allocation and Return
2. Asset Transfer
3. Shared Resource Booking
4. Maintenance approval and repair
5. Asset Audit Cycles
6. Notifications
7. Activity history/reporting support

Workflow entities must reference BE-1 core entities.

Use references/foreign keys to the actual:

- User
- Employee
- Department
- Asset

Do not duplicate those models.

Use existing naming, enum, timestamp, indexing, and serialization conventions.

==================================================
3. ALLOCATION MODEL
==================================================

Create or complete the Allocation workflow model.

Support:

- asset
- allocated Employee OR allocated Department
- allocation date
- optional expected return date
- allocation status
- return date
- condition check-in/return notes
- created/requested/allocated-by actor where appropriate
- timestamps

Allocation target must be exactly one of:

- Employee
- Department

It must not target both.

It must not target neither.

Use model-level validation where supported.

At minimum distinguish:

- Active
- Returned

Preserve additional valid states if already established.

Do not duplicate Transfer status in Allocation.

If expectedReturnDate exists, it must not be earlier than allocationDate.

Return date remains optional until completion.

Do not store a permanent isOverdue boolean unless existing architecture intentionally requires it.

Overdue is normally derived when:

- status is Active
- expectedReturnDate exists
- expectedReturnDate is before current time

CRITICAL CONFLICT RULE:

One Asset cannot have multiple simultaneous Active allocations.

Phase 2 will enforce this transactionally/atomically.

In Phase 1:

- add appropriate indexes
- document concurrency requirements
- use a database-level partial/conditional unique constraint if cleanly supported by the existing database and project conventions

Do not claim a normal find-then-create pre-check alone solves concurrency.

Do not implement Allocation controllers in Phase 1.

==================================================
4. TRANSFER REQUEST MODEL
==================================================

Create or complete Transfer Request.

Workflow:

Requested
  ->
Approved
  ->
Re-allocated

Support rejection/cancellation terminal states if consistent with architecture.

Support:

- asset
- current active Allocation/current holder context
- requesting Employee/User
- destination Employee OR Department
- optional reason
- workflow status
- approved/rejected by
- decision timestamp
- optional decision notes
- timestamps

Destination must be exactly one of:

- Employee
- Department

Do not allow both.

Do not allow neither.

Reference Asset.

Prefer referencing current Allocation when available so later approval can close/reassign the correct record.

Do not copy/embed a full Asset snapshot.

Do not implement transfer approval logic in Phase 1.

Do not change Asset status in model hooks.

Later controller/service logic must coordinate transactionally where supported:

- approval
- active Allocation closure
- new Allocation creation
- Asset lifecycle consistency

==================================================
5. RESOURCE BOOKING MODEL
==================================================

Create or complete Resource Booking.

Shared resources are BE-1 Asset records marked shared/bookable.

Support:

- resource/Asset
- booked-by Employee/User
- optional Department context where appropriate
- start date/time
- end date/time
- booking status
- optional purpose/notes
- cancellation metadata
- timestamps

Statuses:

- Upcoming
- Ongoing
- Completed
- Cancelled

Inspect whether status is stored or partly derived.

Avoid fragile hooks that assume wall-clock state changes without a scheduler.

Cancellation must be persistable.

Validate:

endTime > startTime

CRITICAL OVERLAP RULE:

Two active/non-cancelled bookings for the same resource must not overlap.

Canonical overlap condition:

existing.startTime < requested.endTime
AND
existing.endTime > requested.startTime

Example:

09:00–10:00 exists.

09:30–10:30 is rejected.

10:00–11:00 is allowed.

Cancelled bookings do not block a new booking.

Do not attempt to solve interval overlap with only a normal unique index.

Add useful indexes for:

- resource + start time
- resource + end time
- resource + status
- booked-by lookup

Do not implement Booking controllers in Phase 1.

==================================================
6. MAINTENANCE REQUEST MODEL
==================================================

Create or complete Maintenance Request.

Workflow:

Pending
  ->
Approved OR Rejected

Approved
  ->
Technician Assigned
  ->
In Progress
  ->
Resolved

Support:

- asset
- raised-by Employee/User
- issue description
- priority
- attachment/photo metadata according to storage architecture
- workflow status
- approved/rejected by Asset Manager
- decision timestamp
- rejection/decision notes
- assigned technician
- work/progress notes where appropriate
- resolution date
- timestamps

Use controlled priority values.

If none exist, use a practical enum such as:

- Low
- Medium
- High
- Critical

Do not build a technician-management module.

Prefer existing Employee/User reference for technician assignment where practical.

CRITICAL ASSET LIFECYCLE RULE:

A Pending maintenance request does NOT move Asset to Under Maintenance.

Asset moves to Under Maintenance only after approval.

Resolution later returns Asset to Available only when consistent with current workflow state.

Do not perform Asset lifecycle updates in model hooks.

Do not modify BE-1 Asset model.

Later maintenance controller/service logic coordinates status changes transactionally where supported.

Do not implement Maintenance controllers in Phase 1.

==================================================
7. AUDIT CYCLE MODEL
==================================================

Create or complete Audit Cycle.

Support:

- audit name/title
- scope
- date range
- assigned auditors
- audit status
- created-by
- closed-by
- closed timestamp
- timestamps

Scope supports:

- Department
- Location

Use controlled scope representation.

Department scope references Department.

Location scope stores the normalized location value according to BE-1 Asset architecture.

Do not require both.

Assigned auditors reference existing Employee/User identities.

Support one or more assigned auditors.

At minimum distinguish:

- Open/Active
- Closed

Preserve Planned/Draft if already established.

Later service/controller logic must prevent verification changes after closure.

Do not implement close-cycle logic in Phase 1.

==================================================
8. AUDIT ITEM / VERIFICATION MODEL
==================================================

Create or complete the per-Asset Audit Item/Verification model.

Support:

- Audit Cycle
- Asset
- auditor/verified-by where appropriate
- verification result
- notes
- verified timestamp
- timestamps

Verification results:

- Verified
- Missing
- Damaged

The combination:

Audit Cycle + Asset

must be unique.

The same Asset cannot appear twice in one Audit Cycle.

Discrepancies are:

- Missing
- Damaged

Do not generate report files in the model.

Do not update Asset status from a model hook.

Later close-cycle logic will inspect discrepancies, confirm outcomes, potentially mark confirmed missing Assets as Lost, and lock the cycle.

==================================================
9. NOTIFICATION MODEL
==================================================

Inspect for an existing Notification model.

Create or complete the workflow Notification model only if compatible with existing ownership and architecture.

Notification examples:

- Asset Assigned
- Maintenance Approved
- Maintenance Rejected
- Booking Confirmed
- Booking Cancelled
- Booking Reminder
- Transfer Approved
- Overdue Return Alert
- Audit Discrepancy Flagged

Support:

- recipient User/Employee
- notification type
- title
- message
- read/unread state
- read timestamp
- optional related entity type
- optional related entity identifier
- timestamps

Use controlled notification types where appropriate.

Do not store executable route logic.

Do not implement reminder scheduling in Phase 1.

Do not implement Notification controllers in Phase 1.

==================================================
10. ACTIVITY LOG MODEL
==================================================

Inspect for ActivityLog/AuditLog.

Do not confuse system Activity Logs with Asset Audit Cycles.

If needed and compatible, support:

- actor
- action
- entity type
- entity identifier
- optional selected metadata/change summary
- timestamp

Never log:

- password hashes
- authentication tokens
- secrets

Do not blindly store full request bodies.

Do not add broad automatic logging middleware.

Do not modify BE-1 middleware.

==================================================
11. VALIDATION
==================================================

Use existing ORM/ODM validation.

At minimum validate:

Allocation:
- Asset required
- exactly one target
- valid status
- expectedReturnDate is not before allocationDate

Transfer:
- Asset required
- requester required where architecture requires
- exactly one destination
- valid status

Booking:
- resource required
- actor required
- valid times
- endTime > startTime
- valid status

Maintenance:
- Asset required
- raised-by required
- non-empty issue description
- valid priority
- valid status

Audit Cycle:
- valid scope type
- correct scope value/reference
- valid date range
- auditors according to domain rules
- valid status

Audit Item:
- Audit Cycle required
- Asset required
- valid verification result
- unique Audit Cycle + Asset

Notification:
- recipient required
- valid type
- non-empty title/message where applicable

Do not rely only on frontend validation.

Do not introduce a new validation library if the repository already has one.

==================================================
12. SECURITY
==================================================

Preserve:

- no public role assignment
- no modification of BE-1 auth
- no authorization bypass
- no hardcoded secrets
- no password hash exposure
- no tokens in workflow records
- no trust in client-provided actor authority
- no hidden privileged approvals in model hooks
- no executable notification/audit metadata
- no mass assignment of protected approval fields

Fields such as:

- approvedBy
- rejectedBy
- closedBy
- decision timestamp
- resolution timestamp

must later be controlled by server workflow logic.

==================================================
13. DATABASE RELATIONSHIPS
==================================================

Expected high-level relationships:

User
  -> Employee

Employee
  -> Department

Asset
  -> AssetCategory

Asset
  -> many Allocation records

Allocation
  -> Employee OR Department

Asset
  -> many Transfer Requests

Transfer Request
  -> current Allocation where applicable
  -> destination Employee OR Department

Shared/Bookable Asset
  -> many Resource Bookings

Asset
  -> many Maintenance Requests

Audit Cycle
  -> many Audit Items

Audit Item
  -> Asset

Notification
  -> recipient User/Employee
  -> optional related workflow entity

Activity Log
  -> actor User/Employee
  -> related entity identifier

Use actual repository model names.

Do not duplicate BE-1 entities.

Follow existing association/reference conventions.

==================================================
14. INDEXING AND CONCURRENCY PREPARATION
==================================================

Consider indexes for:

Allocation:
- Asset + status
- Employee target + status
- Department target + status
- expected return date + status

Transfer:
- Asset + status
- requester
- destination
- created timestamp/status

Booking:
- resource + start time
- resource + end time
- resource + status
- booking actor

Maintenance:
- Asset + status
- raised-by
- priority + status
- created timestamp/status

Audit:
- status
- scope
- auditors
- Audit Cycle + Asset unique

Notification:
- recipient + read state
- recipient + created timestamp

Activity Log:
- actor + timestamp
- entity type + identifier
- action + timestamp

Identify later concurrency requirements for:

- simultaneous Allocation attempts
- simultaneous overlapping Booking requests
- duplicate Transfer approvals
- duplicate Audit closure
- conflicting Maintenance lifecycle transitions

Do not claim a normal pre-check alone solves concurrency.

Report where later transactions, atomic conditional updates, constraints, or database-appropriate concurrency controls are required.

==================================================
15. BE-1 INTEGRATION BOUNDARY
==================================================

BE-1 owns:

- User
- Authentication
- Employee
- Department
- Asset Category
- Asset
- core middleware

Use BE-1's existing model exports.

Do not:

- rename BE-1 model files
- replace BE-1 role enums
- replace BE-1 Asset lifecycle enums
- create duplicate User
- create duplicate Employee
- create duplicate Department
- create duplicate Asset Category
- create duplicate Asset
- implement Asset registration
- implement role promotion
- modify signup/login
- modify Organization CRUD
- modify BE-1 middleware

If required Asset lifecycle values are missing, STOP and report the BE-1 dependency.

If the Asset shared/bookable field is missing, STOP and report the BE-1 dependency.

If Employee/Department references are incompatible, STOP and report the exact conflict.

THIS IS A TURN BOUNDARY.

When a required fix belongs to BE-1, write:

"STOPPED: BE-1 dependency detected. BE-1 must complete/fix this core contract before BE-2 continues."

Do not edit BE-1's files.

Do not continue implementing around an incompatible core contract.

Wait for BE-1's turn and a new explicit prompt.

==================================================
16. FILE SCOPE
==================================================

Prefer changes only in BE-2 workflow model files required for Phase 1.

Inspect BE-2 controllers/routes but do not implement full APIs.

Do not modify:

- controllers/auth
- controllers/assets
- controllers/organization
- routes/auth
- routes/assets
- routes/organization
- BE-1 middleware
- BE-1 core model files
- frontend files

If a central model export/index file exists, avoid simultaneous ownership conflicts.

If exposing a new BE-2 model requires editing a central BE-1-owned export file, STOP and report the exact export change required for BE-1 to make during its turn.

Do not rewrite unrelated modules.

Do not rewrite another developer's code.

==================================================
17. ACCEPTANCE CRITERIA
==================================================

Phase 1 is complete only if:

1. Repository was inspected before editing.
2. Existing stack/architecture were preserved.
3. BE-1 contracts were inspected.
4. No duplicate BE-1 entity was created.
5. Allocation exists/completed.
6. Allocation targets Employee OR Department.
7. Allocation is prepared against multiple Active allocations.
8. Transfer Request exists/completed.
9. Transfer destination is Employee OR Department.
10. Resource Booking exists/completed.
11. Booking validates endTime > startTime.
12. Booking supports canonical overlap validation.
13. Maintenance Request exists/completed.
14. Maintenance statuses support AssetFlow workflow.
15. Pending maintenance does not automatically change Asset.
16. Audit Cycle exists/completed.
17. Audit scope supports Department or Location.
18. Audit Item exists/completed.
19. Audit Cycle + Asset uniqueness is enforced where supported.
20. Verification supports Verified, Missing, Damaged.
21. Notification storage exists if compatible.
22. Activity Log storage exists if compatible.
23. No BE-1 controller/route was modified.
24. No BE-1 core model was redesigned.
25. Full workflow controllers were not implemented.
26. Relevant indexes and validation exist.
27. Model imports initialize without duplicate registration errors.
28. Existing exports remain compatible.
29. Backend starts/builds according to existing scripts.

==================================================
18. TESTS AND BUILD CHECKS
==================================================

After implementation:

1. Run existing backend lint if available.
2. Run existing backend tests if available.
3. Run build/type-check if available.
4. If JavaScript has no build step, perform supported syntax/startup validation.
5. Verify all changed workflow models import.
6. Verify no duplicate model registration errors.

If test infrastructure supports focused tests, add tests for:

- Allocation cannot target both Employee and Department
- Allocation cannot target neither
- expectedReturnDate cannot precede allocationDate
- Transfer cannot target both Employee and Department
- Transfer cannot target neither
- Booking endTime must be after startTime
- Cancelled Booking is representable
- invalid Maintenance status
- invalid Maintenance priority
- invalid Audit scope
- invalid Audit date range
- duplicate Audit Cycle + Asset item
- invalid Audit verification result
- invalid Notification type where applicable

Do not add a new test framework only for Phase 1.

Report commands and exact results.

If a failure is caused by unrelated pre-existing code, identify it and do not rewrite another developer's module to hide it.

==================================================
19. FINAL RESPONSE FORMAT
==================================================

Respond with:

1. Repository Inspection Summary
2. Detected Backend Stack and Database
3. BE-1 Core Contracts Found
4. Files Created
5. Files Modified
6. Workflow Models Implemented or Completed
7. Database Relationships Established
8. Validation and Indexes Added
9. Security Decisions
10. Concurrency Risks Reserved for Later Phases
11. BE-1 Integration Dependencies or Conflicts
12. Tests / Build / Lint Commands and Exact Results
13. Pre-existing Issues or Risks
14. Recommended Git Commit Message
15. Turn Status

For Turn Status, explicitly write one of:

- "BE-2 Phase 1 complete. STOPPED. Waiting for review/new prompt."
- "STOPPED: BE-1 dependency detected. BE-1 must complete/fix the core contract before BE-2 continues."

DO NOT continue to Phase 2.
DO NOT implement BE-1 work.
DO NOT modify unrelated modules.
DO NOT rewrite another developer's code.
STOP after the final report.
```

------------------------------------------------------------------------

# 6. Shared Git and Turn Discipline

Recommended branches:

``` text
feature/backend-core       # BE-1
feature/backend-workflow   # BE-2
```

Before starting a new approved phase:

``` bash
git pull origin main
```

After completing the explicitly assigned phase:

``` bash
git add .
git commit -m "Meaningful phase-specific message"
git push
```

Do not use empty commits merely for activity.

Do not let Gemini continue to the next phase after a commit.

A completed phase must be reviewed before the next Gemini prompt is
issued.

------------------------------------------------------------------------

# 7. Handoff Checklist

## After BE-1 Phase 1

Before BE-2 Phase 1 starts, record:

-   actual User model filename/export
-   actual Employee model filename/export
-   actual Department model filename/export
-   actual Asset Category model filename/export
-   actual Asset model filename/export
-   canonical role values
-   canonical Asset lifecycle values
-   exact shared/bookable Asset field name
-   exact Employee-to-User relationship field
-   exact Employee-to-Department relationship field
-   whether a central model index/export file exists

## After BE-2 Phase 1

Before either developer continues, verify:

-   no duplicate core models
-   workflow references use exact BE-1 model names
-   no competing role enum
-   no competing Asset lifecycle enum
-   no BE-1 file was rewritten by BE-2
-   no BE-2 workflow file was rewritten by BE-1
-   Allocation target relationship is valid
-   Transfer references Allocation/Asset correctly
-   Booking references the bookable Asset contract
-   Maintenance does not mutate Asset through model hooks
-   Audit Item has Audit Cycle + Asset uniqueness
-   central exports have one clear owner

Only after this review should the next phase prompt be given.

------------------------------------------------------------------------

# 8. One-Line Rule for Both Developers

> **Your current Gemini prompt is a single turn, not permission to
> finish the whole backend. Complete only the assigned phase, stop at
> the first other-developer dependency or phase boundary, report the
> handoff, and wait for the next explicit prompt.**
