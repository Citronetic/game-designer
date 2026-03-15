# Gameplay Loop Sample Data Template

This template defines the requirements for minimum viable sample data that
the schema-generator agent must produce for every core table. Sample data
validates the schema structure and demonstrates one complete gameplay loop.

Source: `game-implement-process/stage3/系统提示词_数据拆解与建表.md` section J
(最小可玩样例数据要求).

---

## Purpose

Sample data serves 3 purposes:
1. **Schema validation** -- Proves that field types, constraints, and
   relationships are correctly defined by populating real values
2. **Referential integrity check** -- Verifies that all FK references point
   to existing PK values across tables
3. **Gameplay loop walkthrough** -- Demonstrates that one complete player
   journey is expressible with the defined schema

**Important:** Sample data is NOT balanced. Values are placeholders, clearly
marked as "sample, not balanced." Stage 3B (Numerical Balance) fills the
real tuned values later. The purpose here is structural correctness, not
gameplay quality.

---

## Minimum Viable Gameplay Loop

Sample data must cover one complete player journey:

```
New Player -> First Level -> Settlement -> Growth -> Next Level
```

**Breakdown:**

| Step | What Happens | Tables Exercised |
|------|-------------|------------------|
| New Player | Player account created, initial inventory granted | player_progress, game_constants |
| First Level | Player enters level 1, encounters content | level_config, monster_config (or equivalent) |
| Settlement | Level completes, rewards calculated and granted | level_rewards, drop_table, player_progress |
| Growth | Player uses rewards to upgrade or unlock | growth_config (or equivalent), player_progress |
| Next Level | Player enters level 2 with updated state | level_config (level 2 data), monster_config |

Every table in the schema must have sample data that participates in at
least one step of this loop. Tables not involved in the core loop still
need sample data (3-5 rows minimum) demonstrating their field structures.

---

## Rows Per Table

| Table Layer | Minimum Rows | Maximum Rows | Rationale |
|-------------|-------------|-------------|-----------|
| core_config | 5-15 | 20 | Enough to show variation (multiple levels, monsters, items) |
| constants | 3-5 | 10 | Small table; just enough to show parameter structure |
| probability | 3-5 | 10 | Enough to show weight distributions and edge cases |
| i18n | 5-10 | 20 | One entry per display key referenced in core tables |
| progress | 3-5 | 10 | Show initial state, mid-game state, and edge case |
| periodic_rewards | 3-5 | 7 | One entry per day of the week is natural |

---

## Cross-Table Referential Integrity

**Hard rule:** Every FK value in sample data MUST exist as a PK value in the
referenced table's sample data. No orphan references allowed.

### Integrity Checks

For every `id_ref:{TableName}` field in every table:
1. Collect all distinct values from that field in the sample data
2. Collect all distinct PK values from the referenced table's sample data
3. Every FK value must exist in the PK set
4. Log any missing references as errors

**Example validation:**

```
monster_config.drop_table_id references drop_table.id

Sample data:
  monster_config rows: drop_table_id = [201, 202, 203]
  drop_table rows:     id = [201, 202, 203, 204]

Result: PASS -- all FK values (201, 202, 203) exist in PK set
```

```
level_rewards.monster_id references monster_config.id

Sample data:
  level_rewards rows:  monster_id = [1001, 1002, 1005]
  monster_config rows: id = [1001, 1002, 1003]

Result: FAIL -- monster_id 1005 does not exist in monster_config
```

### Referential Integrity Across Compound Fields

Compound fields that embed ID references must also pass integrity checks:

- Split the compound field by its separator
- Extract the ID segments (by documented position)
- Verify each extracted ID exists in the referenced table

**Example:**

```
Field: reward_items (compound: ITEM_001|ITEM_002|ITEM_003)
Referenced table: item_config.id

Extracted IDs: [ITEM_001, ITEM_002, ITEM_003]
item_config rows: id = [ITEM_001, ITEM_002, ITEM_003, ITEM_004]

Result: PASS
```

---

## Edge Case Requirements

Sample data must exercise at least one instance of each edge case:

