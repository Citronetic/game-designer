# Difficulty Curve Output Template

This template defines the output format for `difficulty.md` in
`.gf/stages/03b-balance/`. The balance-generator agent uses this to produce
correctly-formatted difficulty documentation.

Source: `game-implement-process/stage3/数值配置工作文档模板.md` Sections 1-2
(数值目标矩阵 + 关段难度投放) and Phase 5 CONTEXT.md locked decisions.

---

## File Structure

The output file `difficulty.md` has two main sections:

1. **Numerical Target Matrix** -- High-level lifecycle phase targets
2. **Per-Segment Difficulty** -- Detailed per-segment tables with inline
   adjustment strategies

Both sections use tables over narratives. All values must reference 7B inputs
from system design files.

---

## Frontmatter Schema

```yaml
---
stage: 03b-balance
status: draft | review | complete
systems_covered:
  - SYS-{NAME}-{NNN}
  - SYS-{NAME}-{NNN}
last_updated: YYYY-MM-DD
---
```

**Required fields:**
- `stage`: Always `03b-balance`
- `status`: Current review state
- `systems_covered`: List of system IDs whose 7B inputs were consumed
- `last_updated`: Date of last modification

---

## Section 1: Numerical Target Matrix

This section maps directly to source spec Section 1 (数值目标矩阵). One row per
lifecycle phase. Values come from lifecycle-phases.md reference adjusted to the
project's genre.

### Format

```markdown
## Numerical Target Matrix

| Phase | Target Experience | Pass Rate Range | Retry Rate Range | Key Risks |
|-------|-------------------|-----------------|------------------|-----------|
| Tutorial | {description} | {min}% - {max}% | {min}% - {max}% | {risk list} |
| Establishment | {description} | {min}% - {max}% | {min}% - {max}% | {risk list} |
| Pressure | {description} | {min}% - {max}% | {min}% - {max}% | {risk list} |
| Monetization | {description} | {min}% - {max}% | {min}% - {max}% | {risk list} |
```

### Column Definitions

| Column | Content | Source |
|--------|---------|--------|
| Phase | One of: Tutorial, Establishment, Pressure, Monetization | lifecycle-phases.md |
| Target Experience | 1-2 sentence description of intended player feeling | 7B Category 1 |
| Pass Rate Range | Genre-appropriate first-clear rate range | lifecycle-phases.md + genre |
| Retry Rate Range | Genre-appropriate retry rate range | lifecycle-phases.md + genre |
| Key Risks | Comma-separated list of phase-specific risks | lifecycle-phases.md |

### Validation Rules

- All 4 phases must be present (no omissions)
- Pass rate ranges must decrease or stay flat across phases (monotonicity)
- Retry rate ranges must increase or stay flat across phases
- Target experience must be concrete (not vague like "good experience")

---

## Section 2: Per-Segment Difficulty

This section maps to source spec Section 2 (关段难度投放). One row per level
segment. Segments are groupings of levels that share similar difficulty
characteristics.

### Format

```markdown
## Per-Segment Difficulty

| Segment | Pressure Source | Key Parameters | Parameter Range | Remediation | Expected Pass Rate | If Too Hard | If Too Easy |
|---------|----------------|----------------|-----------------|-------------|-------------------|-------------|-------------|
| {name} (Levels {N}-{M}) | {source} | {param list} | {range} | {mechanism} | {rate}% | {adjustment} | {adjustment} |
| {name} (Levels {N}-{M}) | {source} | {param list} | {range} | {mechanism} | {rate}% | {adjustment} | {adjustment} |
```

### Column Definitions

| Column | Content | Source |
|--------|---------|--------|
| Segment | Segment name with level range in parentheses | 7B Category 2 |
| Pressure Source | What makes this segment challenging | 7B Category 2 |
| Key Parameters | Config parameters that control difficulty in this segment | 7B Category 5 |
| Parameter Range | Min-max values for key parameters | 7B Category 2 + Category 5 |
| Remediation | Recovery mechanism if player fails | 7B Category 4 |
| Expected Pass Rate | Single target percentage for this segment | Lifecycle phase + segment position |
| If Too Hard | Specific adjustment: which parameter to reduce and by how much | 7B Category 5 + tuning levers |
| If Too Easy | Specific adjustment: which parameter to increase and by how much | 7B Category 5 + tuning levers |

### Validation Rules

- Every segment must map to a lifecycle phase (Tutorial/Establishment/Pressure/
  Monetization)
- Expected pass rate must decrease or stay flat across segments, with a
  tolerance of <= 10 percentage points for small recovery dips between adjacent
  segments
- Every segment must have at least one pressure source
- Every segment must have at least one key parameter
- Remediation must be a concrete mechanism (not "retry" or "help")
- "If Too Hard" must name a specific parameter and direction (e.g., "Reduce
  timer by 5s" not "make it easier")
- "If Too Easy" must name a specific parameter and direction (e.g., "Increase
  obstacle count by 1" not "make it harder")
- Segments must collectively cover the full level range without gaps

### Example Row

```markdown
| Early Challenge (Levels 11-20) | Grid complexity increase | grid_size, obstacle_count | 5x5-6x6 grid, 2-4 obstacles | Hint system shows one valid merge | 72% | Reduce obstacle_count by 1 per level | Add 1 obstacle, reduce timer by 3s |
```

---

## Format Notes

1. **Tables over narratives** -- Both sections use structured tables, not prose
   explanations. Any additional context should be footnotes beneath the table.

2. **7B traceability** -- All values must reference 7B inputs from system
   designs. If a value cannot be traced to a 7B input, flag it for review.

3. **Pass rate monotonicity** -- Expected pass rates must generally decrease
   across segments (Tutorial segments > Establishment segments > Pressure
   segments > Monetization segments). Small intra-phase recovery dips are
   acceptable but cross-phase reversals are not.

4. **Inline adjustment strategies** -- Per user decision, "too hard" and "too
   easy" adjustment strategies appear as the last two columns of the
   per-segment table, co-located with the parameters they adjust. This keeps
   the adjustment guidance immediately actionable alongside the difficulty
   specification.

5. **Segment granularity** -- Segment size is at the agent's discretion based
   on content rhythm. Typical range: 5-15 levels per segment. Segments should
   align with natural content rhythm transitions from system design Section 7.

---

*Template for: balance-generator agent (gf-balance-generator.md)*
*Output location: .gf/stages/03b-balance/difficulty.md*
