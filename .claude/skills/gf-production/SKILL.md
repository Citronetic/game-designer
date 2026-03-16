---
name: gf-production
description: "Stage 4: Produce art, UI/UX, and tech specifications"
disable-model-invocation: true
allowed-tools: [Read, Write, Bash, Task]
---

# /gf:production -- Stage 4: Production Specifications

Generate art, UI/UX, and tech specification documents from your completed system designs. The production orchestrator extracts Section 8 art/UI anchors and Section 10 (7C) contracts from all system files, spawns three generator agents (art, UI, tech) to produce specification documents, then runs a quality gate to validate cross-spec consistency and traceability before completion.

## Step 1: Load Project State and Check Prerequisites

Run:
```
!`node bin/gf-tools.cjs init progress`
```

- If `project_exists` is `false`: Display "No Game Forge project found. Run `/gf:new-game` to start." **Stop.**

**Auto-mode detection:** Check `$ARGUMENTS` for `--auto` flag. Store as `AUTO_MODE` (true/false). When `AUTO_MODE` is true, all user interaction is skipped and the entire production stage runs in a single autonomous pass.

- Check `stages.balance` -- if not `complete` **and NOT `AUTO_MODE`**: Display "Stage 4 requires the balance stage to be complete. Run `/gf:balance` first." **Stop.**
  - **If `AUTO_MODE`:** Skip prerequisite check (the auto pipeline just completed balance stage).

Load configuration:
```
!`node bin/gf-tools.cjs config-get language`
!`node bin/gf-tools.cjs config-get genre`
```

Store as `LANGUAGE` and `GENRE`.

Parse command arguments for optional flags:
- `--art-only` -- generate only the art specification
- `--ui-only` -- generate only the UI specification
- `--tech-only` -- generate only the tech specification

If no flag is provided, all three specs are generated.

**If `AUTO_MODE`:** Ignore `--art-only`, `--ui-only`, `--tech-only` flags. Auto mode always generates all three specs.

## Step 2: Detect State and Branch

Run:
```
!`node bin/gf-tools.cjs production status`
```

**If `AUTO_MODE`:** Always take the Generate path (not_started -> Step 3), then automatically continue through Review (Step 5) and Complete (Step 6) without stopping. The entire generate-review-complete pipeline runs in one pass.

Branch based on the returned `status` value:

- **`not_started`** -> Go to **Step 3** (Generate path)
- **`in_progress`** -> Go to **Step 5** (Review path)
- **`complete`** -> Display completion message: "Stage 4 Production Specifications are complete. Quality gate has passed. To re-run the quality gate, reply 'review'. To start fresh, reply 'regenerate'." Wait for user input.
  - If user says "review" -> Go to **Step 5**
  - If user says "regenerate" -> Go to **Step 3**
  - Otherwise -> Display progress and **Stop.**

## Step 3: Extract Anchors and Gather Context

### 3a. Extract Art Anchors

Run:
```
!`node bin/gf-tools.cjs production extract-art-anchors`
```

Parse the JSON response. Store art anchors for the art generator agent.

### 3b. Extract UI Anchors

Run:
```
!`node bin/gf-tools.cjs production extract-ui-anchors`
```

Parse the JSON response. Store UI anchors for the UI generator agent.

### 3c. Extract 7C Contracts

Run:
```
!`node bin/gf-tools.cjs production extract-7c`
```

Parse the JSON response. Store 7C contracts for the tech generator agent.

### 3d. Determine Session Granularity

**If `AUTO_MODE`:** Skip session granularity calculation and split suggestion entirely. Auto mode always generates all three specs in a single pass regardless of system count. Proceed directly to Step 4.

Run:
```
!`node bin/gf-tools.cjs system-design system-status`
```

Count confirmed systems from the response.

