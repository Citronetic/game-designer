# Quality Gate Criteria -- Production Spec Stage

The production quality reviewer agent loads this file when running the
post-completion quality gate on all three production spec files (ART-SPEC.md,
UI-SPEC.md, TECH-SPEC.md). The gate produces REVIEW.md listing what was
checked, what was auto-fixed, and what needs user input.

Source: Mirrors Phase 3-5's quality criteria pattern (8 auto-fix + 4 must-ask).
Adapted for Stage 4 production specification validation.

---

## Highest-Priority Constraint

**"Every asset, page, and module in production specs must trace to a valid
Stage 2 system ID -- no spec can reference a system or rule not defined
upstream."** This is the #1 validation rule from the source specification
("所有美术需求必须可回溯到 Stage2 的系统设计，不得凭空新增核心系统" / "所有页面与交互必须可追溯到 Stage2 系统设计"). The quality gate verifies
that all system ID references in the three spec files exist in the
id-registry.json.

---

## Auto-Fix Categories (fix without asking user)

These are structural/mechanical issues the quality gate resolves automatically.
Auto-fixes are applied directly to spec files and logged in REVIEW.md.

### 1. Missing System ID References

A spec entry (asset, page, module, event, formula) references a system that
is not in the systems_covered list or does not exist in id-registry.json.

- **Detection:** Scan all System ID columns across all three spec files.
  Cross-reference each ID against the id-registry.json. Check that every
  ID also appears in the spec's frontmatter `systems_covered` list.
- **Fix:** Add missing system IDs to the `systems_covered` frontmatter
  list if they exist in id-registry.json. If an ID does not exist in the
  registry, flag it with `[INVALID SYSTEM ID: {id}]`.
- **Log:** `[auto-fix] {file}: added "{sys_id}" to systems_covered` or
  `[auto-fix] {file}: flagged invalid system ID "{sys_id}" in {section}`

### 2. Incomplete Asset States

An asset in ART-SPEC.md's Asset Master List (Section C) has fewer than 2
states defined in the States Required column.

- **Detection:** Parse the Asset Master List table. For each row, check
  the States Required column. Every asset must have at least an idle/default
  state and an active/engaged state.
- **Fix:** If States Required is empty, add placeholder
  `idle, active [NEEDS STATES]`. If only one state is listed, append
  `[NEEDS ADDITIONAL STATE]`.
- **Log:** `[auto-fix] ART-SPEC.md: added state placeholder for asset "{asset_id}"`

### 3. Missing Error States

A page in UI-SPEC.md's Key Page Specs (Section D) does not define at least
one error state in its Exception States table.

- **Detection:** For each key page spec block, check the Exception States
  table. At minimum, one row with an error-type state must exist.
- **Fix:** Add a placeholder error state row:
  `| Error state | [NEEDS TRIGGER] | [NEEDS DISPLAY] | [NEEDS RECOVERY] |`
- **Log:** `[auto-fix] UI-SPEC.md: added error state placeholder for page "{page_id}"`

### 4. Empty Interaction Flows

A core interaction flow in UI-SPEC.md (Section E) has fewer than 3 steps
defined.

- **Detection:** Parse each flow table in Section E. Count the number of
  step rows. Flows with fewer than 3 steps are incomplete.
- **Fix:** Add placeholder steps to reach 3 minimum:
  `| {N} | [NEEDS ACTION] | [NEEDS FEEDBACK] | [NEEDS CONDITION] | [NEEDS FALLBACK] |`
- **Log:** `[auto-fix] UI-SPEC.md: added step placeholders for flow "{flow_name}" (had {count} steps, minimum 3)`

### 5. Incomplete State Machines

A component state machine in UI-SPEC.md (Section H) or TECH-SPEC.md
(Section D) is missing one or more of: states, transitions, default state.

- **Detection:** For each state machine definition, verify:
  (a) at least 2 states are defined, (b) at least 1 transition exists,
  (c) a default/initial state is identified.
