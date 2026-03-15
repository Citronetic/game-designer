# Quality Gate Criteria -- Data Schema Stage

The schema quality reviewer agent loads this file when running the
post-completion quality gate on all data schema output files. The gate
produces REVIEW.md listing what was checked, what was auto-fixed, and what
needs user input.

Source: Mirrors Phase 3's `quality-criteria.md` pattern (8 auto-fix +
4 must-ask). Adapted for Stage 3A data schema validation.

---

## Highest-Priority Constraint

**"Only build tables that map to Stage 2 systems. No invented systems or
tables."** -- This is the #1 validation rule from the source specification.
Every table in the schema must trace back to a 7A data anchor in a Stage 2
system file. Tables without traceability are rejected.

---

## Auto-Fix Categories (fix without asking user)

These are structural/mechanical issues the quality gate resolves automatically.
Auto-fixes are applied directly to schema files and logged in REVIEW.md.

### 1. Missing Field Definitions

Table listed in the table catalog but no per-table field definition section
exists in tables.md.

- **Detection:** Compare the table catalog (mapping-matrix) against the
  per-table sections in tables.md. Every table name in the catalog must have
  a corresponding `### Table: {table_name}` section with a field definition
  table.
- **Fix:** Generate the missing field definition section using the table's
  purpose, layer, and upstream system rules. Apply the field definition format
  from table-template.md. Include at minimum: id (primary key), name_key (if
  player-visible), and fields inferred from the mapped rules.
- **Log:** `[auto-fix] Added field definitions for table {table_name} -- inferred from {system_id} rules {rule_ids}`

### 2. Incomplete Field Specs

A field row in the definition table is missing required columns (type,
default, or validation).

- **Detection:** Scan each field definition table for rows where the Type,
  Default, Required, or Validation columns are empty or contain only `?` or
  `TBD` placeholders.
- **Fix:** Infer the missing values:
  - Type: from field name conventions (e.g., `*_id` -> int, `*_key` -> string,
    `*_rate` -> float, `is_*` -> bool)
  - Default: from type (int -> 0, float -> 0.0, string -> "", bool -> false)
  - Validation: from type and range context (int -> "> 0", float -> "0.0-1.0")
- **Log:** `[auto-fix] {table_name}.{field_name}: filled missing {column} = {value}`

### 3. Missing Table Layer Classification

Table defined in tables.md but not assigned to one of the 6 layers in the
table catalog or header block.

- **Detection:** Check each table's header block for a non-empty Layer field.
  Cross-reference against the table catalog's Layer column.
- **Fix:** Classify the table using the decision tree in table-layers.md:
  player-specific -> progress; time-bound rewards -> periodic_rewards;
  localization -> i18n; probability/weights -> probability; global params ->
  constants; game objects -> core_config.
- **Log:** `[auto-fix] {table_name}: assigned to layer {layer} -- classification: {reason}`

### 4. Missing Relationship Entries

A field with type `id_ref:{TableName}` exists in a table definition but
there is no corresponding row in relationships.md.

- **Detection:** Scan all field definition tables for fields of type
  `id_ref:{TableName}`. For each such field, check that relationships.md
  contains a row where Main Table or Related Table matches and the FK Field
  matches the field name.
- **Fix:** Add a new row to relationships.md:
  - Main Table: the referenced table (from id_ref:{TableName})
  - Related Table: the table containing the FK field
  - Type: default to 1:N (one main row to many related rows)
  - FK Field: the field name
  - Cascade Rule: default to CASCADE for core_config, SET_NULL for others
- **Log:** `[auto-fix] Added relationship: {main_table} -> {related_table} via {fk_field} (1:N, CASCADE)`

### 5. Missing Enum Definitions

A field's type references `enum:{EnumName}` but the enum is not defined
in enums.md.

- **Detection:** Collect all `enum:{EnumName}` type references from field
  definition tables. Check that each EnumName has a corresponding
  `### Enum: {EnumName}` section in enums.md.
