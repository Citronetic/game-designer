---
name: gf-data-schema
description: "Stage 3A: Generate data schemas from system designs"
disable-model-invocation: true
allowed-tools: [Read, Write, Bash, Task]
---

# /gf:data-schema -- Stage 3A: Data Schema

Generate data schemas from your completed system designs. The schema generator reads all 7A data anchors from system files, produces a complete schema (tables, relationships, enums, save/archive, migration), exports CSV config files, then runs a quality gate to validate everything before schema freeze.

## Step 1: Load Project State

Run:
```
!`node bin/gf-tools.cjs init progress`
```

- If `project_exists` is `false`: Display "No Game Forge project found. Run `/gf:new-game` to start." **Stop.**

**Auto-mode detection:** Check `$ARGUMENTS` for `--auto` flag. Store as `AUTO_MODE` (true/false). When `AUTO_MODE` is true, all user interaction is skipped and the entire data schema stage runs in a single autonomous pass.

- Check `stages.system_design` -- if not `complete` **and NOT `AUTO_MODE`**: Display "Stage 3A requires system design to be complete. Run `/gf:system-design` first." **Stop.**
  - **If `AUTO_MODE`:** Skip prerequisite check (the auto pipeline just completed system design stage).

Load configuration:
```
!`node bin/gf-tools.cjs config-get language`
```

Store as `LANGUAGE`.

## Step 1.5: Determine Session Granularity

**If `AUTO_MODE`:** Skip session granularity calculation and split prompt entirely. Auto mode always uses a single pass regardless of system count. Proceed directly to Step 2.

Run:
```
!`node bin/gf-tools.cjs system-design system-status`
```

Count confirmed systems from the response.

Adjust generation strategy:
- 3-8 systems: Single pass (current default) -- generate all tables at once
- 9+ systems: Consider splitting into 2 passes. Display to user:
  "Your game has {N} systems. For best quality, consider running /gf:data-schema twice:
   first for systems 1-{N/2}, then for the remainder. Or continue with single pass."
  Wait for user preference.

## Step 2: Check Freeze Status and Existing Schema

Run:
```
!`node bin/gf-tools.cjs data-schema freeze-status`
```

**If frozen (`frozen: true`):**

**If `AUTO_MODE` and frozen:** Display: "Schema already frozen (auto mode). Skipping to completion." Skip to Step 7 (display progress) and complete.

**If NOT `AUTO_MODE` and frozen:**
Display: "Schema is frozen for balance work. To modify, you must unfreeze first (this invalidates any balance work done on the frozen schema). Unfreeze? [y/N]"
- If user says yes: Run `node bin/gf-tools.cjs data-schema unfreeze`
- If no: Display current schema summary and run `node bin/gf-tools.cjs progress full`. **Stop.**

**Check for existing schema:**
Check if `.gf/stages/03a-data-schema/tables.md` exists:
```
!`ls .gf/stages/03a-data-schema/tables.md 2>/dev/null && echo "EXISTS" || echo "NOT_FOUND"`
```

Also check if `.gf/stages/03a-data-schema/REVIEW.md` exists (quality gate already run):
```
!`ls .gf/stages/03a-data-schema/REVIEW.md 2>/dev/null && echo "EXISTS" || echo "NOT_FOUND"`
```

## Step 3: Branch Based on State

**If `AUTO_MODE`:** Always take the Generate path (Step 4), then automatically continue through Review (Step 5) and Freeze (Step 6) without stopping. The entire generate-review-freeze pipeline runs in one pass.

Determine which flow to follow based on current state:

- **Generate** (tables.md does NOT exist): Schema has not been generated yet. Go to **Step 4**.
- **Review** (tables.md exists but schema is NOT frozen): Schema exists but hasn't passed quality gate or user wants to re-validate. Go to **Step 5**.
- **Freeze** (tables.md exists, REVIEW.md exists with no outstanding decisions, user wants to freeze): Ready for freeze. Go to **Step 6**.

If the user explicitly says they want to review, go to Step 5. If the user explicitly says they want to freeze, go to Step 6. Otherwise, default to the first applicable branch.

## Step 4: Extract Anchors and Spawn Schema Generator

### 4a. Extract 7A Anchors

Run:
```
!`node bin/gf-tools.cjs data-schema extract-anchors`
```

Parse the JSON response. Display anchor summary:
"Found **{N} tables** from **{M} systems** via 7A data anchors."

List each anchor briefly: table name, purpose, source system.

### 4b. Update State

```
!`node bin/gf-tools.cjs state update data_schema in_progress`
```

### 4c. Spawn Schema Generator Agent

Gather context for the agent:
- Read all system design files from `.gf/stages/02-system-design/systems/*.md`
- Collect the full anchor JSON from extract-anchors output

Spawn `.claude/agents/gf-schema-generator.md` via the Task tool with:

