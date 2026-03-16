---
name: gf-new-game
description: Create a new Game Forge project with guided setup
argument-hint: "[--auto] [--fps N]"
disable-model-invocation: true
allowed-tools: [Read, Bash, Write, Agent, AskUserQuestion]
---

# /gf:new-game -- Create a New Game Forge Project

## Overview

Guide the user through creating a new Game Forge project. Collects game concept information, scaffolds the `.gf/` directory, and prepares the project for the concept stage.

## Process

### Step 1: Check Environment

Run:
```
!`node bin/gf-tools.cjs init new-game`
```

Parse the JSON result for `project_exists` and `has_git`.

- If `project_exists` is `true`: Inform the user that a Game Forge project already exists in this directory. Suggest running `/gf:progress` to see current status or `/gf:resume` to continue where they left off. **Stop here.**

### Step 2: Determine Mode

Check `$ARGUMENTS` for the `--auto` flag.

**If `--auto` is present (automatic mode):**
- Parse the remaining arguments for input material. The input can be:
  a. **Inline text** -- a game description pasted directly
  b. **Reference file** -- a path to a .md or .txt file (preceded by @)
  c. **Video file** -- a path to a .mp4, .mov, .avi, .webm, or .mkv file

- **Detect input type:** Check if the input path ends with a video extension (.mp4, .mov, .avi, .webm, .mkv).

- **If VIDEO input detected:** Go to **Step 2A: Video Analysis**.
- **If TEXT or FILE input:** Continue with existing text/file behavior:
  - Read and analyze the provided material.
  - Extract: project name, genre, language, platform, monetization model.
  - Use smart defaults for any missing values:
    - Language: detect from the user's writing language, or default to the language the concept document is written in
    - Genre: infer from content
    - Platform: default to "mobile" if unclear
    - Monetization: default to "free-to-play" if unclear
  - Skip to **Step 4** with extracted values.

- Store the parsed reference material content (from text, file, or VIDEO-ANALYSIS.md) as `REFERENCE_CONTENT` for use in the auto pipeline chain (Step 9).

- Also check `$ARGUMENTS` for the `--fps` flag. If present, store the value for use in Step 2A. Default: 0.5 (1 frame every 2 seconds).

**If `--auto` is NOT present (interactive mode):**
- Continue to **Step 3**.

### Step 2A: Video Analysis

When a video file is detected as input:

1. **Check ffmpeg availability:**
   ```
   !`node bin/gf-tools.cjs video check-ffmpeg`
   ```
   If `available` is false, inform the user:
   > ffmpeg is required for video analysis but was not found on your system.
   > Install it with: `brew install ffmpeg` (macOS) or `apt install ffmpeg` (Linux)
   **Stop here.**

2. **Probe video metadata:**
   ```
   !`node bin/gf-tools.cjs video probe --file {video_path}`
   ```
   Store the result (duration, fps, width, height, codec).

3. **Plan frame extraction:**
   ```
   !`node bin/gf-tools.cjs video plan --duration {duration} --fps {user_fps_or_0.5} --max-frames 40`
   ```
   If user provided `--fps` flag, pass that value through. Otherwise use the default 0.5.

4. **Extract frames:**
   ```
   !`node bin/gf-tools.cjs video extract --file {video_path} --fps {extractFps}`
   ```
   Store the outputDir and files list from the result.

5. **Delegate to video analyzer agent:**
   Spawn the `gf-video-analyzer` agent with these parameters:
   - frameDir: the outputDir from step 4
   - sampleIndices: from step 3's plan result
   - videoMeta: {duration, fps, width, height, codec, filename: basename of video_path}
   - outputPath: `.gf/VIDEO-ANALYSIS.md` (use the project .gf/ directory)
   - templatePath: `.claude/skills/gf-new-game/references/video-analysis-template.md`

   Wait for the agent to complete.

6. **Cleanup frames:**
   ```
   !`node bin/gf-tools.cjs video cleanup --dir {outputDir}`
   ```

7. **Read analysis result:**
   Read `.gf/VIDEO-ANALYSIS.md` and use its content as the reference material for project setup.
   Extract: project name (from Game Overview), genre, language (default to English unless video content suggests otherwise), platform, monetization.
   Use smart defaults for any values not inferable from the video analysis:
   - Language: default to English
   - Genre: infer from the Game Overview and Core Gameplay Mechanics sections
   - Platform: default to "mobile" if unclear
   - Monetization: default to "free-to-play" if unclear

