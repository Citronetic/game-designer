---
name: gf-balance
description: "Stage 3B: Fill your data tables with balanced values"
disable-model-invocation: true
allowed-tools: [Read, Write, Bash, Task]
---

# /gf:balance -- Stage 3B: Numerical Balance

Generate balanced numerical values from your system designs' 7B inputs and the frozen data schema. The balance generator reads all 7B inputs, produces 4 balance documentation files (difficulty, economy, monetization, tuning), updates CSV config files with balanced values, then runs a quality gate to validate everything before completion.

## Step 1: Load Project State and Check Prerequisites

Run:
```
!`node bin/gf-tools.cjs init progress`
```

- If `project_exists` is `false`: Display "No Game Forge project found. Run `/gf:new-game` to start." **Stop.**

**Auto-mode detection:** Check `$ARGUMENTS` for `--auto` flag. Store as `AUTO_MODE` (true/false). When `AUTO_MODE` is true, all user interaction is skipped and the entire balance stage runs in a single autonomous pass.

- Check `stages.data_schema` -- if not `complete` **and NOT `AUTO_MODE`**: Display "Stage 3B requires data schema to be complete (frozen). Run `/gf:data-schema` first." **Stop.**
  - **If `AUTO_MODE`:** Skip prerequisite check (the auto pipeline just completed data schema stage).

Check freeze status:
```
!`node bin/gf-tools.cjs data-schema freeze-status`
```

- If `frozen` is `false` **and NOT `AUTO_MODE`**: Display "Stage 3B requires a frozen schema. Run `/gf:data-schema` and freeze your schema first." **Stop.**
  - **If `AUTO_MODE`:** Skip freeze check (the auto pipeline just froze the schema).

Load configuration:
```
!`node bin/gf-tools.cjs config-get language`
!`node bin/gf-tools.cjs config-get genre`
```

Store as `LANGUAGE` and `GENRE`.

## Step 1.5: Determine Session Granularity

**If `AUTO_MODE`:** Skip session granularity calculation and split prompt entirely. Auto mode always uses a single pass regardless of system count. Proceed directly to Step 2.

Run:
```
!`node bin/gf-tools.cjs system-design system-status`
```

Count confirmed systems from the response.

Adjust generation strategy:
- 3-8 systems: Single pass (current default) -- generate all balance docs at once
- 9+ systems: Consider splitting. Display to user:
  "Your game has {N} systems with 7B inputs. For best quality, consider generating balance
   in focused passes. Or continue with single pass for all systems."
  Wait for user preference.

## Step 2: Detect State and Branch

Run:
```
!`node bin/gf-tools.cjs balance status`
```

**If `AUTO_MODE`:** Always take the Generate path (not_started -> Step 3), then automatically continue through Review (Step 5) and Complete (Step 6) without stopping. The entire generate-review-complete pipeline runs in one pass.

Branch based on the returned `status` value:

- **`not_started`** -> Go to **Step 3** (Generate path)
- **`in_progress`** -> Go to **Step 5** (Review path)
- **`complete`** -> Display completion message: "Stage 3B Numerical Balance is complete. Quality gate has passed. To re-run the quality gate, reply 'review'. To start fresh, reply 'regenerate'." Wait for user input.
  - If user says "review" -> Go to **Step 5**
  - If user says "regenerate" -> Go to **Step 3**
  - Otherwise -> Display progress and **Stop.**

## Step 3: Extract 7B Inputs and Gather Context

### 3a. Extract 7B Inputs

Run:
```
!`node bin/gf-tools.cjs balance extract-7b`
```

Parse the JSON response. Display summary:
"Found **{N} systems** with 7B balance inputs."

List each system briefly: system ID, system name.

### 3b. Read Frozen Schema

Read the frozen schema files for context:
- `.gf/stages/03a-data-schema/tables.md` -- table structures and current sample data
- `.gf/stages/03a-data-schema/relationships.md` -- table relationships

### 3c. Read Genre for Target Ranges

The `GENRE` value determines which column in the genre-specific target ranges (lifecycle-phases.md) the balance generator uses:
- Casual, Puzzle, Match-3 -> Casual / Puzzle column
- Action, Idle, Clicker, Arcade -> Action / Idle column
- RPG, Strategy, Simulation, Roguelike -> RPG / Strategy column

## Step 4: Spawn Balance Generator Agent

Spawn `.claude/agents/gf-balance-generator.md` via the Task tool with:

