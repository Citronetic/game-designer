# Quality Gate Criteria -- System Design Stage

The quality reviewer agent loads this file when running the post-completion
quality gate on all system design files. The gate produces REVIEW.md listing
what was checked, what was auto-fixed, and what needs user input.

## Auto-Fix Categories (fix without asking user)

These are structural/mechanical issues the quality gate resolves automatically.
Auto-fixes are applied directly to system files and logged in REVIEW.md.

### 1. Missing Sections

Fill missing required sections from the system template (10 sections + 7A/7B).

- **Detection:** Compare each system file's section headings against the
  required sections list (1-10 plus 7A, 7B from the system template reference).
- **Fix:** Generate the missing section using cross-system context and the
  system's existing content. Section 10 sub-sections (10.1-10.6) are checked
  individually.
- **Log:** `[auto-fix] {system_id}: Added missing section {section_name} -- inferred from existing rules and states`

### 2. Missing Rule IDs

Assign next sequential `RULE-{SYSTEM}-NNN` ID to any rule statement that
lacks an ID.

- **Detection:** Scan Section 5 for rule-like statements (concrete, executable
  requirements) that do not have a `> **RULE-{SYSTEM}-NNN**` blockquote marker.
- **Fix:** Assign the next available `RULE-{SYSTEM}-{seq}` ID. Determine
  implementation type from rule content analysis (config_driven for tunable
  parameters, logic_driven for hard-coded behavior, mixed for both).
- **Log:** `[auto-fix] {system_id}: Assigned RULE-{SYSTEM}-{seq} | {impl_type} to rule: "{description}"`

### 3. Shallow State Machines

Expand state machines that have fewer than 3 states.

- **Detection:** Count states in Section 10.1 state machine table. Flag if < 3.
- **Fix:** Derive additional states from Section 4 (States & Flow). If Section 4
  also has fewer than 3 states, expand both sections together using the system's
  rules and failure recovery paths to infer intermediate states.
- **Log:** `[auto-fix] {system_id}: Expanded state machine from {old_count} to {new_count} states`

### 4. Shallow Event Bus

Fill empty event payload fields.

- **Detection:** Check Section 10.2 event bus table for events with empty or
  missing payload fields.
- **Fix:** Infer payload fields from event context: the trigger condition
  determines what data is available, the consumer determines what data is needed.
  Payload fields use typed format: `{field_name}: {type}`.
- **Log:** `[auto-fix] {system_id}: Filled payload for event {event_id}: {fields}`

### 5. Missing Anchors

Fill empty anchor sub-sections (8A-8E).

- **Detection:** Check each of the 5 anchor sub-sections (8A Data, 8B Art,
  8C UI, 8D Tech, 8E Content Expression Model) for empty tables or missing
  content.
- **Fix:** Derive anchors from the system's rules (Section 5) and states
  (Section 4):
  - 8A: Each config_driven rule implies at least one data table
  - 8B: Each state with visual representation implies an art asset
  - 8C: Each player-facing state transition implies a UI component
  - 8D: Each event or formula implies a technical capability
  - 8E: Infer from system type (core systems typically need grid/coordinate)
- **Log:** `[auto-fix] {system_id}: Added {count} anchors to section 8{sub}`

### 6. Missing Frontmatter Fields

Fill missing frontmatter fields from body content analysis.

- **Detection:** Compare system file frontmatter against the required schema
  (system_id, system_name, system_type, priority, status, rule_count,
  concept_sources, depends_on, depended_by, generated_at, summary).
- **Fix:** Calculate missing values from body content:
  - rule_count: count RULE-{SYSTEM}-NNN occurrences
  - concept_sources: collect all R_N_NN references from rule Source fields
  - depends_on/depended_by: extract from Section 6
  - summary: generate from Section 2 goals
- **Log:** `[auto-fix] {system_id}: Filled frontmatter field {field} = {value}`

### 7. Prose Formulas

Convert prose descriptions in Section 10.4 to actual pseudo-code.

- **Detection:** Scan Section 10.4 for natural language descriptions instead
  of pseudo-code. Indicators: sentences without operators (`=`, `+`, `*`, `/`,
  `>`, `<`), phrases like "calculated based on", "depends on", "determined by".
- **Fix:** Convert the prose into pseudo-code using variables derived from the
  system's rules and data anchors. Each formula must have named variables,
  operators, and a result assignment.
- **Log:** `[auto-fix] {system_id}: Converted prose formula "{original}" to pseudo-code`

### 8. Incomplete Day1-Day7

Fill gaps in Section 7 content contribution table.

- **Detection:** Check the Day1-Day7 table for missing days or empty content
  cells. All 7 days must have entries.
- **Fix:** Fill gaps using the system's rules and the existing day entries as
  context. Early days lean toward `new_mechanic`, later days toward
  `reuse_variation`. No two consecutive days may have completely empty
  contributions.
- **Log:** `[auto-fix] {system_id}: Filled Day{N} content contribution: "{content}"`

## Must-Ask Categories (NEVER auto-fill, always ask user)