8. **Continue to Step 4** with extracted values (same as text/file --auto path).

### Step 3: Collect Project Configuration

Ask the user these questions in a natural conversational flow. Present them together, not one at a time with AskUserQuestion:

> Let's set up your Game Forge project! I need a few details:
>
> 1. **Project name** -- What would you like to call your game?
> 2. **Language** -- What language should all design documents be written in? (I'll default to the language you're writing in)
> 3. **Genre and details:**
>    - Genre: casual, RPG, puzzle, strategy, idle, simulation, or describe your own
>    - Monetization: free-to-play, premium, or ad-supported?
>    - Platform: mobile, PC, console, or web?
> 4. **Entry path** -- Are you starting:
>    - **From scratch** -- you have an original game idea to develop
>    - **From reference** -- you want to design based on an existing game, ad, or competitor

Wait for the user's response. Parse their answers -- they may answer all at once or partially. Follow up on any missing information naturally.

Default language to the language the user is writing in if they don't specify explicitly.

### Step 4: Git Tracking

**If AUTO_MODE:** Skip the git tracking question. Default to `true` (yes). Proceed to Step 5.

**If interactive mode:**

Ask the user:

> Should I track the `.gf/` directory in git? This is recommended for version history and collaboration. (yes/no, default: yes)

If the user doesn't explicitly say no, default to yes.

### Step 5: Scaffold Project

Run the scaffold command with collected values:

```
!`node bin/gf-tools.cjs scaffold project --name "{name}" --language "{language}" --genre "{genre}" --platform "{platform}" --monetization "{monetization}" --entry-path "{entry_path}" --git-tracking "{git_tracking}" --dir .`
```

Replace placeholders with the actual values from Steps 2-4. The `entry_path` value should be either `scratch` or `reference`.

### Step 6: Post-Scaffold Setup

**If git_tracking is false:**
- Add `.gf/` to the project's `.gitignore` file (create the file if it doesn't exist, or append to it).

**If git_tracking is true AND has_git is true:**
- Stage and commit the initial `.gf/` files using Bash tool:
  ```bash
  git add .gf/ && git commit -m "feat: initialize Game Forge project"
  ```

### Step 7: Entry Path Follow-up

**If AUTO_MODE:** Skip the entry path follow-up. The reference material was already processed in Step 2. Proceed to Step 8.

**If interactive mode:**

**If entry_path is "reference":**
- Ask the user to describe the reference game, ad, or competitor they want to base their design on.
- Save their description into the "Reference Material" section of `.gf/PROJECT.md`.

**If entry_path is "scratch":**
- No additional follow-up needed.

### Step 8: Present Success

**If AUTO_MODE:**

Display a brief status:

> Project **'{name}'** scaffolded. Starting auto pipeline...

Proceed to **Step 9**.

**If interactive mode:**

Display a success message:

> Project **'{name}'** created! Your Game Forge workspace is ready at `.gf/`.
>
> **Next step:** Run `/gf:concept` to begin designing your game.
>
> Here's what was set up:
> - `.gf/config.json` -- Project configuration
> - `.gf/STATE.md` -- Progress tracking
> - `.gf/PROJECT.md` -- Game design document
> - `.gf/stages/` -- Stage output directories
> - `.gf/traceability/` -- ID registry for cross-reference tracking

**Stop here** (interactive mode does not continue to Step 9).

### Step 9: Auto Pipeline Chain

**Only executes when `--auto` flag is present.** Runs all 5 stages sequentially without user interaction.

Display: "Starting auto pipeline: concept -> systems -> schema -> balance -> production..."

#### Stage 1: Auto Concept Generation

1. Load genre profile:
   Read `.claude/skills/gf-concept/references/genre-{GENRE}.md`
   Determine included chapters (those not marked SKIP).

2. Update state:
   ```
   !`node bin/gf-tools.cjs state update "Concept" "in_progress"`
   ```

3. Spawn concept interviewer agent via Agent tool:
   Agent: `.claude/agents/gf-concept-interviewer.md`
   Prompt includes:
   - ALL genre-included chapters (single batch, no session splitting)
   - Genre profile emphasis and section variants
   - Language and depth multiplier
   - Reference material: `REFERENCE_CONTENT` (from Step 2)
   - AUTO MODE instructions: no AskUserQuestion, no questioning rounds, generate all chapters autonomously, use best judgment for must-ask topics (gameplay, monetization, audience, scope) based on reference material and genre conventions

