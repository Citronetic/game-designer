---
name: gf-system-design
description: "Stage 2: Expand your concept into detailed, traceable system designs"
disable-model-invocation: true
allowed-tools: [Read, Bash, Task]
---

# /gf:system-design -- Stage 2: System Design

Expand your completed concept document into detailed per-system design files. Each session covers 1-2 systems. The system designer agent asks targeted questions, proposes ideas with rationale, then generates each system file with all 10 sections and inline 7A/7B/7C handoff packages.

## Step 1: Load Project State

Run:
```
!`node bin/gf-tools.cjs init progress`
```

- If `project_exists` is `false`: Display "No Game Forge project found. Run `/gf:new-game` to start." **Stop.**

**Auto-mode detection:** Check `$ARGUMENTS` for `--auto` flag. Store as `AUTO_MODE` (true/false). When `AUTO_MODE` is true, all user interaction is skipped and the entire system design stage runs in a single autonomous pass.

- Check `stages.concept` -- if not `complete` **and NOT `AUTO_MODE`**: Display "Stage 2 requires the concept stage to be complete. Run `/gf:concept` first." **Stop.**
  - **If `AUTO_MODE`:** Skip prerequisite check (the auto pipeline just completed concept stage).

Load configuration:
```
!`node bin/gf-tools.cjs config-get genre`
!`node bin/gf-tools.cjs config-get language`
```

Store these as `GENRE` and `LANGUAGE`.

## Step 1.5: Determine Session Granularity

**If `AUTO_MODE`:** Skip session granularity calculation entirely. Auto mode designs ALL confirmed systems in a single pass. Proceed directly to Step 2.

Run:
```
!`node bin/gf-tools.cjs system-design system-status`
```

Count confirmed systems from the response.

Adjust systems-per-session:
- 3-5 systems: 2 systems per session
- 6-8 systems: 1-2 systems per session (current default)
- 9+ systems: 1 system per session

Display: "Session plan: {N} systems total, {batch} per session ({ceil(N/batch)} sessions expected)."

Note: If no system list has been confirmed yet, skip this step. Session granularity will be determined after system list confirmation in Step 3.

## Step 2: Check System List Status

Run:
```
!`node bin/gf-tools.cjs system-design system-status`
```

The response is a JSON object with `{systemId: status}` entries. Determine the current state:

- **A. Empty response / no confirmed system list:** No system list has been confirmed yet. Go to **Step 3** (propose systems).
- **B. Some systems not complete:** A confirmed list exists but not all systems have status `complete`. Go to **Step 4** (calculate next batch).
- **C. All systems complete:** Every confirmed system has status `complete`. Go to **Step 6** (quality gate).

## Step 3: Propose System List (only if no confirmed list)

Read all concept chapter files from `.gf/stages/01-concept/ch*.md` to extract frontmatter summaries and rule IDs.

Run:
```
!`node bin/gf-tools.cjs system-design propose-systems`
```

This returns concept chapter summaries to inform the proposal.

Read the source spec's system categories for reference:
- **Core layer:** gameplay, settlement/score, level/content, economy
- **Conditional layer:** social, competition, ad monetization, IAP/shop, live events

Based on the concept chapters, genre, and rule IDs, propose a tailored system list. Each proposed system must have:
- **name** -- Display name for the system
- **type** -- core, growth, commercial, or support
- **priority** -- P0 (must-have), P1 (should-have), P2 (nice-to-have)
- **concept_sources** -- Which R_N_NN concept rule IDs this system will consume

**If `AUTO_MODE`:**
- Still run `propose-systems` CLI command to gather concept context.
- Auto-generate the system list proposal (same logic as interactive mode).
- Auto-confirm without user review: immediately run `confirm-systems` with the proposed list.
- Skip user iteration. Proceed directly to designing all systems.

**If NOT `AUTO_MODE`:**
Present the proposal to the user:
"Based on your concept, I propose these {N} systems for detailed design: ..."

Display each system with its type, priority, and which concept chapters it draws from.

Ask the user to confirm, add, remove, or rename systems. Iterate until they approve the list.

After confirmation, save the system list:
```
!`node bin/gf-tools.cjs system-design confirm-systems --data '{"systems":[{"name":"...","type":"...","priority":"...","concept_sources":["R_N_NN",...]},...]}' `
```

Update state:
```
!`node bin/gf-tools.cjs state update "System Design" "in_progress"`
```

Proceed to **Step 4**.

## Step 4: Calculate Next Batch

**If `AUTO_MODE`:** Set the batch to ALL confirmed systems at once. Do not split into sessions. Proceed directly to Step 5 with the full system list.

From system status (Step 2), find systems with status != `complete`.

Pick the next 1-2 systems to design in this session, following priority order:
1. P0 systems first, then P1, then P2
2. Within the same priority: design systems that have fewer dependencies first (so later systems can reference completed ones)