- **Fix:** Flag missing elements with placeholders:
  - Missing states: `[NEEDS STATES: define at least 2]`
  - Missing transitions: `[NEEDS TRANSITIONS: define at least 1]`
  - Missing default: `[NEEDS DEFAULT STATE]`
- **Log:** `[auto-fix] {file}: flagged incomplete state machine "{machine_name}" -- missing {element}`

### 6. Missing Cross-References

ART-SPEC.md Section G (UI-Related Art Asset Handoff) does not reference
any pages from UI-SPEC.md. TECH-SPEC.md does not reference any config
tables from the Stage 3A data schema.

- **Detection:** Check ART-SPEC.md Section G for at least one reference
  to a Page ID defined in UI-SPEC.md. Check TECH-SPEC.md Sections C and J
  for at least one reference to a table name from Stage 3A tables.md.
- **Fix:** Add a placeholder reference block:
  - ART-SPEC.md: `[NEEDS UI-SPEC CROSS-REFERENCE: link art assets to Page IDs from UI-SPEC.md]`
  - TECH-SPEC.md: `[NEEDS DATA SCHEMA CROSS-REFERENCE: link modules to config tables from tables.md]`
- **Log:** `[auto-fix] {file}: added cross-reference placeholder to {target}`

### 7. Missing Acceptance Criteria

A spec section that contains deliverables (assets, pages, modules) does
not have corresponding acceptance standards in the acceptance section.

- **Detection:** For ART-SPEC.md, check that Section J covers all asset
  types from Section C. For UI-SPEC.md, check that Section L covers all
  P0/P1 pages from Section C. For TECH-SPEC.md, check that each module
  in Section B has at least one exception scenario in Section I.
- **Fix:** Add a placeholder acceptance row for uncovered items:
  `| {item_type} | [NEEDS CRITERIA] | [NEEDS CRITERIA] | [NEEDS CRITERIA] | [NEEDS CRITERIA] | [NEEDS CRITERIA] |`
- **Log:** `[auto-fix] {file}: added acceptance criteria placeholder for "{item}" in {section}`

### 8. Inconsistent Priority Levels

The same system has different priority levels (P0/P1/P2) for its assets,
pages, and modules across the three specs.

- **Detection:** For each system ID, collect its priority across:
  ART-SPEC.md Asset Master List, UI-SPEC.md Page Inventory,
  TECH-SPEC.md Module Responsibility Table. Flag if the same system has
  P0 assets but P2 pages, or similar mismatches.
- **Fix:** Flag the inconsistency with
  `[PRIORITY MISMATCH: {sys_id} is P{X} in {spec_A} but P{Y} in {spec_B}]`.
  Do not change priorities -- flag for review.
- **Log:** `[auto-fix] flagged priority mismatch for system "{sys_id}": {spec_A}=P{X}, {spec_B}=P{Y}`

---

## Must-Ask Categories (NEVER auto-fill, always ask user)

These are creative or architectural decisions that define the game's visual
identity, interaction paradigm, and technical architecture. The quality gate
must NEVER generate answers for these -- it must present a specific question
to the user and wait for their response.

### 1. Art Style Direction

Visual style choices that affect overall game feel.

- **Why never auto-fill:** Art direction defines the game's visual identity
  and brand. A mismatched style alienates the target audience. Only the
  designer/art director knows the intended visual tone and audience
  expectations.
- **Gate behavior:** Review ART-SPEC.md Section B (Art Targets and Style
  Boundaries) and ask:
  "The art spec defines core style keywords as: {keywords}. Style
  boundaries exclude: {exclusions}. Risk items flagged: {risks}. Please
  confirm: (a) the style keywords accurately represent your vision,
  (b) the exclusions are correct and complete, (c) the risk items
  are acknowledged and acceptable."

### 2. Interaction Paradigm Conflicts

When multiple valid UI patterns exist for the same interaction flow.

- **Why never auto-fill:** Different interaction patterns create
  fundamentally different player experiences. A drag-based vs tap-based
  combat system, a bottom-sheet vs full-screen inventory -- these are
  design philosophy choices that affect the entire game feel. Only the
  designer knows which paradigm fits their vision.
