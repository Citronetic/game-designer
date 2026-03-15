# Per-System Design Template Reference

This reference defines the 10-section structure plus 7A/7B/7C handoff packages
that every system design file must follow. The system-designer agent reads this
to understand what depth and coverage is required for each system.

Source: Adapted from `game-implement-process/stage2/完整系统设计执行规范.md`
sections 4.1-4.10 and 7A/7B/7C.

---

## Section Overview

Every system file must contain all 10 sections plus the 7A and 7B handoff
packages. Section 10 IS the 7C handoff package (program contracts). No section
may be omitted; incomplete sections must be flagged during quality review.

| Section | Name | Min Depth | Purpose |
|---------|------|-----------|---------|
| 1 | System Overview | 3 fields | Identity and classification |
| 2 | System Goals | 3 bullets | Why this system exists |
| 3 | Entry & Triggers | 4 fields | How players encounter it |
| 4 | States & Flow | 3+ states | Lifecycle and transitions |
| 5 | Core Rules | 5+ rules | Executable behavior with IDs |
| 6 | Dependencies | all refs | Upstream/downstream links |
| 7 | One-Week Content (Day1-Day7) | 7 rows | Daily contribution tracking |
| 8 | Downstream Anchors | 5 sub-sections | Data/art/UI/tech/expression |
| 9 | Acceptance Criteria | 4+ criteria | Completion definition |
| 10 | Program Contracts (7C) | 6 sub-sections | State machines, events, formulas |
| 7A | Data Schema Anchors | 1+ tables | Stage 3A input |
| 7B | Numerical Balance Inputs | 8 categories | Stage 3B input |

---

## Section 1: System Overview

**Purpose:** Establish identity, classification, and priority so that downstream
consumers (data, art, UI, tech) know what kind of system they are dealing with.

**Required fields:**
- **System ID** -- Unique identifier in `SYS-UPPER_SNAKE-NNN` format
- **System Type** -- One of: `core`, `growth`, `commercial`, `support`
- **Priority** -- One of: `P0` (must-have), `P1` (should-have), `P2` (nice-to-have)

**Minimum depth:** 3 fields, all non-empty.

**Common failure modes:**
- Missing system ID (makes Stage 3 traceability impossible)
- Vague type classification ("gameplay" instead of `core`)
- No priority assignment (blocks development scheduling)

**Example:**
```
- System ID: SYS-CORE_GAMEPLAY-001
- Type: core
- Priority: P0
```

---

## Section 2: System Goals

**Purpose:** Explain why this system exists from both player and business
perspectives. Anchors all downstream decisions.

**Required fields:**
- **Player value** -- What the player gets from this system (concrete benefit)
- **Business goal** -- What business metric this system supports
- **Success criteria** -- Observable outcomes that prove the system works

**Minimum depth:** 3 bullet points, each with concrete and measurable content.

**Common failure modes:**
- Vague goals ("enhance experience", "make it more fun")
- Missing business goal (system exists but nobody knows why commercially)
- Success criteria that cannot be observed or measured

**Example:**
```
- Player value: Provides a satisfying core loop of tap-merge-discover that
  delivers visible progress every 30 seconds
- Business goal: Drives session length > 5 min (supports ad impression volume)
- Success criteria: 70% of sessions reach at least one tier-up event within
  first minute
```

---

## Section 3: Entry & Triggers

**Purpose:** Define how players discover and access this system. Ensures the
system is reachable and its unlock timing is compatible with other systems.

**Required fields:**
- **Player entry point** -- Where/how the player accesses this system
- **Unlock conditions** -- Prerequisites before the system is available
- **Trigger frequency** -- How often the player engages with this system
- **First encounter** -- When the player first sees this system (Day/level/event)

**Minimum depth:** 4 fields, all with concrete values (not "TBD").

**Common failure modes:**
- Entry point references a UI page that no system defines
- Unlock conditions reference content from a system that unlocks later
- No first encounter timing (quality gate cannot verify tutorial coverage)
- Trigger frequency missing (makes content rhythm planning impossible)

**Example:**
```
- Player entry point: Main game screen tap on any object
- Unlock conditions: None (available from first launch)
- Trigger frequency: Every session, multiple times per minute
- First encounter: Day 1, first 30 seconds (tutorial merge)
```

---

## Section 4: States & Flow

**Purpose:** Define the system's lifecycle as a state machine. Every system must
have at least 3 states with explicit entry/exit conditions.

**Required content:**
- **State list** -- At least 3 named states
- **State transitions** -- Conditions for each transition (from -> to + trigger)
- **Terminal conditions** -- How the flow ends (success, failure, timeout)
- **Failure recovery** -- What happens when something goes wrong