**Locked rule:** 1-2 systems per session, deep design pace. Never assign more than 2 systems in a single session (unless AUTO_MODE, which sends all systems at once).

Calculate session number based on completed system count.

## Step 5: Spawn System Designer Agent

Display session header:
"**Session {N}: Designing {System A}** (and **{System B}** if applicable)"

**If not the first session:** Load the `summary` frontmatter field from each completed system file in `.gf/stages/02-system-design/systems/`. Display as cross-system context:
- "**Completed systems:** {SYS-A-001}: {summary}, {SYS-B-001}: {summary}, ..."

Spawn `.claude/agents/gf-system-designer.md` via the Task tool with the following context:

```
You are working on detailed system design. Here is your assignment:

**Systems to design this session:**
- System 1: {name} | Type: {type} | Priority: {priority} | Concept sources: [{R_N_NN list}]
{If 2 systems:}
- System 2: {name} | Type: {type} | Priority: {priority} | Concept sources: [{R_N_NN list}]

**Genre:** {GENRE}
**Language:** {LANGUAGE} -- ALL system content must be in this language
**Output path:** .gf/stages/02-system-design/systems/
**System slug format:** Use system name slugified to lowercase-hyphen (e.g., "Core Gameplay" -> "core-gameplay.md")

**Reference files to read:**
- .claude/skills/gf-system-design/references/system-template.md (what each section requires)
- .claude/skills/gf-system-design/templates/system-file-template.md (exact output format)

**Concept chapter files to read for context:**
{List of .gf/stages/01-concept/ch*.md files relevant to this system's concept_sources}

**Confirmed system list (for dependency mapping):**
{Full list of confirmed systems with names and types, so the agent can fill depends_on/depended_by}

**ID registration commands:**
- System ID: node bin/gf-tools.cjs registry add '{"id":"SYS-{NAME}-001","type":"SYS","system":"{NAME}","description":"..."}'
- Rule ID: node bin/gf-tools.cjs registry add '{"id":"RULE-{NAME}-001","type":"RULE","system":"{NAME}","description":"..."}'
- System name to ID: uppercase, replace spaces/hyphens with underscore (e.g., "Core Gameplay" -> CORE_GAMEPLAY)

{IF NOT FIRST SESSION:}
**Cross-system context from completed systems:**
{List of system summaries from completed system file frontmatter}
Maintain consistency: same resource names, same dependency references, same mechanic terminology.
{END IF}

**Constraints:**
- 1-2 systems per session, deep design pace (unless AUTO_MODE, which sends all systems at once)
- Use STRONG PROPOSALS: "I recommend X because Y. Agree?" -- NOT passive questioning
- Rule IDs (RULE-{SYSTEM}-NNN) assigned DURING generation, never post-hoc
- Must produce all 10 sections + 7A/7B/7C per system (Section 10 IS the 7C handoff)
- Depth minimums: >= 3 states in Section 4, >= 5 rules in Section 5, >= 2 events with payloads in 10.2, pseudo-code formulas in 10.4 (no prose)
- Must-ask topics (system boundaries, monetization, core mechanics, difficulty philosophy) must be thoroughly explored with the user, NEVER skipped or auto-filled
- 7A: table names + purpose only (no field-level detail -- that's Stage 3A)
- 7B: full 8 categories of numerical balance inputs
- 7C (Section 10): full depth -- state machines >= 3 states, events with payloads, pseudo-code formulas, error codes, client/server split
{IF AUTO_MODE:}
**AUTO MODE -- No user interaction:**
- Do NOT use AskUserQuestion. Do NOT ask the user anything.
- Design ALL assigned systems autonomously in a single pass.
- For must-ask topics (system boundaries, monetization, core mechanics, difficulty philosophy): use your best judgment based on the concept documents and genre conventions.
- Make strong, opinionated design choices. Prioritize completeness and consistency.
- Maintain the same output quality and depth as interactive mode (all 10 sections + 7A/7B/7C).
{END IF}
```

## Step 6: After Agent Completes / All Systems Done

Re-check system status:
```
!`node bin/gf-tools.cjs system-design system-status`
```

### If all systems are complete:

Display: "All systems designed. Running quality gate..."

Run traceability check:
```
!`node bin/gf-tools.cjs system-design trace-check`
```

Display the traceability results (mapped count, unmapped rules, coverage percentage).

Spawn `.claude/agents/gf-system-quality-reviewer.md` via the Task tool:

