# Tuning Priority Output Template

This template defines the output format for `tuning.md` in
`.gf/stages/03b-balance/`. The balance-generator agent uses this to produce
correctly-formatted tuning documentation.

Source: `game-implement-process/stage3/数值配置工作文档模板.md` Sections 5-8
(参数调整策略, 验证与发布门禁, 版本记录, 自检结论) and Phase 5 CONTEXT.md
locked decisions.

---

## File Structure

The output file `tuning.md` has four main sections:

1. **Tuning Priority Table** -- 5-column table of adjustable parameters
2. **Validation Thresholds** -- Metric thresholds that trigger alerts
3. **Rollback Strategy** -- Step-by-step rollback process
4. **Self-Check Conclusions** -- Mandatory checklist from source spec Section 8

All sections use tables over narratives. All values must reference 7B inputs
from system design files.

---

## Frontmatter Schema

```yaml
---
stage: 03b-balance
status: draft | review | complete
total_parameters: {N}
last_updated: YYYY-MM-DD
---
```

**Required fields:**
- `stage`: Always `03b-balance`
- `status`: Current review state
- `total_parameters`: Count of parameters in the tuning priority table
- `last_updated`: Date of last modification

---

## Section 1: Tuning Priority Table

Matches the user-locked 4-column format (hot-update flag, adjustment step
limit, rollback condition, impact scope) plus a Parameter identifier column.

### Format

```markdown
## Tuning Priority Table

| Parameter | Hot-Update Flag | Adjustment Step Limit | Rollback Condition | Impact Scope |
|-----------|----------------|----------------------|-------------------|--------------|
| {param name} | {yes/no} | {+/- percent or absolute} | {metric + threshold} | {system list} |
```

### Column Definitions

| Column | Content | Source |
|--------|---------|--------|
| Parameter | Config parameter name as it appears in data tables | 7B Category 5 |
| Hot-Update Flag | `yes` (can change without client release) or `no` (requires client release) | 7B Category 6 |
| Adjustment Step Limit | Maximum change per iteration, expressed as percentage (e.g., +/-10%) or absolute value | 7B Category 5 |
| Rollback Condition | Specific metric + direction + numeric threshold that triggers rollback | 7B Category 7 |
| Impact Scope | List of system IDs affected by changing this parameter | 7B Category 5 |

### Validation Rules

- Hot-update flag must be boolean: `yes` or `no` (not "maybe" or "conditional")
- Adjustment step limit must be a specific percentage (e.g., +/-10%) or
  absolute value (e.g., +/-5), not vague language
- **Rollback condition must contain at least one digit** -- this is the
  critical validation rule. Conditions like "if metrics worsen" or "if
  retention drops significantly" are rejected. Conditions like "if day-1
  retention drops below 35% for 2 consecutive days" are accepted.
- Impact scope must list specific system IDs, not vague references like
  "multiple systems" or "core gameplay"
- Every parameter listed must appear in at least one table in the frozen schema

### Example

```markdown
| obstacle_count | yes | +/-1 per iteration | first-clear rate < 55% for 3 days OR first-clear rate > 85% for 3 days | SYS-CORE_GAMEPLAY-001, SYS-LEVEL-001 |
| reward_multiplier | yes | +/-15% | D7 retention drops below 30% for 2 consecutive days | SYS-REWARD-001, SYS-SETTLEMENT-001 |
| merge_tier_cap | no | +/-1 tier | session length < 3 min average for 1 week | SYS-CORE_GAMEPLAY-001 |
```

---

## Section 2: Validation Thresholds

Table of metric thresholds that trigger alerts during live operations. Maps to
source spec Section 6 (验证与发布门禁).

### Format

```markdown
## Validation Thresholds

| Metric | Normal Range | Warning Threshold | Critical Threshold | Data Source | Action |
|--------|-------------|-------------------|-------------------|-------------|--------|
| {metric name} | {min}-{max} | {threshold} | {threshold} | {source} | {action} |
```

### Column Definitions

| Column | Content | Source |
|--------|---------|--------|
| Metric | Observable game metric name | 7B Category 7 |
| Normal Range | Expected range during healthy operation | Lifecycle phase targets |
| Warning Threshold | Value that triggers investigation | 7B Category 7 |
| Critical Threshold | Value that triggers immediate rollback | 7B Category 7 |
| Data Source | Where this metric is measured (analytics, server logs, etc.) | Implementation |
| Action | What to do when threshold is breached | Rollback Strategy |

### Required Metrics (minimum set)