These are creative decisions that define the game's identity. The quality gate
must NEVER generate content for these topics -- it must present a specific
question to the user and wait for their response.

### 1. System Boundary Disputes

Two or more systems claim ownership of the same concept rule (R_N_NN appears
in multiple systems' concept_sources).

- **Why never auto-fill:** System boundaries define the architecture. Assigning
  a rule to the wrong system creates downstream traceability chaos and data
  schema duplication.
- **Gate behavior:** If a concept rule appears in multiple systems' rules,
  flag it and ask: "Rule {R_N_NN} appears in both {system_A} and {system_B}.
  Which system should own this rule? The other system can reference it as a
  dependency instead."

### 2. Monetization Model

Decisions about ad placement, IAP products, or hybrid revenue approaches
within a system.

- **Why never auto-fill:** Monetization strategy has massive implications for
  player experience, retention, and revenue. It requires business judgment,
  not pattern-matching.
- **Gate behavior:** If a system's 7B commercialization constraints are vague
  or contradictory with another system's constraints, flag and ask:
  "System {system_id} has unclear monetization boundaries. Please specify:
  (a) ad intervention points, (b) premium purchase alternatives, (c) conflict
  avoidance with {other_system}'s monetization."

### 3. Core Mechanic Alternatives

Multiple valid implementations of a core rule exist and the current design
does not commit to one.

- **Why never auto-fill:** Core mechanics define the game's identity. Choosing
  the wrong implementation creates a fundamentally different game.
- **Gate behavior:** If Section 5 contains rules with conditional phrasing
  ("could be X or Y", "alternatively", "one option is"), flag and ask:
  "Rule {RULE_ID} has multiple possible implementations: {options}. Which
  approach should this game use?"

### 4. Difficulty Philosophy

Whether a system should prioritize accessibility (easy to learn, forgiving)
vs challenge (demanding, rewarding mastery).

- **Why never auto-fill:** Difficulty philosophy affects every numerical
  parameter in Stage 3B. Getting it wrong means re-tuning everything.
- **Gate behavior:** If Section 7B tuning levers or validation criteria are
  ambiguous about difficulty direction, flag and ask: "System {system_id}
  does not clearly state its difficulty philosophy. Should this system
  prioritize accessibility (generous safety nets, gentle progression) or
  challenge (tight resource economy, skill-gated progression)?"

## Cross-System Structural Checks

These checks produce warnings but do not auto-fix or block. They validate
consistency across all system files.

### System List Completeness

- All confirmed systems from `system-list.json` must have corresponding
  system files in `.gf/stages/02-system-design/systems/`
- No system file should exist that is not in the confirmed system list

### System ID Uniqueness

- No duplicate system IDs across all system files
- All system IDs registered in the traceability registry
- All RULE IDs unique within their system (and globally)

### Dependency Graph Integrity

- Every system referenced in depends_on/depended_by must exist as a file
- No circular strong dependencies
- Every strong dependency has a documented fallback

### Concept Traceability Coverage

- All R_N_NN concept entries from the registry must appear in at least one
  system's concept_sources
- Report unmapped concept rules as gaps
- Concept rules from core chapters (3, 4, 5, 6, 7) should have 100% coverage

### Cross-System Consistency Checks

Run all 4 checks from `cross-system-checks.md`:
1. Economy balance
2. Task references
3. Tutorial coverage
4. Monetization conflicts

Report results in REVIEW.md.

## REVIEW.md Output Format

The quality gate produces a REVIEW.md file with this structure:

```markdown
# System Design Quality Review Results

## Summary

- Systems reviewed: {N}
- Total rules validated: {N} (unique, ID'd, typed, traceable)
- Concept rules mapped: {mapped}/{total} ({percent}% coverage)
- Auto-fixes applied: {N}
- User decisions needed: {N}
- Cross-system checks: {passed}/{total}

## Auto-Fixed Issues

- [{system_id}] {description of fix}
- [{system_id}] {description of fix}

## Needs User Decision

- [{system_id}] {question for user}

## Cross-System Check Results

### Economy Balance
- Status: {PASS/FAIL}
- Issues: {list or "None"}

### Task References
- Status: {PASS/FAIL}
- Issues: {list or "None"}

### Tutorial Coverage
- Status: {PASS/FAIL}
- Issues: {list or "None"}

### Monetization Conflicts
- Status: {PASS/FAIL}
- Issues: {list or "None"}

## Concept Traceability

- Mapped rules: {list}
- Unmapped rules: {list or "None -- 100% coverage"}

## Passed Checks

- All systems present: {OK/FAIL}
- System ID uniqueness: {OK/FAIL} ({count} unique IDs)
- RULE ID uniqueness: {OK/FAIL} ({count} unique rules)
- Dependency graph integrity: {OK/FAIL}
- Concept traceability: {OK/FAIL} ({percent}% coverage)
- State machine depth: {OK/FAIL}
- Event bus completeness: {OK/FAIL}
- Day1-Day7 coverage: {OK/FAIL}
- Anchor completeness: {OK/FAIL}
- Formula pseudo-code: {OK/FAIL}
- 7B completeness: {OK/FAIL}
```
