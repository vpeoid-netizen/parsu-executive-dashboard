# Data model

The operational source of truth is the database. The Excel workbook is an import source, not the application architecture.

## Organization

- `Campus`, `College`, `CollegeAlias`, `Office`
- Configurable `CategoryDefinition` rows for academic ranks, appointment types, education levels and staff groupings

## Time

`ReportingPeriod` stores fiscal year, academic year, semester, quarter, as-of date and date ranges. Enrollment uses academic year + semester. University performance uses fiscal year, with FY 2026 flagged as partial (`isPartial`, `asOfDate`).

## Data governance

- `Dataset` / `DatasetVersion` with statuses `DRAFT`, `VALIDATED`, `PUBLISHED`, `ARCHIVED`
- `ImportJob` for upload history
- `ValidationIssue` for missing fields, total mismatches and **source conflicts**
- `MetricDefinition` / `MetricObservation` for the KPI engine
- Only `PUBLISHED` records appear on the public site

## Domain records

Academic programs, faculty/staff snapshots, enrollment, licensure, awards, employability, performance observations, research (completed, publication, utilization, grants), extension, assets, infrastructure, budget, internationalization, officials, CMS pages, flagship programs and documents.

Personnel snapshots store category counts as JSON keyed by configurable category names rather than hard-coded rank columns.

## Security

`AdminUser`, `AdminSession`, `LoginAttempt`, `AuditLog`. Passwords are bcrypt hashed. Sessions are httpOnly cookies.

## Provenance

Dataset versions store source file, worksheet, import time, publisher and reporting period. Public pages expose a source label and reporting period without administrator-only internals.
