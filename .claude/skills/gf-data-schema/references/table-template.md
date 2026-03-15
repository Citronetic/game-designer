# Per-Table Field Definition Template

This reference defines the complete structure for each table definition in
`tables.md`. The schema-generator agent reads this to know what format every
table must follow. All content derived from the source specification
(`game-implement-process/stage3/系统提示词_数据拆解与建表.md` sections D, F, G, H).

---

## Table Header Block

Every table definition starts with a header block providing identity,
classification, and traceability:

```
### Table: {table_name}

**Purpose:** {one-sentence description of what this table configures}
**Layer:** {core_config | constants | probability | i18n | progress | periodic_rewards}
**Primary Key:** {field_name} ({type})
**Upstream:** System {SYS-ID}, Rules {RULE-ID-1}, {RULE-ID-2}
**Load Timing:** {startup | enter_level | settlement | realtime}
**Hot-Update:** {yes | no}
```

**Required fields -- all must be non-empty:**

| Field | Description | Allowed Values |
|-------|-------------|----------------|
| Table name | snake_case identifier | Lowercase, no spaces, no hyphens |
| Purpose | What this table configures | One concrete sentence |
| Layer | Table layer classification | One of 6 layers (see table-layers.md) |
| Primary Key | Uniqueness identifier | Field name + type |
| Upstream | Stage 2 traceability | At least one SYS-ID and one RULE-ID |
| Load Timing | When the game reads this table | One of 4 timings |
| Hot-Update | Whether live-ops can change this table without client release | yes or no |

---

## Field Definition Table

Every table must contain a field definition table with all 7 columns:

```
| Field | Type | Default | Required | Business Meaning | Validation | Example |
|-------|------|---------|----------|------------------|------------|---------|
| id | int | -- | Y | Unique identifier | > 0, unique | 1001 |
| name_key | string | -- | Y | i18n display name key | exists in i18n table | "monster_001" |
| hp | int | 100 | Y | Base hit points | 1-99999 | 500 |
| drop_rate | float | 0.0 | N | Item drop probability | 0.0-1.0 | 0.15 |
| is_boss | bool | false | N | Whether this is a boss monster | true/false | false |
| element | enum:Element | NORMAL | Y | Elemental affinity | valid Element value | FIRE |
| rewards | json | [] | N | Reward list structure | valid JSON array | [{"id":1,"qty":5}] |
| created_at | timestamp | NOW() | Y | Record creation time | ISO 8601 | "2024-01-15T10:30:00Z" |
| level_id | id_ref:level_config | -- | Y | Parent level reference | exists in level_config.id | 101 |
```

**Column definitions:**

| Column | Content | Rules |
|--------|---------|-------|
| Field | snake_case field name | Must be unique within the table |
| Type | Data type (see Supported Field Types below) | Must be a recognized type |
| Default | Default value when field is absent | Use `--` for "no default" (required fields) |
| Required | Y or N | Y means the field must be present in every row |
| Business Meaning | What this field represents in gameplay terms | Concrete, not vague |
| Validation | Constraints on allowed values | Range, format, reference, or enum check |
| Example | A realistic sample value | Must pass the validation rule |

---

## Supported Field Types

| Type | Description | CSV Representation | Example |
|------|-------------|-------------------|---------|
| int | Integer number | Plain number | 1001 |
| float | Decimal number | Decimal with period | 0.15 |
| string | Text value | Quoted if contains comma/newline | "Fire Sword" |
| bool | Boolean flag | true/false (lowercase) | true |
| enum:{EnumName} | Enumerated value | Enum key string | FIRE |
| json | JSON structure | Escaped JSON string | "[{\"id\":1}]" |
| timestamp | ISO 8601 date/time | ISO string | "2024-01-15T10:30:00Z" |
| id_ref:{TableName} | Foreign key reference | Value matching referenced PK | 101 |

**Type conventions:**
- `enum:{EnumName}` -- the EnumName must be defined in enums.md
- `id_ref:{TableName}` -- the TableName must exist in the table catalog; every
  value must exist as a primary key value in the referenced table
- `json` -- use sparingly; prefer flat fields or separate tables when possible

---

## Enum Definition Format

Enums are defined in `enums.md`. Each enum follows this structure:

```
### Enum: {EnumName}

**Used in:** {table_name}.{field_name}, {table_name}.{field_name}
**Extension strategy:** {append_only | versioned | frozen}

| Key | Display Name Key | Numeric Value | Description |
|-----|-----------------|---------------|-------------|
| NORMAL | element_normal | 0 | No elemental affinity |
| FIRE | element_fire | 1 | Fire element |
| WATER | element_water | 2 | Water element |
| EARTH | element_earth | 3 | Earth element |
```

**Rules:**
- Keys are UPPER_SNAKE_CASE and must be unique within the enum
- Display name keys reference the i18n table for localization
- Numeric values are sequential integers starting from 0
- Extension strategy determines how new values can be added:
  - `append_only` -- new values added at end, existing values never change
  - `versioned` -- changes require version migration
  - `frozen` -- no changes allowed after schema freeze