```
You are generating the complete data schema from Stage 2 system designs.

**7A Anchor Data:**
{paste full JSON from extract-anchors}

**Language:** {LANGUAGE} -- ALL schema content must be in this language (table purposes, business meanings, comments). Field names, type keywords, and enum keys remain in English.

**Output directory:** .gf/stages/03a-data-schema/

**Reference files to read:**
- .claude/skills/gf-data-schema/references/table-template.md (field definition format)
- .claude/skills/gf-data-schema/references/table-layers.md (6-layer classification)
- .claude/skills/gf-data-schema/templates/mapping-matrix-template.md (mapping matrix format)
- .claude/skills/gf-data-schema/templates/sample-data-template.md (sample data requirements)

**System design files to read for cross-reference:**
{list all .gf/stages/02-system-design/systems/*.md files}

**CLI commands available:**
- node bin/gf-tools.cjs data-schema export-csv  (run after all files written to sync CSV)
- node bin/gf-tools.cjs data-schema validate  (run to check referential integrity)

**Output files to produce:**
1. tables.md -- mapping matrix + table catalog + all per-table field definitions + sample data
2. relationships.md -- text-only ER relationship tables (NO Mermaid diagrams)
3. enums.md -- enum definitions + ID conventions + compound field encoding
4. save-schema.md -- save/archive JSON structures for progress tables
5. migration.md -- version migration strategy + hot-update matrix + rollback plan

**Constraints:**
- NEVER generate Mermaid diagrams -- text tables only for ER relationships
- NEVER invent tables not traceable to a 7A anchor -- "ghost tables" are the #1 prohibited item
- NEVER leave a field without type, default, and validation -- partial field definitions are forbidden
- CSV is auto-generated via CLI command, do NOT manually write CSV files
- Every table must be assigned to exactly one of the 6 layers
- Sample data is "sample, not balanced" -- clearly marked as placeholder values
- Sample data must maintain cross-table referential integrity (no orphan FK references)
- Generate sample data in dependency order (independent tables first via FK topological sort)
- 5-15 rows per core table, 3-5 for constants/probability/i18n/progress/periodic_rewards
```

### 4d. Post-Generation

After the agent completes:

Run CSV export to sync:
```
!`node bin/gf-tools.cjs data-schema export-csv`
```

Display: "Schema generated with **{files_written}** CSV config files. Review the output, then run `/gf:data-schema` again to validate and freeze."

Show progress:
```
!`node bin/gf-tools.cjs progress full`
```

## Step 5: Run Quality Gate

Display: "Running schema quality gate..."

### 5a. Extract Anchors for Traceability

```
!`node bin/gf-tools.cjs data-schema extract-anchors`
```

### 5b. Run Validation

```
!`node bin/gf-tools.cjs data-schema validate`
```

Display validation results (valid/invalid, any issues found).

### 5c. Spawn Quality Reviewer Agent

Spawn `.claude/agents/gf-schema-quality-reviewer.md` via the Task tool:

```
Run the data schema quality gate.

**Schema files location:** .gf/stages/03a-data-schema/
  - tables.md (mapping matrix + table definitions + sample data)
  - relationships.md (ER relationship tables)
  - enums.md (enum definitions + ID conventions)
  - save-schema.md (save/archive structures)
  - migration.md (migration strategy)

**Quality criteria:** .claude/skills/gf-data-schema/references/schema-quality-criteria.md
**Language:** {LANGUAGE} -- REVIEW.md content in this language

**7A Anchor Data (for traceability check):**
{paste full anchor JSON}

**Validation results (from data-schema validate):**
{paste validation JSON results}

**CLI commands available:**
- node bin/gf-tools.cjs data-schema validate  (referential integrity check)
- node bin/gf-tools.cjs data-schema export-csv  (regenerate CSV from markdown)

**Instructions:**
- Read all 5 schema files from .gf/stages/03a-data-schema/
- Read schema-quality-criteria.md for the 8 auto-fix + 4 must-ask classification rules
- Validate traceability: every table traces to a 7A anchor, no ghost tables
- Validate field completeness: all 7 columns in every field definition table
- Validate layer classification: every table assigned to exactly one layer
- Validate relationships: every id_ref field has a relationship entry
- Validate enums: every enum:{Name} field type has an enum definition
- Validate sample data integrity: run data-schema validate CLI command
- Validate CSV sync: field counts match between markdown and CSV
- Apply auto-fixes directly to schema files (8 categories from quality criteria)
- NEVER auto-fill must-ask decisions (table merging, compound encoding, cascade rules, archive scope)
- Write REVIEW.md to .gf/stages/03a-data-schema/REVIEW.md
- After auto-fixes: run data-schema export-csv to resync CSV files
{IF AUTO_MODE:}
**AUTO MODE:** For must-ask items, use AI best judgment instead of flagging for user decision. Apply your recommendation directly. Log what you decided in REVIEW.md under a new 'Auto-Resolved Decisions' section.
{END IF}
```

