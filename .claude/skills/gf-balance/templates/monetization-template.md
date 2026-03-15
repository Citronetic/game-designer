# Monetization Boundary Output Template

This template defines the output format for `monetization.md` in
`.gf/stages/03b-balance/`. The balance-generator agent uses this to produce
correctly-formatted commercialization boundary documentation.

Source: `game-implement-process/stage3/数值配置工作文档模板.md` Section 4
(商业化边界) and Phase 5 CONTEXT.md locked decisions.

---

## File Structure

The output file `monetization.md` has three main sections:

1. **Protected Parameters List** -- Parameters that cannot be adjusted for
   revenue optimization
2. **Experience Protection Rules** -- Rules preventing monetization from
   degrading core gameplay
3. **Commercialization Boundary Summary** -- Which systems have commercial
   touchpoints and what is protected

All sections use tables over narratives. All values must reference 7B inputs
from system design files.

---

## Frontmatter Schema

```yaml
---
stage: 03b-balance
status: draft | review | complete
systems_with_boundaries:
  - SYS-{NAME}-{NNN}
  - SYS-{NAME}-{NNN}
last_updated: YYYY-MM-DD
---
```

**Required fields:**
- `stage`: Always `03b-balance`
- `status`: Current review state
- `systems_with_boundaries`: List of system IDs with commercialization
  constraints
- `last_updated`: Date of last modification

---

## Section 1: Protected Parameters List

Table of parameters explicitly off-limits for revenue optimization. Matches
the user-locked format with 4 columns.

### Format

```markdown
## Protected Parameters

| Parameter | Owning System | Protection Rationale | Predicted Harm If Monetized |
|-----------|--------------|---------------------|---------------------------|
| {param name} | {SYS-ID} | {why it must be protected} | {what happens if monetized} |
```

### Column Definitions

| Column | Content | Source |
|--------|---------|--------|
| Parameter | Config parameter name as it appears in data tables | 7B Category 5 |
| Owning System | System ID that controls this parameter | System file frontmatter |
| Protection Rationale | Why this parameter must not be monetized | 7B Category 3 |
| Predicted Harm If Monetized | Specific negative outcome if this parameter is adjusted for revenue | 7B Category 3 + gameplay analysis |

### Validation Rules

- Every system with commercialization constraints in its 7B (Category 3) must
  have at least one protected parameter listed
- Protection rationale must be specific (not "important for gameplay")
- Predicted harm must describe a concrete player-facing consequence
- Parameters that appear in the tuning table (tuning.md) as adjustable must
  NOT also appear as protected unless the protection applies only to
  revenue-motivated adjustments

### Example

```markdown
| base_pass_rate | SYS-CORE_GAMEPLAY-001 | Core difficulty curve anchor; monetizing this converts the game to pay-to-win | Players perceive unfair advantage for payers; D7 retention drops 15-25% based on genre benchmarks |
| hint_cooldown | SYS-HINT-001 | Hint pacing prevents skill atrophy; selling instant hints removes learning incentive | Players stop developing strategy; session engagement drops as game becomes "buy the answer" |
```

---

## Section 2: Experience Protection Rules

Numbered list of rules that prevent monetization from degrading core gameplay.
These are derived from 7B Category 3 (Commercialization Constraints) across
all systems.

### Format

```markdown
## Experience Protection Rules

1. **{Rule name}:** {Rule description}
2. **{Rule name}:** {Rule description}
3. **{Rule name}:** {Rule description}
```

### Minimum Rules

At minimum, the following categories must be addressed:

1. **Core progression protection** -- Non-paying players must be able to
   complete all content (possibly slower, never blocked)
2. **Difficulty integrity** -- Monetization cannot bypass difficulty in ways
   that undermine the designed challenge curve
3. **Ad intervention limits** -- Ad frequency and placement must not interrupt
   core gameplay loops mid-action
4. **Premium fairness** -- Premium purchases provide convenience or cosmetic
   value, not mechanical advantage over non-payers
5. **Recovery resource protection** -- Failure compensation mechanisms (safety
   nets) must not be exclusively monetized

### Validation Rules

- At least 5 experience protection rules
- Each rule must be actionable (can be verified with a yes/no test)
- Rules must cover all systems with ad or payment touchpoints in their 7B

---

## Section 3: Commercialization Boundary Summary

Overview of which systems have commercial touchpoints and what boundaries
apply.

### Format

```markdown
## Commercialization Boundary Summary

| System | Commercial Touchpoint | Boundary | Protected Parameters |
|--------|----------------------|----------|---------------------|
| {SYS-ID} | {touchpoint type} | {what is allowed vs prohibited} | {param list} |
```

### Column Definitions

| Column | Content | Source |
|--------|---------|--------|
| System | System ID | System file frontmatter |
| Commercial Touchpoint | Type: `ad`, `iap`, `premium`, `subscription`, or `none` | 7B Category 3 |
| Boundary | What monetization can and cannot do within this system | 7B Category 3 |
| Protected Parameters | Comma-separated list of parameters from Section 1 that belong to this system | Protected Parameters List |

### Validation Rules

- Every system with 7B Category 3 content must appear in this table
- Systems with `none` as touchpoint type still appear (confirming no
  monetization involvement)
- Protected parameters listed must match entries in Section 1
- No system should have commercial touchpoints without at least one boundary
  defined

---

## Format Notes

1. **Tables over narratives** -- Commercialization boundaries are expressed as
   structured tables, not policy documents or prose guidelines.

2. **7B traceability** -- Every protected parameter and boundary must trace
   to a specific system's 7B Category 3 (Commercialization Constraints). If
   a system has no Category 3 content, it has no monetization involvement.

3. **Explicit naming** -- Parameters that CANNOT be adjusted for revenue
   optimization must be explicitly named. Vague references like "core
   parameters" or "important values" are rejected.

4. **Harm prediction** -- The "Predicted Harm If Monetized" column forces
   concrete thinking about consequences. Entries like "bad for players" are
   too vague; entries like "D7 retention drops 15-25%" are acceptable.

---

*Template for: balance-generator agent (gf-balance-generator.md)*
*Output location: .gf/stages/03b-balance/monetization.md*