Adjust generation strategy based on system count:
- **3-8 systems:** Generate all 3 specs in sequence (default). Display: "Found {N} systems. Generating all production specs in a single session."
- **9+ systems:** Suggest using `--art-only`, `--ui-only`, `--tech-only` flags in separate invocations. Display: "Your game has {N} systems. For best quality, consider generating specs in separate passes using `--art-only`, `--ui-only`, and `--tech-only` flags. Or continue with all three specs in a single session." Wait for user preference. If user wants to continue, proceed with all three.

Display anchor summary:
"Found **{N} systems** with art anchors, UI anchors, and 7C contracts."

List each system briefly: system ID, system name.

## Step 4: Spawn Generator Agents

Determine which agents to spawn based on flags:
- No flags: spawn all three agents sequentially
- `--art-only`: spawn only the art spec generator
- `--ui-only`: spawn only the UI spec generator
- `--tech-only`: spawn only the tech spec generator

Gather system file list:
```
!`ls .gf/stages/02-system-design/systems/*.md`
```

### 4a. Spawn Art Spec Generator (unless --ui-only or --tech-only)

Spawn `.claude/agents/gf-art-spec-generator.md` via the Task tool with:

```
You are generating a complete art requirement specification from Stage 2 system designs.

**Art Anchors (from Section 8.2):**
{paste full JSON from production extract-art-anchors}

**Genre:** {GENRE}
**Language:** {LANGUAGE} -- ALL art spec content must be in this language (descriptions, rationale, notes). Asset IDs, system IDs, and field names remain in English.

**Template file to read (output format):**
- .claude/skills/gf-production/templates/art-spec-template.md

**System design files to read:**
{list all .gf/stages/02-system-design/systems/*.md files}

**Data schema reference:**
- .gf/stages/03a-data-schema/tables.md (for asset-related table references)

**Output file:** .gf/stages/04-production/ART-SPEC.md

**Constraints:**
- NO ghost assets. Every asset must trace to a Stage 2 system ID.
- Asset IDs use ART-{SYSTEM_ID}-NNN format.
- Content rhythm (Day1-Day7) from system design Section 7 maps to Section E.
- Cross-reference UI-SPEC.md if it exists for Section G UI-asset binding.
- All output uses structured tables. Prose is limited to brief notes beneath tables.
```

### 4b. Spawn UI Spec Generator (unless --art-only or --tech-only)

Spawn `.claude/agents/gf-ui-spec-generator.md` via the Task tool with:

```
You are generating a complete UI/UX requirement specification from Stage 2 system designs.

**UI Anchors (from Section 8.3):**
{paste full JSON from production extract-ui-anchors}

**Genre:** {GENRE}
**Language:** {LANGUAGE} -- ALL UI spec content must be in this language (descriptions, interaction notes, flow labels). Page IDs, system IDs, and field names remain in English.

**Template file to read (output format):**
- .claude/skills/gf-production/templates/ui-spec-template.md

**System design files to read:**
{list all .gf/stages/02-system-design/systems/*.md files}

**Data schema reference:**
- .gf/stages/03a-data-schema/tables.md (for data binding references)

**Output file:** .gf/stages/04-production/UI-SPEC.md

**Constraints:**
- NO ghost pages. Every page must trace to a Stage 2 system ID.
- Page IDs use PAGE-{SYSTEM_ID}-NNN format.
- Generate Mermaid navigation flow diagram in Section D.
- Generate component state machine diagrams for interactive components.
- Genre-aware section skipping (e.g., Section G for premium games without ads/IAP).
- All output uses structured tables. Prose is limited to brief notes beneath tables.
```

### 4c. Spawn Tech Spec Generator (unless --art-only or --ui-only)

Spawn `.claude/agents/gf-tech-spec-generator.md` via the Task tool with:

```
You are generating a complete technical requirement specification from Stage 2 system designs.

**7C Contracts (from Section 10):**
{paste full JSON from production extract-7c}

**Genre:** {GENRE}
**Language:** {LANGUAGE} -- ALL tech spec content must be in this language (descriptions, rationale, error messages). Module IDs, system IDs, event names, and field names remain in English.

**Template file to read (output format):**
- .claude/skills/gf-production/templates/tech-spec-template.md

**System design files to read:**
{list all .gf/stages/02-system-design/systems/*.md files}

**Data schema reference:**
- .gf/stages/03a-data-schema/tables.md (for config table references)

**Balance docs reference:**
- .gf/stages/03b-balance/ (for balance layer references in formulas)

**Output file:** .gf/stages/04-production/TECH-SPEC.md

**Constraints:**
- CRITICAL: Extract from Section 10 headers ("## 10"), NOT "## 7C". Section 10 IS the 7C handoff package.
- Build module dependency graph across all systems (Section B).
- Aggregate all state machines, mark cross-system transitions (Section D).
- Build unified event catalog with publisher/subscriber mappings (Section E).
- Collect all formulas with balance layer references (Section F).
- Build unified error code catalog (Section G).
- Build client/server responsibility matrix (Section H).
- Generate Mermaid diagrams for module dependencies and state machines.
- All output uses structured tables. Prose is limited to brief notes beneath tables.
```

### 4d. Post-Generation

After all spawned agents complete:

Update production status to in_progress:
```
!`node bin/gf-tools.cjs state patch production_status in_progress`
```

Display summary of what was generated:
- Which spec files were created
- File sizes / section counts

Display: "Production specifications generated. Review the output, then run `/gf:production` again to validate with the quality gate."

Show progress:
```
!`node bin/gf-tools.cjs progress full`
```

## Step 5: Review and Quality Gate

Display: "Running production quality gate..."

### 5a. Summarize Generated Specs

Read and display a brief summary of what was generated:
- Check which spec files exist in `.gf/stages/04-production/` (ART-SPEC.md, UI-SPEC.md, TECH-SPEC.md)
- Display file sizes and system coverage from frontmatter

### 5b. Ask User to Review

**If `AUTO_MODE`:** Skip review summary display and approval prompt. Proceed directly to Step 5c (quality gate).

**If NOT `AUTO_MODE`:**
Ask user: "Review the production specifications and approve to run the quality gate, or request specific adjustments."
- If user requests adjustments: note the feedback, re-run the relevant generator (Step 4) with the feedback added to the agent prompt
- If user approves (or says "continue", "approve", "ok", "yes"): proceed to Step 5c

### 5c. Spawn Quality Reviewer Agent

Spawn `.claude/agents/gf-production-quality-reviewer.md` via the Task tool:

```
Run the production specification quality gate.

**Production spec files location:** .gf/stages/04-production/
  - ART-SPEC.md (art requirement specification)
  - UI-SPEC.md (UI/UX requirement specification)
  - TECH-SPEC.md (technical requirement specification)

**Quality criteria:** .claude/skills/gf-production/references/production-quality-criteria.md
**Language:** {LANGUAGE} -- REVIEW.md content in this language

**Traceability CLI command:**
node bin/gf-tools.cjs production validate-traceability --ids '[...]'

**Instructions:**
- Read all three spec files from .gf/stages/04-production/
- Read production-quality-criteria.md for the 8 auto-fix + 4 must-ask classification rules
- Run 8 auto-fix checks across all three specs -- fix directly, log all fixes
- Run 4 must-ask checks -- flag for user decision, NEVER auto-fill
- Run cross-spec consistency checks (art-UI asset binding, tech coverage, priority alignment)
- Run traceability validation via production validate-traceability CLI command
- Write REVIEW.md to .gf/stages/04-production/REVIEW.md
{IF AUTO_MODE:}
**AUTO MODE:** For must-ask items, use AI best judgment instead of flagging for user decision. Apply your recommendation directly. Log what you decided in REVIEW.md under a new 'Auto-Resolved Decisions' section.
{END IF}
```

### 5d. After Quality Gate

**If `AUTO_MODE`:**
- Skip presenting REVIEW.md to user. Skip collecting user decisions.
- Proceed directly to Step 6 (mark complete).

**If NOT `AUTO_MODE`:**
Read and display `.gf/stages/04-production/REVIEW.md` contents to the user.

**If REVIEW.md has "Needs User Decision" items:**
- Present each decision to the user and collect their answers.
- Apply their decisions to the relevant spec files.
- Re-run the quality gate to verify all issues are resolved.

**If all checks pass (no user decisions needed):**
- Display: "Production specifications validated. Proceeding to completion."
- Go to **Step 6**.

Show progress:
```
!`node bin/gf-tools.cjs progress full`
```

## Step 6: Mark Complete and Verify

### 6a. Run Traceability Validation

Collect all system IDs referenced across the three spec files. Run traceability validation:
```
!`node bin/gf-tools.cjs production validate-traceability --ids '[...]'`
```

If `valid` is `false`: Display "WARNING: Traceability issues found. Some spec references do not match Stage 2 system IDs. This must be resolved before completion." Display the issues list. **Stop.**

### 6b. Update State

```
!`node bin/gf-tools.cjs production set-status --value complete`
!`node bin/gf-tools.cjs state update production complete`
```

### 6c. Commit Spec Files

```
!`node bin/gf-tools.cjs commit "feat(production): complete Stage 4 production specifications" --files .gf/stages/04-production/`
```

**If `AUTO_MODE`:**
Display: "Production specs complete (auto mode). All stages finished."

**If NOT `AUTO_MODE`:**
Display: "Stage 4 Production Specifications complete. The full 4-stage game design pipeline is now operational."

## Step 7: Display Progress

```
!`node bin/gf-tools.cjs progress full`
```

## Constraints

These rules are locked decisions and must never be violated:

- **Three spec types generated by separate agents:** Art spec (ART-SPEC.md), UI spec (UI-SPEC.md), and tech spec (TECH-SPEC.md) are each produced by a dedicated generator agent, allowing focused context per spec type.
- **Single /gf:production command with flags:** One command for all three specs by default, with `--art-only`, `--ui-only`, `--tech-only` flags for targeted generation. This supports session granularity for large games (9+ systems).
- **Three output files in .gf/stages/04-production/:** ART-SPEC.md, UI-SPEC.md, TECH-SPEC.md. Each spec file is self-contained with its own frontmatter and system coverage list.
- **Automated generation, no per-spec questioning:** Generator agents read system designs and produce complete specs in a single pass. No per-asset or per-page questioning -- anchors and contracts provide sufficient input.
- **No ghost assets/pages/modules:** Every spec item must trace to a Stage 2 system ID. Items without upstream traceability are rejected by the quality gate. The traceability CLI command validates this programmatically.
- **Quality gate: 8 auto-fix + 4 must-ask:** Per production-quality-criteria.md. Cross-spec consistency checks verify priority alignment, art-UI binding, and tech coverage across all three specs.
- **State-driven 3-way branching:** Orchestrator uses production status to determine flow: generate (not_started), review (in_progress), complete (complete). Each invocation picks up where the previous left off.
- **Section 10 is the 7C handoff:** Tech spec extracts from Section 10 headers ("## 10"), NOT "## 7C". This is a locked decision from Phase 3 system design.
- **Sequential agent spawning:** Agents are spawned one after another (not in parallel) to allow later agents to cross-reference earlier specs (e.g., UI spec can reference ART-SPEC.md if it exists).
- **Auto mode:** When `--auto` flag is present, all user interaction is skipped. `--art-only`, `--ui-only`, `--tech-only` flags are ignored (always generates all three specs). Session split suggestions are bypassed (always single pass). Review approval prompt is skipped. Quality gate must-ask items are resolved by AI judgment. The structural quality (traceability, cross-spec consistency, section completeness) is identical to interactive mode.