### 5d. After Quality Gate

**If `AUTO_MODE`:**
- Skip presenting REVIEW.md to user. Skip collecting user decisions.
- Proceed directly to Step 6 (freeze gate).

**If NOT `AUTO_MODE`:**
Read and display `.gf/stages/03a-data-schema/REVIEW.md` contents to the user.

**If REVIEW.md has "Needs User Decision" items:**
- Present each decision to the user and collect their answers.
- Apply their decisions to the relevant schema files.
- Re-run the quality gate to verify all issues are resolved.

**If all checks pass (no user decisions needed):**
- Display: "Schema validated. Run `/gf:data-schema` again to freeze the schema before balance work."

Show progress:
```
!`node bin/gf-tools.cjs progress full`
```

## Step 6: Freeze Gate

**If `AUTO_MODE`:**
- Skip the freeze summary display and confirmation prompt.
- Auto-confirm freeze. Run freeze command, update state, commit.
- Run freeze: `!`node bin/gf-tools.cjs data-schema freeze``
- Update state to complete: `!`node bin/gf-tools.cjs state update data_schema complete``
- Commit schema files: `!`node bin/gf-tools.cjs commit "feat(data-schema): freeze schema v1" --files .gf/stages/03a-data-schema/``
- Display: "Data schema frozen (auto mode). Proceeding to next stage..."
- Skip to Step 7.

**If NOT `AUTO_MODE`:**

Display freeze summary by reading schema files:
- Count tables, total fields, relationships, enum definitions, CSV files
- Present: "**Schema Freeze Summary:** {N} tables, {M} fields, {R} relationships, {E} enums, {C} CSV config files"

Display freeze boundary:
```
**Freeze Boundary:**

LOCKED after freeze (cannot change without unfreeze):
- Table names
- Field names
- Field types
- Primary keys
- Foreign key references
- Relationship structure (1:1, 1:N, N:M)

ADJUSTABLE after freeze (can change during balance work):
- Default values
- Validation ranges
- Sample data values
- Enum display names
```

Ask user: "**Confirm schema freeze?** Balance work (Stage 3B) requires a frozen schema. Unfreezing later will invalidate any balance work done. [y/N]"

**If user confirms (yes):**

Run freeze:
```
!`node bin/gf-tools.cjs data-schema freeze`
```

Update state to complete:
```
!`node bin/gf-tools.cjs state update data_schema complete`
```

Commit schema files:
```
!`node bin/gf-tools.cjs commit "feat(data-schema): freeze schema v1" --files .gf/stages/03a-data-schema/`
```

Display: "Schema frozen. Ready for Stage 3B numerical balance. Run `/gf:balance`."

**If user declines (no):**

Display: "Schema not frozen. You can continue reviewing and modifying the schema. Run `/gf:data-schema` again when ready to freeze."

## Step 7: Display Progress

```
!`node bin/gf-tools.cjs progress full`
```

## Constraints

These rules are locked decisions and must never be violated:

- **Automated generation from 7A anchors:** The schema generator reads all 7A anchors at once and produces the complete schema. No per-table questioning -- 7A anchors provide sufficient input for automated generation.
- **5 output files by concern:** tables.md (mapping matrix + table definitions + sample data), relationships.md (text-only ER tables), enums.md (enums + IDs + compound encoding), save-schema.md (save/archive structures), migration.md (migration + hot-update).
- **Text tables only for ER relationships:** NO Mermaid diagrams -- text-only relationship tables with Main Table, Related Table, Type, FK Field, Cascade Rule columns.
- **No ghost tables:** Every table must trace to a 7A anchor from a Stage 2 system. Tables without traceability are rejected by the quality gate.
- **CSV auto-generated via CLI:** CSV config files in `configs/` subdirectory are generated by `node bin/gf-tools.cjs data-schema export-csv`, never manually written. Markdown is the source of truth.
- **Quality gate before freeze:** The quality reviewer must validate all schema files before freeze is offered. 8 auto-fix categories (structural) + 4 must-ask categories (creative decisions) per schema-quality-criteria.md.
- **Explicit freeze confirmation:** User must explicitly confirm before schema is frozen. Freeze locks structure; defaults/ranges/sample values remain adjustable.
- **Sample data is "not balanced":** Values are structural placeholders for validation only. Stage 3B fills real tuned values.
- **6-layer table architecture:** Every table classified into one of: core_config, constants, probability, i18n, progress, periodic_rewards per table-layers.md.
- **Auto mode:** When `--auto` flag is present, all user interaction is skipped. Session split prompts are bypassed (always single pass). Quality gate must-ask items are resolved by AI judgment. Freeze is auto-confirmed without user prompt. The structural quality (traceability, field completeness, layer classification) is identical to interactive mode.
