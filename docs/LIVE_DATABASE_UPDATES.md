# Live database updates

This file collects the SQL required by changes on `codex/bdc-work`. Append future database changes here in execution order so they can be applied together before deploying the corresponding code.

## How to apply

1. Back up the live database.
2. Open phpMyAdmin and select the live BDC database.
3. Run each SQL block below in numbered order using the SQL tab.
4. Record the application date under each entry after confirming success.

The queries below have been applied locally. They have not been applied to the live database by Codex.

## 1. Editable team section headings and descriptions

Added: 2026-10-01

Live application date: pending

Change: creates `team_sections` to store a heading and description for each camp's Chief Coordinator, Members, and Student Coordinators sections. Existing tables and columns are unchanged. No backfill is needed: sections without saved overrides retain their default text.

Run before deploying the team section editor. This query is safe to rerun when the table already exists with this definition.

```sql
CREATE TABLE IF NOT EXISTS team_sections (
  camp_id BIGINT UNSIGNED NOT NULL,
  group_key ENUM('CHIEF_COORDINATOR', 'MEMBERS', 'STUDENT_COORDINATORS') NOT NULL,
  heading VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (camp_id, group_key),
  CONSTRAINT fk_team_sections_camp FOREIGN KEY (camp_id) REFERENCES camps(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Optional verification:

```sql
SHOW CREATE TABLE team_sections;
```

## Maintaining this file

For every future database change in this work, append a numbered entry with its date, purpose, exact SQL, dependencies, and whether it is safe to rerun. Include data updates as well as new tables, columns, indexes, and constraints. Keep earlier entries intact and flag each new database change in the delivery message. Do not mark an entry applied live until the user confirms it.
