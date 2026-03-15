# System-to-Table Mapping Matrix Template

This template defines the output format for the system mapping matrix --
the first deliverable of Stage 3A. The schema-generator agent uses this
template to structure the mapping that bridges Stage 2 system designs to
Stage 3A table definitions.

Source: `game-implement-process/stage3/系统提示词_数据拆解与建表.md` section A1
(Stage2 系统承接映射矩阵).

---

## System Mapping Matrix

The mapping matrix connects every Stage 2 system and rule to its corresponding
Stage 3A data table. This matrix must be complete BEFORE any table field
definitions are written.

**Output format:**

```markdown
## System Mapping Matrix

| System ID | System Name | Key Rules | Table Name | Object | Layer | Status |
|-----------|-------------|-----------|------------|--------|-------|--------|
| SYS-CORE_GAMEPLAY-001 | Core Gameplay | RULE-CORE_GAMEPLAY-001, -002, -003 | core_gameplay_config | GameplayConfig | core_config | Mapped |
| SYS-LEVEL-001 | Level System | RULE-LEVEL-001, -002, -003 | level_config | Level | core_config | Mapped |
| SYS-LEVEL-001 | Level System | RULE-LEVEL-004 | level_rewards | LevelReward | core_config | Mapped |
| SYS-COMBAT-001 | Combat System | RULE-COMBAT-001, -002 | monster_config | Monster | core_config | Mapped |
| SYS-COMBAT-001 | Combat System | RULE-COMBAT-003 | drop_table | DropEntry | probability | Mapped |
```

**Column definitions:**

| Column | Content | Rules |
|--------|---------|-------|
| System ID | Stage 2 system identifier | Must match SYS-{NAME}-NNN from system files |
| System Name | Human-readable system name | Must match system file frontmatter |
| Key Rules | RULE IDs this table implements | At least one RULE-ID per row; comma-separated if multiple |
| Table Name | Stage 3A table name | snake_case, must be unique across entire schema |
| Object | Data object this table represents | PascalCase entity name |
| Layer | Table layer classification | One of: core_config, constants, probability, i18n, progress, periodic_rewards |
| Status | Mapping completeness | Mapped / Pending / Deferred |

**Status values:**

| Status | Meaning | Action |
|--------|---------|--------|
| Mapped | System/rules fully mapped to table with field definitions | No action needed |
| Pending | System mapped to table but field definitions not yet written | Write field definitions |
| Deferred | System intentionally excluded from this schema pass | Must include reason in Unmapped Rules section |

**Hard constraints:**
- Every Stage 2 system must have at least one row in the matrix
- Every config_driven RULE-ID from system files must appear in Key Rules
- A system may map to multiple tables (one row per table)
- A table may serve multiple systems (list all System IDs)
- All rule IDs from 7A data anchors must appear somewhere in the matrix

---

## Unmapped Rules Section

Rules that are NOT mapped to any table must be explicitly listed with
justification:

```markdown
### Unmapped Rules

| Rule ID | Rule Description | Reason |
|---------|-----------------|--------|
| RULE-TUTORIAL-005 | Tutorial skip animation | logic_driven -- no config table needed |
| RULE-UI-003 | Button highlight sequence | UI-only -- no data persistence |
```

**Acceptable reasons for unmapping:**
- `logic_driven` -- Rule is implemented purely in code, not driven by config data
- `UI-only` -- Rule affects only visual presentation, no data storage
- `deferred` -- Rule depends on a system deferred to a future phase
- `duplicate` -- Rule is handled by another rule's table mapping (reference which)

**Unacceptable reasons:**
- "Not needed" (without explanation)
- "Will handle later" (without specific phase/plan reference)
- Empty reason field

If there are no unmapped rules:
```markdown
### Unmapped Rules

| Rule ID | Rule Description | Reason |
|---------|-----------------|--------|
| (none -- all rules mapped) | | |
```

---

## Table Catalog

After the mapping matrix, a consolidated table catalog provides a summary
view of all tables:

```markdown
### Table Catalog

| Table Name | Layer | Purpose | Systems | Field Count | FK Count |
|-----------|-------|---------|---------|-------------|----------|
| level_config | core_config | Define level structure and objectives | SYS-LEVEL-001 | 12 | 2 |
| monster_config | core_config | Define monster types and combat attributes | SYS-COMBAT-001 | 10 | 1 |
| drop_table | probability | Configure item drop rates per monster/event | SYS-COMBAT-001, SYS-ECONOMY-001 | 6 | 2 |
| level_rewards | core_config | Map rewards to level completion | SYS-LEVEL-001, SYS-ECONOMY-001 | 8 | 3 |
| daily_login_rewards | periodic_rewards | Daily login reward schedule | SYS-DAILY-001 | 7 | 1 |
| game_constants | constants | Global game parameters and thresholds | (all systems) | 15 | 0 |
| i18n_strings | i18n | Localization text for all display strings | (all systems) | 4 | 0 |
| player_progress | progress | Player save data for progression tracking | SYS-GROWTH-001 | 20 | 5 |
```

**Column definitions:**

| Column | Content | Rules |
|--------|---------|-------|
| Table Name | snake_case table identifier | Must match mapping matrix Table Name values |
| Layer | Table layer from table-layers.md | One of the 6 layers |
| Purpose | One-sentence table description | Concrete and specific |
| Systems | System IDs that use this table | Comma-separated SYS-IDs |
| Field Count | Number of fields in the table definition | Updated after field definitions are written |
| FK Count | Number of id_ref fields (foreign keys) | Updated after field definitions are written |

**Constraints:**
- Every table in the mapping matrix must appear in the catalog
- No table should appear in the catalog without a mapping matrix entry
- Field Count and FK Count may initially be `--` (TBD) and updated after
  per-table field definitions are completed
- Tables shared across multiple systems list ALL system IDs

---

## Mapping Completeness Checklist

After completing the matrix and catalog, verify:

```markdown
### Mapping Completeness

- [ ] Every Stage 2 system has at least one mapped table
- [ ] Every config_driven rule has a table mapping
- [ ] All unmapped rules have documented reasons
- [ ] No table exists without a Stage 2 system source
- [ ] Table catalog matches mapping matrix (same set of tables)
- [ ] Layer assignments follow classification criteria from table-layers.md
- [ ] No duplicate table names across the entire schema
```

If any item is unchecked, the mapping is incomplete and field definitions
must NOT proceed until the gap is resolved.

---

*Template for: schema-generator agent (gf-schema-generator.md)*
*Source: game-implement-process/stage3/系统提示词_数据拆解与建表.md section A1*
