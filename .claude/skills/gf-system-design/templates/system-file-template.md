# System File Output Template

This template defines the exact output format for per-system design files.
The system-designer agent fills in this structure when generating each system
file to `.gf/stages/02-system-design/systems/`.

## Frontmatter Schema

Every system file must begin with YAML frontmatter containing these fields:

```yaml
---
system_id: "SYS-{NAME}-001"            # Unique system ID (SYS-UPPER_SNAKE-NNN)
system_name: "{Display Name}"           # Human-readable system name
system_type: "{core|growth|commercial|support}"  # System classification
priority: "{P0|P1|P2}"                  # Development priority
status: complete                        # complete | draft | review
rule_count: {N}                         # Number of RULE-{SYSTEM}-NNN rules
concept_sources: [R_N_NN, ...]          # Concept stage rule IDs consumed
depends_on: [SYS-X-001, ...]           # Systems this one requires (upstream)
depended_by: [SYS-Y-001, ...]          # Systems that require this one (downstream)
generated_at: "{ISO timestamp}"         # When this file was generated
summary: "{1-2 sentence summary}"       # Compressed context for cross-system use
---
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| system_id | string | YES | Unique ID in SYS-UPPER_SNAKE-NNN format |
| system_name | string | YES | Display name in user's configured language |
| system_type | enum | YES | One of: core, growth, commercial, support |
| priority | enum | YES | One of: P0, P1, P2 |
| status | enum | YES | One of: complete, draft, review |
| rule_count | integer | YES | Count of RULE IDs in body |
| concept_sources | array | YES | R_N_NN IDs from concept chapters this system consumes |
| depends_on | array | YES | SYS IDs of upstream dependencies (empty array if none) |
| depended_by | array | YES | SYS IDs of downstream dependents (empty array if none) |
| generated_at | string | YES | ISO 8601 timestamp |
| summary | string | YES | 1-2 sentence summary for cross-system context |

## Body Structure

```markdown
# System: {Display Name}

## 1. System Overview

- System ID: {system_id}
- Type: {system_type}
- Priority: {priority}

<!-- All 3 fields required. Type and priority must use exact enum values. -->

## 2. System Goals

- Player value: {Why the player needs this system -- concrete benefit, not vague}
- Business goal: {What business metric this supports -- measurable}
- Success criteria: {Observable outcomes that prove the system works}

<!-- Minimum 3 bullet points. No vague phrases like "enhance experience". -->

## 3. Entry & Triggers

- Player entry point: {Where/how player accesses this system}
- Unlock conditions: {Prerequisites -- "None" if available from start}
- Trigger frequency: {How often the player engages -- per session/per day/per level}
- First encounter: {When player first sees this -- Day N / Level N / Event}

<!-- All 4 fields required with concrete values, not "TBD". -->

## 4. States & Flow

### State List

<!-- At least 3 named states. Each state has entry and exit conditions. -->

| State | Description |
|-------|-------------|
| {state_1} | {what this state represents} |
| {state_2} | {what this state represents} |
| {state_3} | {what this state represents} |

### State Transitions

<!-- Explicit transition conditions. Format: from -> to (trigger) -->

- {state_1} -> {state_2}: {trigger condition}
- {state_2} -> {state_3}: {trigger condition}
- {state_3} -> {state_1}: {trigger condition}

### Terminal Conditions

{How the flow ends -- success, failure, timeout, or explicit exit}

### Failure Recovery

{What happens when something goes wrong -- visible to player + system action}

## 5. Core Rules

<!-- At least 5 executable rules with RULE IDs.
     Format: RULE-{SYSTEM}-NNN | impl_type | description. Source: R_N_NN [priority]
     impl_type: config_driven | logic_driven | mixed
     config_driven/mixed rules must note which table will carry them. -->

> **RULE-{SYSTEM}-001** | {config_driven|logic_driven|mixed} | {Concrete, executable rule description}. Source: R_{N}_{NN} [{P0|P1|P2}]

> **RULE-{SYSTEM}-002** | {impl_type} | {description}. Source: R_{N}_{NN} [{priority}]