4. After agent completes, spawn quality reviewer:
   Agent: `.claude/agents/gf-quality-reviewer.md`
   Prompt includes:
   - Chapter files location
   - Genre profile and quality criteria paths
   - AUTO MODE: auto-resolve must-ask items with AI judgment, log decisions in REVIEW.md

5. Mark complete:
   ```
   !`node bin/gf-tools.cjs state update "Concept" "complete"`
   ```

Display: "[1/5] Concept stage complete."

#### Stage 2: Auto System Design

1. Read concept chapters for context:
   Read summaries from `.gf/stages/01-concept/ch*.md` frontmatter.

2. Propose and auto-confirm system list:
   ```
   !`node bin/gf-tools.cjs system-design propose-systems`
   ```
   Parse response. Build system list proposal based on concept content, genre, and rule IDs (same logic as interactive SKILL.md Step 3).
   ```
   !`node bin/gf-tools.cjs system-design confirm-systems --data '{...}'`
   !`node bin/gf-tools.cjs state update "System Design" "in_progress"`
   ```

3. Spawn system designer agent via Agent tool:
   Agent: `.claude/agents/gf-system-designer.md`
   Prompt includes:
   - ALL confirmed systems (single batch)
   - Concept chapter file paths for reference
   - Genre and language
   - AUTO MODE instructions: no AskUserQuestion, design all systems autonomously, use best judgment for must-ask topics

4. Run traceability check:
   ```
   !`node bin/gf-tools.cjs system-design trace-check`
   ```

5. Spawn quality reviewer:
   Agent: `.claude/agents/gf-system-quality-reviewer.md`
   Prompt includes:
   - System files location, quality criteria, cross-system checks
   - AUTO MODE: auto-resolve must-ask items

6. Generate content rhythm:
   Read all system Section 7 Day1-Day7 data.
   Read `.claude/skills/gf-system-design/templates/content-rhythm-template.md`
   Write `.gf/stages/02-system-design/CONTENT-RHYTHM.md`

7. Mark complete:
   ```
   !`node bin/gf-tools.cjs state update "System Design" "complete"`
   ```

Display: "[2/5] System design stage complete."

#### Stage 3A: Auto Data Schema

1. Extract 7A anchors:
   ```
   !`node bin/gf-tools.cjs data-schema extract-anchors`
   !`node bin/gf-tools.cjs state update data_schema in_progress`
   ```

2. Spawn schema generator agent:
   Agent: `.claude/agents/gf-schema-generator.md`
   Prompt includes:
   - 7A anchor data
   - Language, system file paths
   - Template and reference file paths
   - AUTO MODE: generate complete schema in single pass

3. Export CSV:
   ```
   !`node bin/gf-tools.cjs data-schema export-csv`
   ```

4. Run validation and spawn quality reviewer:
   ```
   !`node bin/gf-tools.cjs data-schema validate`
   ```
   Agent: `.claude/agents/gf-schema-quality-reviewer.md`
   Prompt includes:
   - Schema files, quality criteria, anchor data, validation results
   - AUTO MODE: auto-resolve must-ask items

5. Re-export CSV after auto-fixes:
   ```
   !`node bin/gf-tools.cjs data-schema export-csv`
   ```

6. Auto-freeze:
   ```
   !`node bin/gf-tools.cjs data-schema freeze`
   !`node bin/gf-tools.cjs state update data_schema complete`
   ```

Display: "[3/5] Data schema frozen."

#### Stage 3B: Auto Balance

1. Extract 7B inputs:
   ```
   !`node bin/gf-tools.cjs balance extract-7b`
   ```

2. Spawn balance generator agent:
   Agent: `.claude/agents/gf-balance-generator.md`
   Prompt includes:
   - 7B balance inputs, genre, language
   - Frozen schema file paths, system design file paths
   - Lifecycle phases reference path, template paths
   - AUTO MODE: generate all balance docs and update CSV in single pass

3. Spawn quality reviewer:
   ```
   !`node bin/gf-tools.cjs balance extract-7b`
   ```
   (Re-extract for traceability)
   Agent: `.claude/agents/gf-balance-quality-reviewer.md`
   Prompt includes:
   - Balance files, quality criteria, 7B inputs
   - AUTO MODE: auto-resolve must-ask items