---

## ID Convention Format

ID conventions are defined per object type in `enums.md`:

```
### ID Convention: {ObjectType}

| Property | Value |
|----------|-------|
| Prefix | {PREFIX_} |
| Format | {PREFIX_}{NNN} |
| Length | {digits after prefix} |
| Type | {sequential | uuid} |
| Reserved Range | {range for special use} |
| Test Range | {range for test data} |
| Example | {PREFIX_001} |
```

**Global ID rules:**
- All IDs use snake_case prefix matching the object type
- Sequential IDs start at 001 (3+ digits, zero-padded)
- Reserved ranges (e.g., 900-999) for system/debug objects
- Test ranges (e.g., 000) for unit test fixtures
- IDs are immutable after schema freeze -- never reuse or reassign

---

## Compound Field Encoding

When a single field stores structured data as a string (instead of JSON or a
separate table), it must follow these encoding conventions:

### Separator Conventions

| Separator | Purpose | Example |
|-----------|---------|---------|
| `\|` (pipe) | List items | `SWORD\|SHIELD\|POTION` |
| `:` (colon) | Key-value pairs | `ATK:50\|DEF:30\|SPD:10` |
| `;` (semicolon) | Groups of related data | `1:SWORD:5;2:SHIELD:3` |
| `,` (comma) | NEVER used as separator in compound fields | Reserved for CSV format |

### Encoding Rules

1. **Order matters** -- position has meaning; document each position
2. **No nesting beyond 2 levels** -- if you need 3+ levels, use JSON or a
   separate table instead
3. **Empty segments** -- use empty string between separators (e.g., `A||C`
   means second item is empty)
4. **Escape rule** -- if a value itself contains a separator character, the
   field must use JSON type instead of compound encoding

### Compound Field Examples

```
# List of item IDs (pipe-separated)
Field: reward_items
Type: string
Encoding: ITEM_001|ITEM_002|ITEM_003
Meaning: [item_id_1]|[item_id_2]|[item_id_3]

# Key-value pairs (colon for k:v, pipe between pairs)
Field: stat_bonuses
Type: string
Encoding: ATK:50|DEF:30|SPD:10
Meaning: [stat_key]:[value]|[stat_key]:[value]

# Grouped data (semicolon between groups, colon within)
Field: drop_table
Type: string
Encoding: 1:ITEM_001:50;2:ITEM_002:30;3:GOLD:20
Meaning: [slot]:[item_id]:[weight];[slot]:[item_id]:[weight]
```

### Parsing Rules

For each compound field, the table definition must include:
- **Encoding format** -- the separator pattern with positional meaning
- **Parsing pseudo-code** -- how to split and interpret the string
- **Invalid encoding handling** -- what happens if the string cannot be parsed
  (typically: log error + use default value)

---

## Exception Handling Block

Every table definition must include an exception handling block:

```
**Exception Handling:**
- **Missing field:** {strategy}
- **Invalid value:** {strategy}
- **Missing FK reference:** {strategy}
```

**Strategy options per exception type:**

| Exception | Strategy Options |
|-----------|-----------------|
| Missing field | `use_default` (apply the Default column value) / `reject_row` (skip entire row, log error) / `block_load` (refuse to load table, fatal) |
| Invalid value | `clamp_to_range` (force to nearest valid value) / `use_default` / `reject_row` / `block_load` |
| Missing FK reference | `set_null` (clear the reference) / `reject_row` / `block_load` / `use_fallback:{value}` |

**Rules:**
- Core config tables (Layer 1) should use `block_load` for missing required
  fields -- corrupted core data should not load silently
- Constants tables (Layer 2) should use `use_default` where possible --
  missing constants can safely fall back to defaults
- Probability tables (Layer 3) should use `clamp_to_range` for invalid values
  -- out-of-range probabilities should be clamped, not rejected

---

## Save/Archive Section

Tables that contribute to save data include a save/archive section:

```
**Save Data:**
- **Persisted fields:** {field1}, {field2}, {field3}
- **Archive format:** JSON object with version field
- **Version:** {integer, incremented on schema changes}
- **Write timing:** {on_settlement | on_change | periodic}

**Archive JSON Structure:**
{
  "version": 1,
  "table_name": {
    "field1": value,
    "field2": value
  }
}
```

**Rules:**
- Only Layer 5 (progress) and select Layer 6 (periodic_rewards) tables
  persist in save data
- Layer 1-4 tables are config data and are NOT saved -- they are loaded
  from config files
- Every save structure must include a `version` integer field for migration
- Write timing determines when changes are flushed to persistent storage

---

## Migration Strategy Section

Tables that may change between versions include a migration section:

```
**Migration:**
- **Version:** {current_version_integer}
- **Field addition:** {strategy for new fields added in future versions}
- **Field removal:** {strategy for deprecated fields}
- **Field rename:** {strategy for renamed fields}
- **Hot-update considerations:** {what to do if table is hot-updatable}
```

**Migration strategies:**