> **RULE-{SYSTEM}-003** | {impl_type} | {description}. Source: R_{N}_{NN} [{priority}]

> **RULE-{SYSTEM}-004** | {impl_type} | {description}. Source: R_{N}_{NN} [{priority}]

> **RULE-{SYSTEM}-005** | {impl_type} | {description}. Source: R_{N}_{NN} [{priority}]

## 6. Dependencies

### Upstream

<!-- Systems that provide input to this system -->

| System | Provides | Strength | Fallback |
|--------|----------|----------|----------|
| {SYS-X-001} | {what it provides} | strong/weak | {fallback behavior} |

### Downstream

<!-- Systems that consume output from this system -->

| System | Receives | Strength | Fallback |
|--------|----------|----------|----------|
| {SYS-Y-001} | {what it receives} | strong/weak | {fallback behavior} |

## 7. One-Week Content Contribution (Day1-Day7)

<!-- All 7 days required. Type: new_mechanic or reuse_variation.
     No two consecutive days may have empty contributions. -->

| Day | This System Provides | Type |
|-----|---------------------|------|
| Day1 | {new mechanic/content this system provides} | new_mechanic |
| Day2 | {content} | new_mechanic / reuse_variation |
| Day3 | {content} | new_mechanic / reuse_variation |
| Day4 | {content} | new_mechanic / reuse_variation |
| Day5 | {content} | new_mechanic / reuse_variation |
| Day6 | {content} | new_mechanic / reuse_variation |
| Day7 | {content} | new_mechanic / reuse_variation |

## 8. Downstream Anchors

### 8A. Data Anchors

<!-- Table names for Stage 3A. No field-level detail needed. -->

| Table Name | Purpose | Primary Object |
|-----------|---------|----------------|
| {table_name} | {what this table stores} | {primary entity} |

### 8B. Art Anchors

<!-- Visual assets needed. Each with states. -->

| Asset | States | Notes |
|-------|--------|-------|
| {asset_name} | {idle, active, disabled, ...} | {additional context} |

### 8C. UI Anchors

<!-- UI pages, popups, and interactive components. -->

| Page/Component | Interaction | Notes |
|---------------|-------------|-------|
| {page_name} | {primary interaction pattern} | {additional context} |

### 8D. Tech Anchors

<!-- Technical capabilities required. -->

| Capability | Requirement | Notes |
|-----------|-------------|-------|
| {capability} | {specific technical requirement} | {additional context} |

### 8E. Content Expression Model

<!-- How this system's data should be organized for Stage 3A. -->

- Level data model: {single_row | master_detail | node_graph}
- Spatial model: {grid | coordinate | angle_radius | path | N/A}
- Event model: {fixed_script | conditional | wave_trigger | N/A}
- Compound fields: {separator conventions for arrays, multi-segment configs}

## 9. Acceptance Criteria

<!-- At least 4 criteria. Each must be testable/observable. -->

- [ ] Feature complete: {all rules from Section 5 implemented -- measurable check}
- [ ] Experience complete: {player-facing flow matches Section 4 states -- observable}
- [ ] Configurable: {all config_driven rules are data-table-driven -- verifiable}
- [ ] Error-recoverable: {all failure recovery paths from Section 4 work -- testable}

## 10. Program Contracts (7C)

### 10.1 State Machine

<!-- Must align exactly with Section 4 states. Minimum 3 states. -->

| State | Entry Condition | Exit Condition | Terminal? |
|-------|----------------|----------------|-----------|
| {state_1} | {condition} | {condition} | No |
| {state_2} | {condition} | {condition} | No |
| {state_3} | {condition} | {condition} | Yes/No |

### 10.2 Event Bus

<!-- Minimum 2 events with non-empty payload fields. -->

| Event ID | Trigger | Consumer | Payload Fields |
|----------|---------|----------|----------------|
| {EVT_SYSTEM_ACTION} | {when fired} | {SYS-X-001, ...} | {field1: type, field2: type, ...} |

### 10.3 Rule Priorities

<!-- What happens when rules conflict on same tick/node. -->