4. Verify freeze integrity:
   ```
   !`node bin/gf-tools.cjs balance validate-freeze`
   ```

5. Mark complete:
   ```
   !`node bin/gf-tools.cjs state patch balance_status complete`
   !`node bin/gf-tools.cjs state update balance complete`
   ```

Display: "[4/5] Balance stage complete."

#### Stage 4: Auto Production Specs

1. Extract anchors and contracts:
   ```
   !`node bin/gf-tools.cjs production extract-art-anchors`
   !`node bin/gf-tools.cjs production extract-ui-anchors`
   !`node bin/gf-tools.cjs production extract-7c`
   ```

2. Spawn art spec generator:
   Agent: `.claude/agents/gf-art-spec-generator.md`
   Prompt: art anchors, genre, language, system file paths, template path
   AUTO MODE: generate complete art spec

3. Spawn UI spec generator:
   Agent: `.claude/agents/gf-ui-spec-generator.md`
   Prompt: UI anchors, genre, language, system file paths, template path
   AUTO MODE: generate complete UI spec

4. Spawn tech spec generator:
   Agent: `.claude/agents/gf-tech-spec-generator.md`
   Prompt: 7C contracts, genre, language, system file paths, template path
   AUTO MODE: generate complete tech spec

   Note: Spawn sequentially (art -> UI -> tech) so later agents can cross-reference earlier specs.

5. Spawn quality reviewer:
   Agent: `.claude/agents/gf-production-quality-reviewer.md`
   Prompt: production spec files, quality criteria
   AUTO MODE: auto-resolve must-ask items

6. Validate traceability:
   ```
   !`node bin/gf-tools.cjs production validate-traceability --ids '[...]'`
   ```

7. Mark complete:
   ```
   !`node bin/gf-tools.cjs production set-status --value complete`
   !`node bin/gf-tools.cjs state update production complete`
   ```

Display: "[5/5] Production specs complete."

### Step 10: Auto Pipeline Summary

Build a dynamic, data-driven summary by scanning the actual generated files and extracting autonomous decisions.

#### 10a: Scan generated files per stage

Count the actual files generated in each stage using Bash commands:

```
!`ls .gf/stages/01-concept/ch*.md 2>/dev/null | wc -l`
```
Store the result as `concept_count`.

