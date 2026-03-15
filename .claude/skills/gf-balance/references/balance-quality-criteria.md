# Quality Gate Criteria -- Balance Stage

The balance quality reviewer agent loads this file when running the
post-completion quality gate on all balance output files. The gate produces
REVIEW.md listing what was checked, what was auto-fixed, and what needs user
input.

Source: Mirrors Phase 3-4's quality criteria pattern (8 auto-fix + 4 must-ask).
Adapted for Stage 3B numerical balance validation.

---

## Highest-Priority Constraint

**"Stage3B must not modify Stage3A table structure or primary/foreign keys."**
-- This is the #1 validation rule from the source specification
("Stage3B 不得改 Stage3A 表结构与主外键"). The quality gate verifies that all
frozen schema structures remain intact after balance value updates.

---

## Auto-Fix Categories (fix without asking user)

These are structural/mechanical issues the quality gate resolves automatically.
Auto-fixes are applied directly to balance files and logged in REVIEW.md.

### 1. Missing Table Columns in Balance Docs

A balance document table is missing one or more required columns as defined in
the corresponding template.

- **Detection:** Compare each table's column headers against the template
  specification. For example, the per-segment difficulty table must have 8
  columns: Segment, Pressure Source, Key Parameters, Parameter Range,
  Remediation, Expected Pass Rate, If Too Hard, If Too Easy.
- **Fix:** Add the missing column headers with empty cells. Flag the empty
  cells for the balance-generator agent to fill.
- **Log:** `[auto-fix] {file}: added missing column "{column_name}" to {table_name}`

### 2. Economy Flow Without Safety Nets for Choke Points

A resource in economy.md has choke points listed but no corresponding safety
nets.

- **Detection:** For each row in the Resource Flow Tables, check if the Choke
  Points column is non-empty while the Safety Nets column is empty.
- **Fix:** Add a placeholder safety net entry: `[NEEDS SAFETY NET: {choke_point}]`.
  This flags the gap for the user without inventing a game design solution.
- **Log:** `[auto-fix] economy.md: added safety net placeholder for resource "{resource}" choke point "{choke_point}"`

### 3. Tuning Entries Without Numeric Rollback Thresholds

A row in the Tuning Priority Table has a Rollback Condition that contains no
numeric value.

- **Detection:** Scan the Rollback Condition column for rows where no digit
  character (`0-9`) appears in the cell content.
- **Fix:** Append `[NEEDS THRESHOLD: add specific numeric value]` to the
  rollback condition. This preserves the existing text while flagging the
  missing specificity.
- **Log:** `[auto-fix] tuning.md: flagged rollback condition without numeric threshold for parameter "{parameter}"`

### 4. Difficulty Segments with Non-Monotonic Pass Rates

Expected pass rates in the per-segment difficulty table increase significantly
between consecutive segments.

- **Detection:** Parse the Expected Pass Rate column for each segment. If any
  segment's pass rate exceeds the previous segment's rate by more than 10
  percentage points, flag as non-monotonic.
- **Fix:** Reorder the segments to restore monotonicity, or flag the
  non-monotonic pair for review with `[NON-MONOTONIC: {segment_A} {rate_A}% -> {segment_B} {rate_B}%]`.
- **Log:** `[auto-fix] difficulty.md: flagged non-monotonic pass rate between "{segment_A}" ({rate_A}%) and "{segment_B}" ({rate_B}%)`

### 5. Missing Frontmatter Fields in Balance Files

A balance file (difficulty.md, economy.md, monetization.md, tuning.md) is
missing required frontmatter fields.

- **Detection:** Parse the YAML frontmatter of each balance file. Check for
  the required fields specified in the corresponding template's frontmatter
  schema.
- **Fix:** Add missing fields with default values:
  - `stage`: `03b-balance`
  - `status`: `draft`
  - `last_updated`: current date
  - File-specific fields: empty lists or 0 counts
- **Log:** `[auto-fix] {file}: added missing frontmatter field "{field}" with default "{value}"`

### 6. Protected Parameters List Missing for Systems with Commercialization

A system has commercialization constraints in its 7B (Category 3) but no
corresponding entries in monetization.md's Protected Parameters table.

- **Detection:** Collect all system IDs from monetization.md's
  Commercialization Boundary Summary table where Commercial Touchpoint is not
  `none`. Check that each such system has at least one row in the Protected
  Parameters table.
- **Fix:** Add a placeholder row: `| [NEEDS PARAMETER] | {SYS-ID} | [from 7B Category 3] | [NEEDS HARM ASSESSMENT] |`
- **Log:** `[auto-fix] monetization.md: added protected parameter placeholder for system "{sys_id}" which has commercialization constraints`

### 7. CSV Value Count Mismatch with Field Count

After balance value updates, a CSV file's data rows have a different number of
values than the header row's field count.

- **Detection:** For each CSV file in `.gf/stages/03a-data-schema/configs/`,
  count columns in the header row (field names) and compare against the column
  count in each data row.
- **Fix:** Regenerate the data rows to match the field count. If a row has
  too few values, pad with defaults. If too many, truncate to field count.
  Run `balance validate-freeze` to verify schema integrity.
- **Log:** `[auto-fix] {table_name}.csv: row {N} had {actual} values, expected {expected} -- regenerated`

### 8. Missing Self-Check Items in Tuning.md

The Self-Check Conclusions section in tuning.md is missing one or more of the
5 required check items.