| Change Type | Strategy | Description |
|-------------|----------|-------------|
| Field addition | `add_with_default` | New field added, existing rows use default value |
| Field removal | `ignore_on_load` | Old field in data is ignored, not loaded |
| Field rename | `alias_mapping` | Old name maps to new name during load |
| Type change | `convert_on_load` | Old type is converted to new type during load |

**Hot-update migration rules:**
- Hot-updatable tables must support in-place reload without restart
- Version mismatch between main table and sub-table must be detected and
  logged (see table-layers.md hot-update matrix)
- Migration must be backward-compatible for at least 1 version

---

## ER Relationship Row Format

Relationships between tables are documented in `relationships.md` using text
tables (no Mermaid diagrams -- per user decision):

```
| Main Table | Related Table | Type | FK Field | Cascade Rule |
|-----------|---------------|------|----------|--------------|
| level_config | monster_config | 1:N | level_id | CASCADE |
| monster_config | drop_table | 1:N | monster_id | CASCADE |
| level_config | level_rewards | 1:1 | level_id | CASCADE |
| skill_config | monster_config | N:M | (via monster_skills junction) | SET_NULL |
```

**Relationship types:**
- `1:1` -- One-to-one: each row in main table has exactly one related row
- `1:N` -- One-to-many: each row in main table can have multiple related rows
- `N:M` -- Many-to-many: requires a junction table (note the junction table
  name in the FK Field column)

**Cascade rules:**
- `CASCADE` -- When main row is deleted, related rows are also deleted
- `SET_NULL` -- When main row is deleted, FK in related rows is set to null
- `RESTRICT` -- Deletion of main row is blocked if related rows exist
- `NO_ACTION` -- No automatic handling; application logic must manage

**Rules:**
- Every `id_ref:{TableName}` field in any table definition must have a
  corresponding row in the relationships table
- Junction tables for N:M relationships need their own table definition
  in tables.md (with both FK fields as a composite primary key)
- Orphan references (FK values pointing to non-existent PK values) are
  forbidden -- validated at schema quality gate

---

## Complete Table Definition Example

```markdown
### Table: monster_config

**Purpose:** Define all monster types with combat attributes and visual references
**Layer:** core_config
**Primary Key:** id (int)
**Upstream:** System SYS-COMBAT-001, Rules RULE-COMBAT-001, RULE-COMBAT-003
**Load Timing:** startup
**Hot-Update:** no

| Field | Type | Default | Required | Business Meaning | Validation | Example |
|-------|------|---------|----------|------------------|------------|---------|
| id | int | -- | Y | Unique monster identifier | > 0, unique | 1001 |
| name_key | string | -- | Y | i18n display name key | exists in i18n table | "monster_slime" |
| element | enum:Element | NORMAL | Y | Elemental affinity | valid Element value | FIRE |
| hp | int | 100 | Y | Base hit points | 1-99999 | 500 |
| atk | int | 10 | Y | Base attack power | 1-9999 | 45 |
| def | int | 5 | Y | Base defense value | 0-9999 | 20 |
| drop_table_id | id_ref:drop_table | -- | N | Loot drop configuration | exists in drop_table.id | 201 |
| is_boss | bool | false | N | Boss monster flag | true/false | false |
| stat_bonuses | string | "" | N | Compound stat modifiers | valid encoding (ATK:N\|DEF:N) | "ATK:10\|DEF:5" |
| level_range | string | "1|99" | Y | Min\|Max level appearance range | two pipe-separated ints | "5|25" |

**Compound Field: stat_bonuses**
- Encoding: `{STAT_KEY}:{VALUE}|{STAT_KEY}:{VALUE}`
- Parse: split by `|`, then split each by `:` into [key, value]
- Invalid: log warning, treat as empty (no bonus applied)

**Compound Field: level_range**
- Encoding: `{min_level}|{max_level}`
- Parse: split by `|` into [min, max], both integers
- Invalid: use default "1|99"

**Sample Data:**

| id | name_key | element | hp | atk | def | drop_table_id | is_boss | stat_bonuses | level_range |
|----|----------|---------|-----|-----|-----|--------------|---------|-------------|-------------|
| 1001 | monster_slime | NORMAL | 100 | 10 | 5 | 201 | false | | 1\|10 |
| 1002 | monster_wolf | NORMAL | 250 | 25 | 15 | 202 | false | ATK:5 | 5\|20 |
| 1003 | monster_dragon | FIRE | 5000 | 200 | 100 | 203 | true | ATK:50\|DEF:30 | 20\|30 |

**Exception Handling:**
- Missing field: block_load (core config must be complete)
- Invalid value: clamp_to_range (force hp/atk/def to valid range, log warning)
- Missing FK reference: reject_row (monster without valid drop table is skipped)

**Save Data:** None (config table, not player data)

**Migration:**
- Version: 1
- Field addition: add_with_default
- Field removal: ignore_on_load
- Field rename: alias_mapping
- Hot-update considerations: N/A (not hot-updatable)
```

---

*Reference for: schema-generator agent (gf-schema-generator.md)*
*Source: game-implement-process/stage3/系统提示词_数据拆解与建表.md sections D, F, G, H*