| Metric | Why Required |
|--------|-------------|
| First-clear rate (per segment) | Core difficulty indicator |
| Retry rate (per segment) | Frustration indicator |
| Resource drought frequency | Economy health indicator |
| Ad intervention rejection rate | Monetization health indicator |
| Session length | Engagement indicator |

### Validation Rules

- All threshold values must be numeric
- Warning threshold must be less severe than critical threshold
- Every metric must have both warning and critical thresholds defined
- Data source must be specific (not "analytics")

---

## Section 3: Rollback Strategy

Step-by-step process for rolling back a balance change. This is operational
guidance for live-ops teams.

### Format

```markdown
## Rollback Strategy

### When to Roll Back

A rollback is triggered when ANY critical threshold from the Validation
Thresholds table is breached for the duration specified in the threshold's
rollback condition.

### Rollback Process

1. **Identify** -- Determine which parameter change caused the threshold breach
2. **Verify** -- Confirm the breach is caused by the balance change (not
   external factors like server issues)
3. **Revert** -- Restore the parameter to its previous value using hot-update
   if the parameter supports it
4. **Validate** -- Confirm metrics return to normal range within {timeframe}
5. **Document** -- Record the failed change, root cause, and lessons learned
   in the version history

### Hot-Update vs Client Release Rollback

| Scenario | Rollback Method | Expected Time |
|----------|----------------|---------------|
| Hot-updatable parameter | Server-side config push | < 1 hour |
| Non-hot-updatable parameter | Emergency client patch | 24-48 hours |
| Multiple parameters changed | Staged rollback (most impactful first) | 2-4 hours |
```

### Validation Rules

- Process must include at minimum: identify, verify, revert, validate steps
- Rollback timeframes must be specific (not "soon" or "quickly")
- Hot-update vs client-release distinction must be documented

---

## Section 4: Self-Check Conclusions

Mandatory checklist from source spec Section 8 (自检结论). The balance-generator
agent fills this in; the quality gate verifies it.

### Format

```markdown
## Self-Check Conclusions

| # | Check Item | Status | Evidence |
|---|-----------|--------|----------|
| 1 | All values reference Stage 2 7B inputs | {PASS/FAIL} | {which systems' 7B were consumed} |
| 2 | Schema structure unchanged from frozen version | {PASS/FAIL} | {freeze validation result} |
| 3 | Rollback conditions exist with specific thresholds | {PASS/FAIL} | {count of parameters with numeric thresholds} |
| 4 | One-week playability target met | {PASS/FAIL} | {pass rate progression across lifecycle phases} |
| 5 | Program contract consistency maintained | {PASS/FAIL} | {state machines, formulas, error codes checked} |
```

### Check Item Definitions

| # | Check | Pass Criteria | Fail Action |
|---|-------|--------------|-------------|
| 1 | 7B Input Traceability | Every balanced value traces to a 7B input category | Identify orphaned values, add 7B references or remove |
| 2 | Freeze Integrity | Table names, field names, field types, PKs, FKs unchanged | Revert structural changes, re-run balance with correct boundaries |
| 3 | Rollback Completeness | Every rollback condition contains at least one numeric threshold | Add specific thresholds to vague conditions |
| 4 | Playability Target | Pass rates follow lifecycle phase targets within genre-appropriate ranges | Adjust difficulty parameters to bring rates into range |
| 5 | Contract Consistency | Balance values are compatible with state machines, formulas, and error codes from Section 10 | Resolve conflicts between balance values and program contracts |

### Validation Rules

- All 5 check items must be present
- Status must be PASS or FAIL (not partial, pending, or N/A)
- Evidence must be specific and verifiable
- **If any check is FAIL, the balance version must not enter production**

---

## Format Notes

1. **Tables over narratives** -- All tuning documentation uses structured
   tables. Operational processes (rollback strategy) use numbered steps.

2. **Numeric specificity** -- The most critical quality rule for tuning.md:
   rollback conditions, thresholds, and step limits MUST contain specific
   numbers. Vague language like "significantly", "noticeable", "concerning"
   without accompanying numbers is rejected.

3. **Hot-update flag accuracy** -- The hot-update flag must align with the
   table layer from the frozen schema. Layer 2 (constants) parameters are
   always `no`. Layer 6 (periodic_rewards) parameters are typically `yes`.
   Layer 1 (core_config) parameters are `no` unless explicitly marked for
   emergency hot-update.

4. **Self-check is mandatory** -- The self-check conclusions section is not
   optional. It is the final gate before balance values can be used in
   production. The quality gate agent verifies this section exists and all
   items are PASS.

---

*Template for: balance-generator agent (gf-balance-generator.md)*
*Output location: .gf/stages/03b-balance/tuning.md*