- **Detection:** Parse the Self-Check Conclusions table in tuning.md. Verify
  all 5 check items are present: (1) 7B input traceability, (2) freeze
  integrity, (3) rollback completeness, (4) playability target, (5) contract
  consistency.
- **Fix:** Add the missing check items with status `FAIL` and evidence
  `[NOT YET VERIFIED]`. This ensures the checklist is complete while
  indicating the checks still need to be performed.
- **Log:** `[auto-fix] tuning.md: added missing self-check item #{N} "{check_name}" with FAIL status`

---

## Must-Ask Categories (NEVER auto-fill, always ask user)

These are creative or balance philosophy decisions that define the game's
difficulty and economy character. The quality gate must NEVER generate answers
for these -- it must present a specific question to the user and wait for their
response.

### 1. Difficulty Philosophy

Are the target pass rates appropriate for this game's audience?

- **Why never auto-fill:** Pass rate targets define the game's identity. A
  casual game with RPG-level difficulty will lose its audience. An RPG with
  casual-level ease will bore its players. Only the designer knows the
  intended audience tolerance.
- **Gate behavior:** If the genre-specific default ranges from
  lifecycle-phases.md were used without modification, ask:
  "The difficulty targets use default {genre} ranges (e.g., Tutorial
  {min}%-{max}%, Monetization {min}%-{max}%). Are these appropriate for your
  game's specific audience, or should they be adjusted? Consider: Is your
  audience more casual or hardcore than the genre average?"

### 2. Economy Pacing

Are choke points intentionally placed or design gaps?

- **Why never auto-fill:** Choke points can be deliberate design tools
  (creating tension and motivation) or accidental gaps (resource math that
  does not add up). Only the designer knows which choke points are intentional.
- **Gate behavior:** For each resource with choke points listed in economy.md,
  ask:
  "Resource '{resource}' has choke points at: {choke_list}. For each choke
  point, confirm: (a) this is an intentional design choice to create tension,
  (b) the safety net mechanism is adequate, or (c) this is an unintended gap
  that should be resolved."

### 3. Commercialization Boundaries

Should any additional parameters be protected from revenue optimization?

- **Why never auto-fill:** The protected parameters list may be incomplete.
  Some parameters are obviously protected (core difficulty anchors), but edge
  cases exist where monetization could subtly degrade experience without being
  obviously harmful.
- **Gate behavior:** After listing the current protected parameters, ask:
  "The following parameters are currently protected from monetization:
  {param_list}. Are there any additional parameters that should be protected?
  Consider: Are there any parameters where revenue-motivated adjustment would
  subtly degrade the player experience even if metrics do not immediately
  show harm?"

### 4. Tuning Granularity

Are adjustment step limits appropriate for live operations?

- **Why never auto-fill:** Step limits balance responsiveness (larger steps
  fix issues faster) against stability (smaller steps reduce risk of
  overcorrection). The right granularity depends on the game's update cadence,
  player base size, and risk tolerance.
- **Gate behavior:** Show the step limits from the Tuning Priority Table and
  ask:
  "The following adjustment step limits are defined: {param: limit pairs}.
  For each parameter, confirm: (a) the step size is appropriate for your
  expected update frequency, (b) the step size is small enough to avoid
  overcorrection, (c) the step size is large enough to have meaningful impact."

---

## REVIEW.md Output Format

The quality gate produces a REVIEW.md file in `.gf/stages/03b-balance/` with
this structure:

```markdown
# Balance Quality Review Results

## Summary

- Balance files reviewed: {N}/4
- Total parameters validated: {N}
- Resources analyzed: {N}
- Protected parameters: {N}
- Auto-fixes applied: {N}
- User decisions needed: {N}
- Self-check status: {PASS/FAIL}

## Validation Checks Passed

- [ ] All balance values trace to 7B inputs (no orphaned values)
- [ ] Schema structure unchanged from frozen version
- [ ] All 4 balance files have complete frontmatter
- [ ] Difficulty pass rates follow monotonic progression
- [ ] All resources have sources and sinks
- [ ] All choke points have safety nets
- [ ] All rollback conditions contain numeric thresholds
- [ ] All systems with commercialization have protected parameters
- [ ] CSV field counts match after value updates
- [ ] Self-check conclusions complete with all 5 items

## Auto-Fixed Issues

- [{file}] {description of fix}
- [{file}] {description of fix}

## Needs User Decision

### Decision 1: {title}

{question for user with options}

### Decision 2: {title}

{question for user with options}

## Economy Health

### Resource Flow Summary

| Resource | Net Per Day (Tutorial) | Net Per Day (Monetization) | Status |
|----------|-----------------------|---------------------------|--------|
| {name} | {value} | {value} | {OK/WARNING/CRITICAL} |

### Drought Risk Assessment

- Resources at risk of drought: {list or "None"}
- Choke points without safety nets: {count}
- Circular resource dependencies: {list or "None"}

## Difficulty Curve

### Pass Rate Progression

| Segment | Expected Pass Rate | Phase | Monotonic? |
|---------|-------------------|-------|------------|
| {name} | {rate}% | {phase} | {YES/NO} |

### Anomalies

- Non-monotonic pairs: {list or "None"}
- Segments outside genre range: {list or "None"}

## Freeze Integrity

- Tables checked: {N}
- Structure changes detected: {N}
- CSV sync status: {PASS/FAIL}
```

---

*Reference for: balance-quality-reviewer agent (gf-balance-quality-reviewer.md)*
*Source: Mirrors .claude/skills/gf-data-schema/references/schema-quality-criteria.md pattern*