| Conflict Scenario | Resolution Order | Interrupt? |
|-------------------|-----------------|------------|
| {scenario description} | {which rule wins and why} | Yes/No |

### 10.4 Formula Pseudo-Code

<!-- MUST be actual pseudo-code, NOT prose descriptions.
     "Score is calculated based on..." is REJECTED.
     Actual formulas with variables and operators are REQUIRED. -->

```
// {formula_name}
{variable} = {expression with operators and concrete values}
{result} = {final calculation}
```

### 10.5 Error Codes

<!-- At least one error code per failure scenario from Section 4. -->

| Code | Category | User Message | System Action |
|------|----------|-------------|---------------|
| {ERR_SYSTEM_NNN} | {category} | {player-facing message} | {retry/rollback/fallback/log} |

### 10.6 Client/Server Split

<!-- For each key operation, document responsibility split. -->

| Operation | Client Responsibility | Server Responsibility | Rationale |
|-----------|----------------------|----------------------|-----------|
| {operation} | {what client does} | {what server does} | {why split this way} |

## 7A. Data Schema Anchors (for Stage 3A)

<!-- Every table from 8A must appear here with related rule IDs. -->

| Table Name | Purpose | Related Rules |
|-----------|---------|---------------|
| {table_name} | {purpose from 8A} | RULE-{SYSTEM}-001, RULE-{SYSTEM}-002 |

## 7B. Numerical Balance Inputs (for Stage 3B)

<!-- All 8 categories required. Missing any category blocks Stage 3B. -->

### 1. Lifecycle Target Matrix

{Day1-Day7 daily experience targets for this system}

### 2. Level Segment Anchors

{Key segment boundaries with pressure sources and recovery mechanisms}

### 3. Commercialization Constraints

{Ad intervention boundaries, light-pay timing, conflict avoidance}

### 4. Economy Constraints

{Resource sources, sinks, chokepoints, safety nets for this system}

### 5. Tuning Levers

{Key adjustable parameters and their impact scope}

### 6. Hot-Update Permissions

{Which parameters can be hot-updated, which need client release}

### 7. Validation Criteria

{Core metrics to observe and anomaly thresholds}

### 8. Numerical No-Go Zones

{Problems that must NOT be solved by tuning numbers alone}
```

## Rule ID Format

Rules are embedded inline using blockquote format:

```markdown
> **RULE-CORE_GAMEPLAY-001** | config_driven | Merge requires same-tier adjacency. Tier range: 1-12, configurable per chapter. Source: R_3_01 [P0]
```

Components:
- `RULE-{SYSTEM}-NNN` -- Unique rule ID within the system
- `{impl_type}` -- config_driven, logic_driven, or mixed
- `{description}` -- Concrete, executable rule statement
- `Source: R_N_NN` -- Traceability to concept stage rule
- `[{priority}]` -- P0 (must-have), P1 (should-have), P2 (nice-to-have)

## Language Rules

- All body content (headings, descriptions, rules, questions) is generated in
  the user's configured language (from `.gf/config.json` `language` field)
- Keys and IDs always use English regardless of language setting:
  - system_id, system_type, priority, status (frontmatter)
  - RULE-{SYSTEM}-NNN (rule IDs)
  - SYS-{NAME}-NNN (system IDs)
  - impl_type values: config_driven, logic_driven, mixed
  - Content type values: new_mechanic, reuse_variation
  - Data model values: single_row, master_detail, node_graph
  - Spatial model values: grid, coordinate, angle_radius, path
  - Event model values: fixed_script, conditional, wave_trigger

## Example

```yaml
---
system_id: "SYS-CORE_GAMEPLAY-001"
system_name: "Core Gameplay"
system_type: core
priority: P0
status: complete
rule_count: 8
concept_sources: [R_3_01, R_3_02, R_3_03, R_3_04, R_3_05, R_5_01, R_5_02, R_5_03]
depends_on: []
depended_by: [SYS-SETTLEMENT-001, SYS-LEVEL-001]
generated_at: "2026-03-15T10:30:00Z"
summary: "Tap-and-merge system with 12-tier objects on 6x6 grid, combo chains, and fail-safe mechanics."
---
```
