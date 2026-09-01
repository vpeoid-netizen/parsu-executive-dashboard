# Import guide

## Supported files

- `.xlsx` (Partido State University Executive Dashboard workbook)
- `.csv` is accepted by the upload form; the current specialized parser is built around the official multi-sheet `.xlsx`

## Workflow

1. Sign in at `/admin/login`
2. Open **Upload dataset**
3. Choose the workbook
4. Review the parse summary
5. Inspect validation notes
6. Check **Publish immediately after validation** only after conflicts are understood

Uploads never overwrite public data unless publish is confirmed. Publishing archives the previous published version of each dataset and writes a new version.

## Sheets recognized

| Worksheet | Destination |
| --- | --- |
| 2 Academic Programs | `AcademicProgram` |
| 3 Faculty Members | `FacultySnapshot` |
| 4 Non-Teaching Personnel | `StaffSnapshot` |
| 5 Students - EnrollmentEmployab | `EnrollmentObservation`, `EmployabilityObservation` |
| 5 Students - Licensure ExamAwar | `LicensureObservation`, `StudentAward` |
| 7 University Peformance | `PerformanceObservation` |
| 8 Research Completed / Publication / Utilization | research tables |
| 9 Extension | `ExtensionProgram` |

## Validation

The importer preserves raw values and separately stores normalized numbers. It does **not**:

- fill blanks with zero
- invent missing KPIs
- silently reconcile cross-sheet totals

FY 2025 university licensure totals follow the university performance summary (306/381) rather than the detailed worksheet (306/378). Remaining cross-sheet mismatches are stored as `SOURCE_CONFLICT_*` issues.

## Repeat imports

Run the same upload later to create a new dataset version. Historical enrollment and performance periods remain in the imported file and are stored as separate observations.