- **Fix:** Generate a placeholder enum definition with:
  - At least 3 values inferred from context (field name, table purpose)
  - UPPER_SNAKE_CASE keys
  - Sequential numeric values starting from 0
  - Extension strategy: `append_only` (safe default)
- **Log:** `[auto-fix] Added enum definition: {EnumName} with {N} values -- inferred from {table_name}.{field_name}`

### 6. Missing Exception Handling

A table definition has no exception handling block.

- **Detection:** Check each `### Table: {table_name}` section for the
  presence of an `**Exception Handling:**` block with the 3 required entries
  (missing field, invalid value, missing FK reference).
- **Fix:** Add the exception handling block using layer-appropriate defaults:
  - Layer 1 (core_config): missing field -> block_load, invalid value ->
    clamp_to_range, missing FK -> reject_row
  - Layer 2 (constants): all -> use_default
  - Layer 3 (probability): missing field -> use_default, invalid value ->
    clamp_to_range, missing FK -> reject_row
  - Layer 4 (i18n): all -> use_default (empty string for missing text)
  - Layer 5 (progress): missing field -> use_default, invalid value ->
    use_default, missing FK -> set_null
  - Layer 6 (periodic_rewards): missing field -> reject_row, invalid value ->
    reject_row, missing FK -> reject_row
- **Log:** `[auto-fix] {table_name}: added exception handling block (layer {layer} defaults)`

### 7. CSV Sync Drift

Markdown table field definitions have a different field count than the
corresponding CSV file's column count.

- **Detection:** For each table with a CSV export in `configs/`, count the
  columns in the CSV header row and compare against the field count in the
  markdown field definition table.
- **Fix:** Regenerate the CSV file from the current markdown definition using
  `syncCSVExports()`. The markdown definition is the source of truth -- CSV
  is always derived from it.
- **Log:** `[auto-fix] {table_name}.csv: regenerated -- field count was {csv_count}, expected {md_count}`

### 8. Missing Upstream Reference

A table definition has no System ID or Rule ID traceability in its header
block (no Upstream field or empty Upstream field).

- **Detection:** Check each table's header block for a non-empty Upstream
  field containing at least one `SYS-*` and one `RULE-*` reference.
- **Fix:** Look up the table name in the system mapping matrix. Copy the
  System ID and Key Rules into the table's Upstream field.
- **Log:** `[auto-fix] {table_name}: added upstream reference -- {system_id}, {rule_ids}`

---

## Must-Ask Categories (NEVER auto-fill, always ask user)

These are creative or architectural decisions that define the game's data
model. The quality gate must NEVER generate answers for these -- it must
present a specific question to the user and wait for their response.

### 1. Table Merging

Two or more systems reference similar or identically-named tables in their
7A anchors. Should these tables be merged into one or kept separate?

- **Why never auto-fill:** Table merging decisions affect the entire data
  architecture. Merging tables that should be separate creates coupling between
  unrelated systems. Keeping separate tables that should be merged creates
  data duplication and sync issues.
- **Gate behavior:** If the same table name (or very similar table names
  like `reward_table` and `rewards_config`) appear in multiple systems' 7A
  anchors with different purposes, flag and ask:
  "Table `{table_name}` is referenced by both `{system_A}` (for {purpose_A})
  and `{system_B}` (for {purpose_B}). Should these be: (a) merged into one
  table with both systems' fields, (b) kept as separate tables with distinct
  names, or (c) split into a shared base table + system-specific extension
  tables?"

### 2. Compound Field Encoding

A field could be represented as either a compound string (e.g., pipe-separated
values) or as a separate junction/child table. The choice is ambiguous.

- **Why never auto-fill:** Compound fields are compact but harder to query
  and validate. Separate tables are normalized but add complexity. The right
  choice depends on how the field will be used in the game engine (iteration
  speed, query patterns, update frequency).