```
You are generating complete numerical balance documentation and updating CSV config files with balanced values.

**7B Balance Inputs:**
{paste full JSON from balance extract-7b}

**Genre:** {GENRE} -- use the appropriate genre column from lifecycle-phases.md for target ranges
**Language:** {LANGUAGE} -- ALL balance content must be in this language (descriptions, rationales, risk assessments). Parameter names, field names, system IDs, and enum keys remain in English.

**Frozen schema files to read:**
- .gf/stages/03a-data-schema/tables.md (table structures, field definitions, current sample data)
- .gf/stages/03a-data-schema/relationships.md (table relationships)

**System design files to read for 7B cross-reference:**
{list all .gf/stages/02-system-design/systems/*.md files}

**Reference files to read:**
- .claude/skills/gf-balance/references/lifecycle-phases.md (lifecycle phase definitions with genre-specific targets)

**Template files to read (output format specifications):**
- .claude/skills/gf-balance/templates/difficulty-template.md
- .claude/skills/gf-balance/templates/economy-template.md
- .claude/skills/gf-balance/templates/monetization-template.md
- .claude/skills/gf-balance/templates/tuning-template.md

**Output directory:** .gf/stages/03b-balance/
**CSV update location:** .gf/stages/03a-data-schema/configs/

**CLI commands available:**
- node bin/gf-tools.cjs balance update-csv --table "TABLE_NAME" --data '[...]'  (update CSV data rows)
- node bin/gf-tools.cjs balance validate-economy --flows '{...}'  (validate economy flows)
- node bin/gf-tools.cjs balance validate-freeze  (verify schema integrity after updates)

**Output files to produce:**
1. difficulty.md -- numerical target matrix + per-segment difficulty tables with inline adjustment strategies
2. economy.md -- resource flow tables + cross-resource dependencies + prohibited drought points
3. monetization.md -- protected parameters list + experience protection rules + commercialization boundary summary
4. tuning.md -- tuning priority table + validation thresholds + rollback strategy + self-check conclusions

**Constraints:**
- You may ONLY modify: sample data row values, default value fields, validation range fields.
- You may NOT add/remove/rename tables, fields, types, PKs, or FKs.
- Every balanced value MUST trace to a 7B input category. Values without upstream justification will be rejected by the quality gate.
- All output uses structured tables, not narratives.
- 7B Category 8 (no-go zones) defines problems that must NOT be solved by tuning numbers -- do not generate values for these.
- After updating CSV files, run: node bin/gf-tools.cjs balance validate-freeze
```

### 4a. Post-Generation

After the agent completes:

Update balance status to in_progress:
```
!`node bin/gf-tools.cjs state patch balance_status in_progress`
```

Display: "Balance documentation generated with **4 balance files** and CSV value updates. Review the output, then run `/gf:balance` again to validate with the quality gate."

Show progress:
```
!`node bin/gf-tools.cjs progress full`
```

## Step 5: Review and Quality Gate

Display: "Running balance quality gate..."

### 5a. Summarize Generated Balance Files

Read and display a brief summary of what was generated:
- Count balance files in `.gf/stages/03b-balance/` (difficulty.md, economy.md, monetization.md, tuning.md)
- List which files exist and their status from frontmatter

**If `AUTO_MODE`:** Skip the "review and approve" prompt. Proceed directly to Step 5b (extract 7B inputs for quality gate).

**If NOT `AUTO_MODE`:**
Ask user: "Review the balance documentation and approve to run the quality gate, or request specific adjustments."
- If user requests adjustments: note the feedback, re-run the generator (Step 4) with the feedback added to the agent prompt
- If user approves (or says "continue", "approve", "ok", "yes"): proceed to Step 5b

### 5b. Extract 7B Inputs for Traceability

```
!`node bin/gf-tools.cjs balance extract-7b`
```

### 5c. Spawn Quality Reviewer Agent

Spawn `.claude/agents/gf-balance-quality-reviewer.md` via the Task tool:

```
Run the balance quality gate.

**Balance files location:** .gf/stages/03b-balance/
  - difficulty.md (numerical target matrix + per-segment difficulty)
  - economy.md (resource flow tables + cross-resource dependencies)
  - monetization.md (protected parameters + experience protection rules)
  - tuning.md (tuning priority table + validation thresholds + rollback + self-check)

**Quality criteria:** .claude/skills/gf-balance/references/balance-quality-criteria.md
**Language:** {LANGUAGE} -- REVIEW.md content in this language

**7B Balance Inputs (for traceability check):**
{paste full JSON from balance extract-7b}

**CLI commands available:**
- node bin/gf-tools.cjs balance validate-economy --flows '{...}'  (validate economy sustainability)
- node bin/gf-tools.cjs balance validate-freeze  (verify schema integrity)

**Instructions:**
- Read all 4 balance files from .gf/stages/03b-balance/
- Read balance-quality-criteria.md for the 8 auto-fix + 4 must-ask classification rules
- Run 8 auto-fix checks (structural): fix issues directly, log all fixes
- Run 4 must-ask checks (creative): flag for user decision, NEVER auto-fill
- Run economy validation via balance validate-economy CLI command
- Run freeze integrity via balance validate-freeze CLI command
- Run self-check validation from tuning.md Section 4
- Write REVIEW.md to .gf/stages/03b-balance/REVIEW.md
- After auto-fixes: run balance validate-freeze to confirm schema integrity
{IF AUTO_MODE:}
**AUTO MODE:** For must-ask items, use AI best judgment instead of flagging for user decision. Apply your recommendation directly. Log what you decided in REVIEW.md under a new 'Auto-Resolved Decisions' section.
{END IF}
```

