# Economy Flow Output Template

This template defines the output format for `economy.md` in
`.gf/stages/03b-balance/`. The balance-generator agent uses this to produce
correctly-formatted economy documentation.

Source: `game-implement-process/stage3/数值配置工作文档模板.md` Section 3
(经济产消与卡点设计) and Phase 5 CONTEXT.md locked decisions.

---

## File Structure

The output file `economy.md` has three main sections:

1. **Resource Flow Tables** -- One table per major resource
2. **Cross-Resource Dependencies** -- How resources interact
3. **Prohibited Drought Points** -- States where a resource must not be zero

All sections use tables over narratives. All values must reference 7B inputs
from system design files.

---

## Frontmatter Schema

```yaml
---
stage: 03b-balance
status: draft | review | complete
resources_covered:
  - {resource_name}
  - {resource_name}
last_updated: YYYY-MM-DD
---
```

**Required fields:**
- `stage`: Always `03b-balance`
- `status`: Current review state
- `resources_covered`: List of resource names analyzed
- `last_updated`: Date of last modification

---

## Section 1: Resource Flow Tables

One table per major resource. Columns match the user-locked format exactly.

### Format

```markdown
## Resource Flow Tables

### {Resource Name}

| Resource | Sources | Sinks | Net Per Day | Choke Points | Safety Nets |
|----------|---------|-------|-------------|--------------|-------------|
| {name} | {source list} | {sink list} | {+/-amount} | {choke list} | {safety list} |
```

For resources with multiple sources or sinks, list each on a separate line
within the cell using line breaks or semicolons.

### Column Definitions

| Column | Content | Source |
|--------|---------|--------|
| Resource | Resource name (e.g., Gold, Energy, Gems) | 7B Category 4 |
| Sources | All systems/mechanisms that produce this resource | 7B Category 4 per system |
| Sinks | All systems/mechanisms that consume this resource | 7B Category 4 per system |
| Net Per Day | Expected net production per day (positive = surplus, negative = deficit) | Calculated from sources - sinks |
| Choke Points | Designed points where resource becomes scarce | 7B Category 4 |
| Safety Nets | Mechanisms that prevent complete resource drought | 7B Category 4 |

### Validation Rules

- Every resource must have at least one source and at least one sink
- Net per day must be sustainable: persistent negative values without safety
  nets indicate a design flaw
- Choke points must have corresponding safety nets -- a choke point without a
  safety net is a potential drought
- Sources and sinks must be traceable to specific systems via 7B Category 4
- Net per day values should be calculated, not estimated

### Example

```markdown
### Gold

| Resource | Sources | Sinks | Net Per Day | Choke Points | Safety Nets |
|----------|---------|-------|-------------|--------------|-------------|
| Gold | Level completion (+50-200); Daily login (+100); Quest rewards (+150) | Upgrade cost (-80-300); Shop items (-50-500); Skill unlock (-200) | +120 (tutorial) to -50 (pressure) | Day 5-6: upgrade costs spike | Free gold gift at 0 balance; daily login minimum 100 |
```

---

## Section 2: Cross-Resource Dependencies

Describes how resources interact with each other. Important for detecting
cascade effects where one resource shortage causes another.

### Format

```markdown
## Cross-Resource Dependencies

| Primary Resource | Dependent Resource | Dependency Type | Impact |
|-----------------|-------------------|-----------------|--------|
| {resource A} | {resource B} | {type} | {description} |
```

### Column Definitions

| Column | Content |
|--------|---------|
| Primary Resource | The resource that, when scarce, affects others |
| Dependent Resource | The resource affected by primary scarcity |
| Dependency Type | `gates` (A required to earn B), `amplifies` (A boosts B production), `competes` (A and B share sources) |
| Impact | What happens when primary resource is scarce |

### Validation Rules

- Every resource that appears in Resource Flow Tables should be checked for
  cross-resource dependencies
- Circular dependencies (A gates B, B gates A) must be flagged as potential
  deadlocks
- Competing resources must not share the same sole source

---

## Section 3: Prohibited Drought Points

Explicit list of game states where a resource must NOT be zero. This section
maps to the source spec's "禁止断流点" requirement.

### Format

```markdown
## Prohibited Drought Points

| Resource | Game State | Why Drought Is Prohibited | Prevention Mechanism |
|----------|-----------|--------------------------|---------------------|
| {name} | {state description} | {rationale} | {mechanism} |
```

### Column Definitions

| Column | Content | Source |
|--------|---------|--------|
| Resource | Resource name | Resource Flow Tables |
| Game State | Specific game state or segment where drought is forbidden | 7B Category 4 |
| Why Drought Is Prohibited | Player experience impact if resource reaches zero here | 7B Category 4 |
| Prevention Mechanism | How the system prevents this drought | Safety Nets from Resource Flow Tables |

### Validation Rules

- Every choke point from Resource Flow Tables must be evaluated for drought
  prohibition
- Prevention mechanisms must reference concrete game systems (not vague
  "the game provides more")
- Prohibited droughts during Tutorial phase are highest priority

---

## Format Notes

1. **Tables over narratives** -- All economy analysis uses structured tables.
   Prose explanations are limited to brief notes beneath tables.

2. **7B traceability** -- Every source and sink must trace to a specific
   system's 7B Category 4 (Economy Constraints). Cross-reference all systems
   that produce or consume each resource.

3. **Aggregate analysis** -- Resource flow values are aggregated across ALL
   systems. A single system's 7B section shows only its local contribution;
   economy.md shows the combined picture.

4. **Net per day sustainability** -- Net per day values should be positive
   (surplus) in Tutorial and Establishment phases, near zero in Pressure phase,
   and may be slightly negative in Monetization phase (creating commercial
   value opportunities). Persistent negative values without safety nets in any
   phase indicate a design flaw.

5. **Choke vs drought** -- A choke point is a designed scarcity moment that
   creates tension. A drought is an unintended zero-resource state. Choke
   points are acceptable; droughts are not. Every choke point must have a
   safety net.

---

*Template for: balance-generator agent (gf-balance-generator.md)*
*Output location: .gf/stages/03b-balance/economy.md*