**Minimum depth:** >= 3 states, each with entry and exit conditions documented.

**Common failure modes:**
- Only 2 states (active/inactive) -- too shallow for program contracts
- Missing failure recovery (source spec 9.2 rejection criterion: "cannot answer
  what the player sees when this system fails")
- No terminal conditions (state machine runs forever)
- Transitions described in prose without specific triggers

**Example:**
```
States: idle -> active -> resolving -> complete
- idle: Waiting for player input. Exit: player taps an object.
- active: Player is selecting merge targets. Exit: valid merge pair selected
  OR 3-second timeout.
- resolving: Merge animation and score calculation in progress. Exit:
  animation complete.
- complete: Result displayed, board updated. Exit: auto-transition to idle
  after 0.5s.
- Failure recovery: If merge validation fails mid-animation, revert objects
  to pre-merge positions, show gentle shake feedback.
```

---

## Section 5: Core Rules

**Purpose:** Define the executable behavior of this system as discrete rules
with unique IDs. These rules are the primary input for Stage 3 data schema
and program implementation.

**Required format per rule:**
```
RULE-{SYSTEM}-NNN | {impl_type} | {description}. Source: R_N_NN [{priority}]
```

**Implementation types:**
- `config_driven` -- Behavior controlled by data table values (tunable)
- `logic_driven` -- Behavior hardcoded in program logic (not tunable)
- `mixed` -- Partially config-driven, partially logic-driven

**Minimum depth:** 5 rules per system. Each rule must have:
- A unique RULE ID
- An implementation type
- A concrete description (not vague)
- A source concept rule ID (R_N_NN) tracing back to Stage 1
- A priority level

**Common failure modes:**
- Rules described in prose without RULE IDs (Stage 3 cannot trace)
- Missing implementation type (program team cannot plan architecture)
- Vague rules ("handle edge cases appropriately")
- No source traceability (concept rule coverage gap)
- Config-driven rules that do not specify which table will carry them

**Example:**
```
> RULE-CORE_GAMEPLAY-001 | config_driven | Merge requires same-tier +
  adjacency on grid. Tier range: 1-12, configurable per chapter.
  Source: R_3_01 [P0]

> RULE-CORE_GAMEPLAY-002 | logic_driven | Combo chain: 3+ merges within
  2 seconds triggers combo multiplier (1.5x per chain step, max 5x).
  Source: R_3_04 [P0]
```

---

## Section 6: Dependencies

**Purpose:** Map this system's relationships with other systems. Every
dependency must specify direction, strength, and fallback behavior.

**Required content:**
- **Upstream** -- Systems that provide input to this system
- **Downstream** -- Systems that consume output from this system
- **Dependency strength** -- `strong` (system breaks without it) or `weak`
  (system degrades gracefully)
- **Fallback behavior** -- What happens when a dependency is unavailable

**Minimum depth:** All referenced system IDs must exist in the system list.
Every strong dependency must have a fallback.

**Common failure modes:**
- Circular strong dependencies (system A requires B, B requires A)
- Missing fallback for strong dependencies (source spec rejection criterion)
- Referencing systems that do not exist in the confirmed system list
- Not distinguishing strong from weak (all listed as generic "depends on")

**Example:**
```
Upstream:
- SYS-LEVEL-001 provides level configuration (strong). Fallback: use
  default level template if level config unavailable.

Downstream:
- SYS-SETTLEMENT-001 receives merge results and combo data (strong).
- SYS-TASK-001 receives "merge completed" events (weak). Fallback:
  task system operates without merge event tracking.
```

---

## Section 7: One-Week Content Contribution (Day1-Day7)

**Purpose:** Define what this system contributes to the player's daily
experience across one week. Used to build the cross-system CONTENT-RHYTHM.md.

**Required format:**

| Day | This System Provides | Type |
|-----|---------------------|------|
| Day1 | {content} | new_mechanic / reuse_variation |
| Day2 | {content} | new_mechanic / reuse_variation |
| Day3 | {content} | new_mechanic / reuse_variation |
| Day4 | {content} | new_mechanic / reuse_variation |
| Day5 | {content} | new_mechanic / reuse_variation |
| Day6 | {content} | new_mechanic / reuse_variation |
| Day7 | {content} | new_mechanic / reuse_variation |

**Content types:**
- `new_mechanic` -- A new gameplay element introduced for the first time
- `reuse_variation` -- An existing mechanic reused with variation/escalation

**Minimum depth:** All 7 days must have entries. No two consecutive days may
have completely empty contributions (source spec constraint).

**Common failure modes:**
- Missing days (especially Day5-Day7 get neglected)
- All entries are `reuse_variation` (no fresh content)
- Descriptions too vague ("more content")
- Content that contradicts unlock timing from Section 3

**Example:**
```
| Day1 | Basic merge tutorial (tier 1-3) | new_mechanic |
| Day2 | Grid expansion to 5x5, new object types | new_mechanic |
| Day3 | Combo chain mechanic introduction | new_mechanic |
| Day4 | Timed challenge variant (reuse merge on timer) | reuse_variation |
| Day5 | Grid expansion to 6x6, obstacle tiles | new_mechanic |
| Day6 | Limited-moves challenge (reuse merge with move cap) | reuse_variation |
| Day7 | Boss merge puzzle (combine + new mega-tier objects) | new_mechanic |
```

---

## Section 8: Downstream Anchors

**Purpose:** Define what downstream teams (data, art, UI, tech) need from this
system. These anchors become the input for Stage 3A and Stage 4.

### 8A. Data Anchors

| Table Name | Purpose | Primary Object |
|-----------|---------|----------------|

**Required:** At least 1 row per system. Table names are placeholders for
Stage 3A -- no field-level detail required at this stage.

### 8B. Art Anchors

| Asset | States | Notes |
|-------|--------|-------|

**Required:** List all visual assets this system needs. Each asset must
specify its states (idle, active, disabled, etc.).

### 8C. UI Anchors

| Page/Component | Interaction | Notes |
|---------------|-------------|-------|

**Required:** List all UI pages, popups, and interactive components. Each
must specify the primary interaction pattern.

### 8D. Tech Anchors

| Capability | Requirement | Notes |
|-----------|-------------|-------|

**Required:** List technical capabilities needed (config loading, callbacks,
error handling, persistence, etc.).

### 8E. Content Expression Model

**Purpose:** Tell Stage 3A how this system's data should be organized.
Without this, data schema design becomes guesswork.

**Required sub-fields:**
- **Level data model** -- How level/content data is organized:
  `single_row` (one row per level), `master_detail` (header + items),
  `node_graph` (connected nodes)
- **Spatial model** -- How spatial relationships are expressed:
  `grid`, `coordinate`, `angle_radius`, `path`
- **Event model** -- How in-game events are triggered:
  `fixed_script`, `conditional`, `wave_trigger`
- **Compound fields** -- Separator conventions for arrays, multi-segment
  configs, coordinate pairs

**Common failure modes:**
- Omitting 8E entirely (source spec 9.2 rejection criterion)
- Using prose instead of the structured sub-field format
- Spatial model missing when the system clearly has spatial elements

---

## Section 9: Acceptance Criteria

**Purpose:** Define how to determine when this system is "done" for
development purposes. Used by QA and producers.

**Required criteria (minimum 4):**
- **Feature complete** -- All rules from Section 5 are implemented
- **Experience complete** -- Player-facing flow matches Section 4 states
- **Configurable** -- All `config_driven` rules are data-table-driven
- **Error-recoverable** -- All failure recovery paths from Section 4 work

**Common failure modes:**
- Acceptance criteria that repeat the rules (circular)
- Missing error recovery criteria (source spec explicitly requires this)
- No measurable outcomes (criteria cannot be tested)

---

## Section 10: Program Contracts (7C)

**Purpose:** Provide program-implementation-ready specifications. If this
section is missing or shallow, the system is classified as "not developable"
per the source spec.

### 10.1 State Machine

| State | Entry Condition | Exit Condition | Terminal? |
|-------|----------------|----------------|-----------|

**Minimum:** 3 states. Must align with Section 4 states.

**Common failure modes:**
- Only 2 states (active/inactive)
- Entry/exit conditions are vague ("when appropriate")
- No terminal state marked

### 10.2 Event Bus

| Event ID | Trigger | Consumer | Payload Fields |
|----------|---------|----------|----------------|

**Minimum:** 2 events with non-empty payload fields.

**Common failure modes:**
- Events with empty payload (downstream consumer cannot use them)
- Missing consumer specification
- Event IDs not following naming convention

### 10.3 Rule Priorities

| Conflict Scenario | Resolution Order | Interrupt? |
|-------------------|-----------------|------------|

**Required:** Document what happens when two rules from Section 5 fire
simultaneously or on the same game tick/node.

### 10.4 Formula Pseudo-Code

**CRITICAL:** This section must contain actual pseudo-code, NOT prose.

**Failure example (prose -- REJECTED):**
```
Score is calculated based on the tier of merged objects and combo multiplier.
```

**Correct example (pseudo-code -- ACCEPTED):**
```
// merge_score
base_score = merged_object.tier * 10
combo_bonus = combo_count > 1 ? base_score * (0.5 * (combo_count - 1)) : 0
total_score = base_score + combo_bonus
```

### 10.5 Error Codes

| Code | Category | User Message | System Action |
|------|----------|-------------|---------------|

**Required:** At least error codes for the failure scenarios described in
Section 4 failure recovery.

### 10.6 Client/Server Split

| Operation | Client Responsibility | Server Responsibility | Rationale |
|-----------|----------------------|----------------------|-----------|

**Required:** For each key operation, document what runs on client vs server
and why. This drives Stage 3 architecture decisions.

---

## 7A. Data Schema Anchors (for Stage 3A)

**Purpose:** Bridge between system design and data schema creation. Stage 3A
reads this to know what tables to create without guessing.

| Table Name | Purpose | Related Rules |
|-----------|---------|---------------|

**Required content:**
- Every table from Section 8A must appear here
- Each table must reference at least one RULE ID from Section 5
- Table names follow data team conventions (lowercase_snake_case)

**Common failure modes:**
- Tables with no related rules (orphaned data)
- Rules from Section 5 with no corresponding table (data gap)
- Table names that conflict with other systems' tables

---

## 7B. Numerical Balance Inputs (for Stage 3B)

**Purpose:** Provide the 8 mandatory input categories that Stage 3B (numerical
balancing) requires. If any category is missing, Stage 3B cannot start.

### Category 1: Lifecycle Target Matrix

Day1-Day7 daily experience targets mapping to player emotional states:
freshness, challenge, growth, mastery. Each day must have a primary target
and the system's contribution to it.

### Category 2: Level Segment Anchors

Key segment boundaries (e.g., levels 1-10, 11-30, 31-60) with:
- Expected pressure source per segment
- Recovery mechanism per segment
- Difficulty curve shape within segment

### Category 3: Commercialization Constraints

- Ad intervention boundaries (allowed nodes / prohibited interrupt nodes)
- Light-pay intervention boundaries (first touch timing, conflict avoidance)

### Category 4: Economy Constraints

- Core resource sources and sinks for this system
- Allowed chokepoints vs prohibited drought scenarios
- Safety-net mechanisms (failure compensation, low-point supply)

### Category 5: Tuning Levers

- Key adjustable parameters (pass pressure, output rates, consumption rates,
  growth multipliers)
- Impact scope per parameter (which systems and experiences are affected)

### Category 6: Hot-Update Permissions

- Parameters that can be hot-updated without client release
- Parameters that require client release
- Risk parameters (changes require approval)

### Category 7: Validation Criteria

- Core metrics to observe (first-clear rate, retry rate, resource drought,
  task completion)
- Anomaly thresholds (when to flag "too hard", "too easy", "drought")

### Category 8: Numerical No-Go Zones

- Problems that must NOT be solved by purely tuning numbers
- These must be solved by mechanic or level design changes instead

**Common failure modes:**
- Missing entire categories (Stage 3B blocks)
- Categories with only headers and no content
- Economy constraints that contradict another system's economy section

---

## Cross-Section Consistency Requirements

Within each system file, the following must be internally consistent:

1. **Section 4 <-> Section 10.1** -- States in Section 4 must match the state
   machine in 10.1 exactly. Same states, same transitions.

2. **Section 5 <-> 7A** -- Every config_driven rule in Section 5 must have a
   corresponding table in 7A. No orphaned rules or orphaned tables.

3. **Section 5 <-> 10.4** -- Rules that involve calculation must have
   corresponding pseudo-code in 10.4.

4. **Section 3 <-> Section 7** -- First encounter timing in Section 3 must
   align with Day1-Day7 content in Section 7 (if system unlocks Day 3, Day1-2
   contributions should reflect "not yet available").

5. **Section 4 failure recovery <-> 10.5** -- Every failure scenario in
   Section 4 must have a corresponding error code in 10.5.

---

## Depth Enforcement Summary

| Check | Minimum | Rejection If Below |
|-------|---------|-------------------|
| States in Section 4 | 3 | "System not developable" |
| Rules in Section 5 | 5 | "System not traceable" |
| Days in Section 7 | 7 | "Content rhythm gap" |
| States in Section 10.1 | 3 | "State machine too shallow" |
| Events in Section 10.2 | 2 with payloads | "Event bus undefined" |
| 7B categories | 8 | "Stage 3B blocked" |
| Anchor sub-sections in 8 | 5 (8A-8E) | "Downstream anchors incomplete" |
| Acceptance criteria | 4 | "No completion definition" |