### 5d. After Quality Gate

**If `AUTO_MODE`:**
- Skip presenting REVIEW.md to user. Skip collecting user decisions.
- Proceed directly to Step 6 (mark complete).

**If NOT `AUTO_MODE`:**
Read and display `.gf/stages/03b-balance/REVIEW.md` contents to the user.

**If REVIEW.md has "Needs User Decision" items:**
- Present each decision to the user and collect their answers.
- Apply their decisions to the relevant balance files.
- Re-run the quality gate to verify all issues are resolved.

**If all checks pass (no user decisions needed):**
- Display: "Balance validated. Proceeding to completion."
- Go to **Step 6**.

Show progress:
```
!`node bin/gf-tools.cjs progress full`
```

## Step 6: Mark Complete and Verify

### 6a. Verify Freeze Integrity

Run freeze integrity check:
```
!`node bin/gf-tools.cjs balance validate-freeze`
```

If `intact` is `false`: Display "WARNING: Schema structure has been modified during balance work. This must be resolved before completion." **Stop.**

### 6b. Update State

```
!`node bin/gf-tools.cjs state patch balance_status complete`
!`node bin/gf-tools.cjs state update balance complete`
```

### 6c. Commit Balance Files

```
!`node bin/gf-tools.cjs commit "feat(balance): complete Stage 3B numerical balance" --files .gf/stages/03b-balance/ .gf/stages/03a-data-schema/configs/`
```

**If `AUTO_MODE`:**
Display: "Balance stage complete (auto mode). Proceeding to next stage..."

**If NOT `AUTO_MODE`:**
Display: "Stage 3B Numerical Balance complete. Run `/gf:production` for Stage 4."

## Step 7: Display Progress

```
!`node bin/gf-tools.cjs progress full`
```

## Constraints

These rules are locked decisions and must never be violated:

- **Automated generation from 7B inputs:** The balance generator reads all 7B inputs at once and produces the complete balance documentation. No per-category questioning -- 7B inputs provide sufficient input for automated generation.
- **4 output files by concern:** difficulty.md (numerical target matrix + per-segment tables), economy.md (resource flow tables + cross-resource dependencies), monetization.md (protected parameters + experience protection), tuning.md (tuning priority + validation thresholds + rollback + self-check).
- **Frozen schema boundary:** You may ONLY modify: sample data row values, default value fields, validation range fields. You may NOT add/remove/rename tables, fields, types, PKs, or FKs. This is the #1 constraint from the source specification.
- **Tables over narratives:** All balance output uses structured tables. Prose is limited to brief notes beneath tables.
- **No ghost values:** Every balanced value must trace to a 7B input category from a Stage 2 system. Values without upstream justification are rejected by the quality gate.
- **CSV updates via CLI:** CSV config files are updated via `node bin/gf-tools.cjs balance update-csv`, which preserves BOM, field names, and field types rows. Never manually edit CSV files.
- **Quality gate before completion:** The quality reviewer must validate all balance files before completion. 8 auto-fix categories (structural) + 4 must-ask categories (creative decisions) per balance-quality-criteria.md.
- **7B Category 8 exclusion:** No-go zones from 7B Category 8 define problems that must NOT be solved by tuning numbers. The balance generator skips these entirely.
- **State-driven 3-way branching:** Orchestrator uses balance status to determine flow: generate (not_started), review (in_progress), complete (complete). Each invocation picks up where the previous left off.
- **Freeze verification at completion:** Before marking balance complete, verify freeze integrity via `node bin/gf-tools.cjs balance validate-freeze`. If schema structure was modified, completion is blocked.
- **Auto mode:** When `--auto` flag is present, all user interaction is skipped. Session split prompts are bypassed (always single pass). Review approval prompt is skipped. Quality gate must-ask items are resolved by AI judgment. The structural quality (traceability, freeze integrity, economy validation) is identical to interactive mode.