- **Gate behavior:** If a field stores list-like or structured data and both
  compound encoding and a separate table are viable, flag and ask:
  "Field `{table_name}.{field_name}` stores {description}. Should this be:
  (a) a compound string field with pipe-separated values (compact, fast read),
  or (b) a separate child table with one row per value (normalized, queryable)?"

### 3. Cascade Rule Choice

A foreign key relationship needs a cascade rule, but the appropriate rule is
not obvious from context (e.g., should deleting a level also delete all its
rewards, or should rewards become orphaned?).

- **Why never auto-fill:** Cascade rules have irreversible consequences.
  CASCADE deletes can cause unintended data loss. RESTRICT can prevent
  necessary cleanup. The right choice depends on gameplay semantics (should
  removing a monster also remove its drops, or should drops persist as
  legacy content?).
- **Gate behavior:** If a relationship's cascade behavior has gameplay
  implications, flag and ask:
  "When a row in `{main_table}` is deleted, what should happen to related
  rows in `{related_table}` via `{fk_field}`? Options: (a) CASCADE -- delete
  related rows too, (b) SET_NULL -- keep related rows but clear the reference,
  (c) RESTRICT -- prevent deletion if related rows exist."

### 4. Archive Scope

It is unclear which tables or fields should be included in player save data
versus derived at runtime from config data.

- **Why never auto-fill:** Including too much in the save data creates bloated
  saves and migration burden. Including too little means player progress can
  be lost if config tables change. The boundary between "persisted state" and
  "derived state" is a game design decision.
- **Gate behavior:** If a table contains both config-like and progress-like
  fields, or if a Layer 1 table has fields that seem player-specific, flag
  and ask:
  "Table `{table_name}` has fields that could be either saved (persistent
  across sessions) or derived (recalculated from config). Which fields should
  be included in save data? Consider: {field_list}."

---

## REVIEW.md Output Format

The quality gate produces a REVIEW.md file in `.gf/stages/03a-data-schema/`
with this structure:

```markdown
# Data Schema Quality Review Results

## Summary

- Tables reviewed: {N}
- Total fields validated: {N}
- Relationships validated: {N}
- Enums validated: {N}
- Auto-fixes applied: {N}
- User decisions needed: {N}
- Mapping completeness: {mapped}/{total} systems ({percent}%)

## Validation Checks Passed

- [ ] All tables trace to Stage 2 systems (no ghost tables)
- [ ] All config_driven rules have table mappings
- [ ] All tables have field definitions with complete columns
- [ ] All tables have layer classification
- [ ] All id_ref fields have relationship entries
- [ ] All enum references have enum definitions
- [ ] All tables have exception handling blocks
- [ ] CSV exports match markdown field counts
- [ ] All tables have upstream system/rule references
- [ ] Cross-table referential integrity in sample data
- [ ] Compound field encoding documented with parsing rules

## Auto-Fixed Issues

- [{table_name}] {description of fix}
- [{table_name}] {description of fix}

## Needs User Decision

### Decision 1: {title}

{question for user with options}

### Decision 2: {title}

{question for user with options}

## Cross-Table Integrity

### Foreign Key Validation
- {table_a}.{fk_field} -> {table_b}.{pk_field}: {PASS/FAIL}
- Total FK chains validated: {N}/{N}

### Sample Data Integrity
- Orphan references found: {N}
- Missing PK values for FK references: {list or "None"}

## Table Layer Distribution

| Layer | Table Count | Tables |
|-------|-------------|--------|
| core_config | {N} | {names} |
| constants | {N} | {names} |
| probability | {N} | {names} |
| i18n | {N} | {names} |
| progress | {N} | {names} |
| periodic_rewards | {N} | {names} |

## Mapping Traceability

- Systems mapped: {N}/{N}
- Rules mapped: {N}/{N}
- Unmapped rules: {list or "None -- all rules mapped"}
```

---

*Reference for: schema-quality-reviewer agent (gf-schema-quality-reviewer.md)*
*Source: Mirrors .claude/skills/gf-system-design/references/quality-criteria.md pattern*