```
Run the system design quality gate.

**System files location:** .gf/stages/02-system-design/systems/
**Quality criteria:** .claude/skills/gf-system-design/references/quality-criteria.md
**Cross-system checks:** .claude/skills/gf-system-design/references/cross-system-checks.md
**Language:** {LANGUAGE} -- REVIEW.md content in this language

**Trace-check results:** {paste JSON results from trace-check}

**Instructions:**
- Read all system files from .gf/stages/02-system-design/systems/*.md
- Read quality-criteria.md for per-system structural validation rules
- Read cross-system-checks.md for the 4 consistency checks
- Apply auto-fixes directly to system files (missing sections, shallow state machines, empty payloads, prose formulas, missing anchors, missing frontmatter, missing rule IDs, incomplete Day1-Day7)
- Register any new IDs via: node bin/gf-tools.cjs registry add '{"id":"...","type":"RULE","system":"...","description":"..."}'
- Run: node bin/gf-tools.cjs system-design consistency-check
- Write REVIEW.md to .gf/stages/02-system-design/REVIEW.md
- NEVER auto-fill these topics -- always flag for user decision:
  - System boundary disputes (rule appears in multiple systems)
  - Monetization model (ad placement, IAP products, revenue approach)
  - Core mechanic alternatives (multiple valid implementations)
  - Difficulty philosophy (accessibility vs challenge)
{IF AUTO_MODE:}
**AUTO MODE:** For must-ask items, use AI best judgment instead of flagging for user decision. Apply your recommendation directly. Log what you decided in REVIEW.md under a new 'Auto-Resolved Decisions' section.
{END IF}
```

After quality gate completes:

**If `AUTO_MODE`:**
- Skip presenting REVIEW.md to user. Skip collecting user decisions.
- Proceed directly to **Step 7**.

**If NOT `AUTO_MODE`:**
- Read and display `.gf/stages/02-system-design/REVIEW.md` contents to the user.
- **If REVIEW.md has "Needs User Decision" items:**
  - Present each decision to the user and collect their answers.
  - Apply their decisions to the relevant system files.
  - Re-run the quality gate to verify all issues are resolved.
- **If all checks pass (no user decisions needed):**
  - Proceed to **Step 7**.

### If more systems remain:

Calculate remaining system count.

Display: "Session complete. {N} systems remaining across approximately {M} more sessions. Run `/gf:system-design` to continue."

Show progress:
```
!`node bin/gf-tools.cjs progress full`
```

## Step 7: Generate Content Rhythm and Complete

After the quality gate passes with no outstanding issues:

Read all system files from `.gf/stages/02-system-design/systems/*.md`. Extract Section 7 (Day1-Day7 contributions) from each system.

Read the content rhythm template:
```
!Read .claude/skills/gf-system-design/templates/content-rhythm-template.md
```

Generate `CONTENT-RHYTHM.md` by:
1. Aggregating each system's Day1-Day7 contributions into a unified daily plan
2. Building the Daily Rhythm overview table
3. Listing per-day system contributions with source system IDs
4. Verifying content supply constraints (Days 1-3 new changes, Days 4-7 phase changes, task chain closure, daily task cycle, milestone tiers)
5. Verifying consumability constraints (daily progress, short goals, medium goals)

Write the content rhythm file:
```
!Write .gf/stages/02-system-design/CONTENT-RHYTHM.md
```

Update state to complete:
```
!`node bin/gf-tools.cjs state update "System Design" "complete"`
```

**If `AUTO_MODE`:**
Display: "System design stage complete (auto mode). Proceeding to next stage..."

**If NOT `AUTO_MODE`:**
Display: "System design stage complete! All systems designed, quality gate passed, and content rhythm generated. Run `/gf:data-schema` to begin Stage 3A."

## Constraints

These rules are locked decisions and must never be violated:

- **AI proposes system list, NOT a fixed template:** The system list is tailored to THIS game's concept chapters, not copied from the source specification's mandatory list
- **1-2 systems per session:** Deep design pace. Never assign more than 2 systems in a single session
- **Question then generate + strong proposals:** Same interactive pattern from Stage 1. AI asks 3-5 targeted questions per system, proposes ideas with rationale, then generates the full system spec
- **7A/7B/7C inline per system:** Each system file includes its own handoff sections. No separate aggregated handoff files
- **Quality gate runs ONCE after ALL systems complete:** Not per-session, not per-system. One comprehensive review after everything is done
- **Content rhythm generated AFTER quality gate passes:** Needs all system data to be finalized before aggregation
- **Must-ask topics NEVER auto-filled (interactive mode):** System boundaries, monetization model, core mechanic alternatives, and difficulty philosophy always require explicit user input. The quality gate must flag these if unclear and never generate content for them
- **Rule IDs assigned DURING generation:** RULE-{SYSTEM}-NNN IDs are embedded inline as the system spec is written, never added post-hoc
- **Section 10 IS the 7C handoff:** Program contracts (state machines, events, formulas, error codes, client/server split) are Section 10, not a separate section
- **Auto mode:** When `--auto` flag is present, all user interaction is skipped. Must-ask topics are resolved by AI judgment. Systems are designed in a single batch, not across sessions. System list is auto-proposed and auto-confirmed. Quality gate auto-approves. The structural quality (rule IDs, section depth, 7A/7B/7C completeness) is identical to interactive mode.