```
!`ls .gf/stages/02-system-design/systems/*.md 2>/dev/null | wc -l`
```
Store the result as `system_count`. Note: this may include CONTENT-RHYTHM.md if it is inside systems/. If CONTENT-RHYTHM.md is inside systems/, subtract 1 from the count.

Check for content rhythm:
```
!`[ -f .gf/stages/02-system-design/CONTENT-RHYTHM.md ] && echo "yes" || echo "no"`
```
Store as `has_content_rhythm`.

```
!`ls .gf/stages/03a-data-schema/*.md 2>/dev/null | wc -l`
```
Store as `schema_count`.

```
!`ls .gf/stages/03a-data-schema/configs/*.csv 2>/dev/null | wc -l`
```
Store as `csv_count`.

```
!`ls .gf/stages/03b-balance/*.md 2>/dev/null | wc -l`
```
Store as `balance_count`.

Check production specs:
```
!`[ -f .gf/stages/04-production/ART-SPEC.md ] && echo "yes" || echo "no"`
!`[ -f .gf/stages/04-production/UI-SPEC.md ] && echo "yes" || echo "no"`
!`[ -f .gf/stages/04-production/TECH-SPEC.md ] && echo "yes" || echo "no"`
```
Count how many of these 3 exist. Store as `production_count`.

Check for video analysis:
```
!`[ -f .gf/VIDEO-ANALYSIS.md ] && echo "yes" || echo "no"`
```
Store as `has_video_analysis`.

#### 10b: Compute total document count

Sum all counts: `concept_count + system_count + (1 if has_content_rhythm) + schema_count + csv_count + balance_count + production_count + (1 if has_video_analysis)`. Store as `total_count`.

#### 10c: Read project config

Read `.gf/config.json` and extract: `name`, `genre`, `language`, `platform`, `monetization`, `entry_path`. These are the decisions the AI made autonomously during initial setup (Step 2).

#### 10d: Extract autonomous decisions from REVIEW.md files

For each of these stage directories, check if a REVIEW.md file exists and read it if so:
- `.gf/stages/01-concept/REVIEW.md`
- `.gf/stages/02-system-design/REVIEW.md`
- `.gf/stages/03a-data-schema/REVIEW.md`
- `.gf/stages/03b-balance/REVIEW.md`
- `.gf/stages/04-production/REVIEW.md`

For each REVIEW.md that exists, look for the "Auto-Resolved Decisions" section and extract its contents. Collect all decisions grouped by stage name.

#### 10e: Display the summary

Display the following, substituting actual values:

> **Auto pipeline complete!**
>
> **Project:** {name} ({genre}, {platform}, {monetization})
> **Language:** {language}
> **Total documents:** {total_count}
>
> **Generated files by stage:**
> | Stage | Files | Details |
> |-------|-------|---------|
> | Concept | {concept_count} chapters | .gf/stages/01-concept/ |
> | System Design | {system_count} systems + content rhythm | .gf/stages/02-system-design/ |
> | Data Schema | {schema_count} schema files + {csv_count} CSV configs | .gf/stages/03a-data-schema/ |
> | Balance | {balance_count} docs | .gf/stages/03b-balance/ |
> | Production | {production_count} specs (art, UI, tech) | .gf/stages/04-production/ |
>
> **Autonomous decisions:**
> {For each stage that had Auto-Resolved Decisions in its REVIEW.md, display them as bullet points grouped by stage. Example:}
> *Concept:*
> - {decision 1}
> - {decision 2}
> *System Design:*
> - {decision 1}
> {If no REVIEW.md files had Auto-Resolved Decisions, display: "No auto-resolved decisions logged."}
>
> **Setup decisions (from config.json):**
> - Genre: {genre}
> - Language: {language}
> - Platform: {platform}
> - Monetization: {monetization}
> - Entry path: {entry_path}
>
> **Review or adjust any stage interactively:**
> - `/gf:concept` -- revisit concept (re-run quality gate, regenerate chapters)
> - `/gf:system-design` -- revisit systems (re-run quality gate, add/redesign systems)
> - `/gf:data-schema` -- revisit schema (unfreeze first with `node bin/gf-tools.cjs data-schema unfreeze`)
> - `/gf:balance` -- revisit balance values (schema must be unfrozen first if re-running data-schema)
> - `/gf:production` -- revisit production specs

#### 10f: Show progress and commit

Run: `node bin/gf-tools.cjs progress full` to display the progress visualization.

If git tracking is enabled (check `.gf/config.json` field `git_tracking`), add a final git commit of all auto-generated files using Bash tool:
```bash
git add .gf/ && git commit -m "feat: auto-generate complete game design documents"
```

## Error Handling

- If `scaffold project` fails, show the error output and suggest checking write permissions.
- If git commit fails, warn but don't block -- the project is still usable without git tracking.
- If the user provides invalid or ambiguous answers, ask for clarification naturally.

## Notes

- All design documents will be written in the user's chosen language.
- The genre hint influences later stages but doesn't lock the project into a rigid structure.
- The `--auto` flag is useful for quickly bootstrapping from existing game concept documents.
- Video input supported: .mp4, .mov, .avi, .webm, .mkv files are analyzed using ffmpeg + Claude vision
- Video analysis requires ffmpeg to be installed on the system (brew install ffmpeg)
- The `--fps` flag controls frame extraction density (default: 1 frame every 2 seconds = 0.5 fps)
- Video analysis produces .gf/VIDEO-ANALYSIS.md which serves as the reference material for concept generation
- Auto pipeline runs all 5 stages sequentially: concept -> systems -> schema -> balance -> production
- Each stage spawns generator and quality reviewer agents
- Quality gates auto-approve in auto mode but still validate structural quality
- All output is written to the same .gf/ directory structure as interactive mode
- After auto pipeline, user can re-run any stage interactively to make adjustments
- Step 10 summary is dynamic -- it scans .gf/ to show actual file counts and reads REVIEW.md files for autonomous decision log
- After auto pipeline, all stages are marked 'complete' in STATE.md. Running a stage command interactively (e.g., `/gf:concept`) will detect the complete state and jump to the quality gate for review. The user can then decide to accept, fix issues, or regenerate specific chapters/systems.
- To re-run data-schema or balance interactively after auto mode, the schema freeze must be lifted first: `node bin/gf-tools.cjs data-schema unfreeze`. This is mentioned in the Step 10 summary.
- Re-running a stage interactively overwrites only that stage's output files. Downstream stages (if already generated) are not automatically re-run -- the user should re-run downstream stages manually if upstream changes affect them.