- **Gate behavior:** If UI-SPEC.md Section E defines flows where
  alternative interaction patterns are commonly used (based on genre
  conventions), ask:
  "Flow '{flow_name}' uses {current_pattern}. Alternative patterns
  common in this genre include: {alternatives}. Confirm this is the
  intended interaction paradigm, or specify which alternative to use."

### 3. Module Boundary Disputes

When a capability could logically belong to multiple modules.

- **Why never auto-fill:** Module boundaries affect code organization,
  team responsibilities, and long-term maintainability. A "reward"
  capability could belong to the economy module, the progression module,
  or a dedicated rewards module. The right choice depends on team
  structure and codebase philosophy. Only the tech lead/designer knows
  the intended ownership model.
- **Gate behavior:** If TECH-SPEC.md Section B shows capabilities that
  span multiple systems or could be assigned to different modules, ask:
  "Capability '{capability}' is referenced by systems {sys_list}.
  It is currently assigned to module '{module}'. Should it remain in
  '{module}', be split across modules, or be extracted into its own
  module? Consider: team ownership, change frequency, and dependency
  direction."

### 4. Client/Server Split Ambiguity

When an operation could reasonably live on either client or server side.

- **Why never auto-fill:** Client/server split affects latency, security,
  offline capability, and development complexity. Putting logic client-side
  improves responsiveness but risks cheating. Putting it server-side
  ensures integrity but requires network. The right split depends on
  the game's security model, offline requirements, and target platform.
- **Gate behavior:** If TECH-SPEC.md Section H shows operations marked
  as "bidirectional" or where the split is ambiguous, ask:
  "Operation '{operation}' in module '{module}' could run on either
  client or server. Current assignment: client={client_resp},
  server={server_resp}. Confirm this split is correct. Consider:
  (a) is cheat prevention needed for this operation?
  (b) must this work offline?
  (c) what latency is acceptable?"

---

## REVIEW.md Output Format

The quality gate produces a REVIEW.md file in `.gf/stages/04-production/`
with this structure:

```markdown
# Production Spec Quality Review Results

## Summary

- Spec files reviewed: {N}/3
- Total assets validated: {N}
- Total pages validated: {N}
- Total modules validated: {N}
- Auto-fixes applied: {N}
- User decisions needed: {N}

## Validation Checks Passed

- [ ] All assets trace to valid Stage 2 system IDs (no orphaned assets)
- [ ] All pages trace to valid Stage 2 system IDs (no orphaned pages)
- [ ] All modules trace to valid Stage 2 system IDs (no orphaned modules)
- [ ] All 3 spec files have complete frontmatter
- [ ] All assets have at least idle + active states
- [ ] All pages have at least one error state
- [ ] All interaction flows have at least 3 steps
- [ ] All state machines have states, transitions, and default state
- [ ] ART-SPEC.md Section G cross-references UI-SPEC.md pages
- [ ] TECH-SPEC.md references data schema tables
- [ ] All spec sections with deliverables have acceptance criteria
- [ ] Priority levels are consistent across all three specs per system

## Auto-Fixed Issues

- [{file}] {description of fix}
- [{file}] {description of fix}

## Needs User Decision

### Decision 1: {title}

{question for user with options}

### Decision 2: {title}

{question for user with options}

## Cross-Spec Consistency

### System Coverage

| System ID | ART-SPEC | UI-SPEC | TECH-SPEC | Priority Consistent |
|-----------|----------|---------|-----------|---------------------|
| {sys_id} | Covered / Missing | Covered / Missing | Covered / Missing | YES / NO |

### Asset-to-Page Alignment

- Art assets referenced by UI pages: {count}
- Art assets without UI page reference: {count}
- UI pages without art asset support: {count}

### Module-to-Config Alignment

- Modules with config table mapping: {count}
- Modules without config dependencies: {count}
- Config tables without module owner: {count}
```

---

*Reference for: production-quality-reviewer agent (gf-production-quality-reviewer.md)*
*Source: Mirrors .claude/skills/gf-balance/references/balance-quality-criteria.md pattern*