| Edge Case | Requirement | Why |
|-----------|-------------|-----|
| Compound field value | At least one table has a compound field with a populated sample value | Validates that the encoding format is parseable |
| Multi-reference FK | At least one table references 2+ other tables via FK | Validates multi-table join scenarios |
| Enum value coverage | At least one sample value per enum type | Validates that all enum keys are usable |
| Boolean flag variation | At least one true and one false per bool field | Validates that both states are handled |
| Optional field empty | At least one row with an empty optional field | Validates that defaults work correctly |
| Optional field filled | At least one row with a filled optional field | Validates that optional values are accepted |
| Maximum-length value | At least one string at or near expected max length | Validates string field capacity |

---

## Sample Data Output Format

Sample data appears in two places (both must contain identical data):

### 1. Markdown Tables (in tables.md)

Under each table definition's `**Sample Data:**` section:

```markdown
**Sample Data:**

| id | name_key | element | hp | atk | def | drop_table_id | is_boss |
|----|----------|---------|-----|-----|-----|--------------|---------|
| 1001 | monster_slime | NORMAL | 100 | 10 | 5 | 201 | false |
| 1002 | monster_wolf | NORMAL | 250 | 25 | 15 | 202 | false |
| 1003 | monster_dragon | FIRE | 5000 | 200 | 100 | 203 | true |

*Sample data -- not balanced. Values are structural placeholders.*
```

### 2. CSV Exports (in configs/)

```csv
id,name_key,element,hp,atk,def,drop_table_id,is_boss
int,string,enum:Element,int,int,int,id_ref:drop_table,bool
1001,monster_slime,NORMAL,100,10,5,201,false
1002,monster_wolf,NORMAL,250,25,15,202,false
1003,monster_dragon,FIRE,5000,200,100,203,true
```

**CSV rules:**
- First row: field names (must match markdown column headers exactly)
- Second row: field types (for documentation, matches field definition types)
- Remaining rows: sample data (must match markdown sample data exactly)
- UTF-8 encoding with BOM prefix for Excel compatibility
- RFC 4180 escaping for values containing commas, quotes, or newlines

---

## Dependency Order for Generation

Sample data must be generated in dependency order to ensure referential
integrity. Independent tables (no FK fields) are generated first; dependent
tables are generated after their referenced tables.

### Generation Order

```
Phase 1: Independent tables (no FK references)
  - game_constants
  - i18n_strings
  - enum reference tables

Phase 2: Tables referencing only Phase 1 tables
  - monster_config (references i18n_strings)
  - item_config (references i18n_strings)
  - level_config (references i18n_strings)

Phase 3: Tables referencing Phase 1 or Phase 2 tables
  - drop_table (references monster_config, item_config)
  - level_rewards (references level_config, item_config)
  - monster_skills (references monster_config, skill_config)

Phase 4: Tables referencing Phase 1-3 tables
  - player_progress (references level_config, item_config)
  - daily_login_rewards (references item_config)

(Continue until all tables have sample data)
```

### Dependency Resolution Rules

1. Parse all field definitions for `id_ref:{TableName}` fields
2. Build a dependency graph: table A depends on table B if A has an
   `id_ref:B` field
3. Topological sort the graph
4. Generate sample data in topological order
5. If circular dependencies exist, break the cycle by generating one table
   with placeholder FK values, then updating after the referenced table's
   sample data is generated

---

## Sample Data Completeness Checklist

After generating all sample data, verify:

```markdown
### Sample Data Completeness

- [ ] Every table in the catalog has sample data
- [ ] Row counts meet minimum per layer (see Rows Per Table)
- [ ] All FK values exist as PK values in referenced tables
- [ ] At least one compound field value is populated
- [ ] At least one value per enum type is used
- [ ] Both true and false values exist for every bool field
- [ ] At least one optional field is empty and one is filled
- [ ] Markdown sample data matches CSV export data
- [ ] One complete gameplay loop is expressible with the sample data
- [ ] All sample data is marked as "not balanced"
```

---

*Template for: schema-generator agent (gf-schema-generator.md)*
*Source: game-implement-process/stage3/系统提示词_数据拆解与建表.md section J*
