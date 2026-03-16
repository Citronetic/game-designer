---
name: gf-concept
description: "Stage 1: Co-create your game concept document chapter by chapter"
disable-model-invocation: true
allowed-tools: [Read, Bash, Task]
---

# /gf:concept -- Stage 1: Concept Design

Co-create a complete game concept document through chapter-by-chapter guided questioning. Each session covers 2-3 chapters. The concept interviewer agent asks targeted questions, proposes ideas with rationale, then generates each chapter as a separate file.

## Step 1: Load Project State

Run:
```
!`node bin/gf-tools.cjs init progress`
```

- If `project_exists` is `false`: Display "No Game Forge project found. Run `/gf:new-game` to start." **Stop.**

Load configuration:
```
!`node bin/gf-tools.cjs config-get genre`
!`node bin/gf-tools.cjs config-get language`
!`node bin/gf-tools.cjs config-get entry_path`
```

Store these as `GENRE`, `LANGUAGE`, and `ENTRY_PATH`.

**Auto-mode detection:** Check `$ARGUMENTS` for `--auto` flag. Store as `AUTO_MODE` (true/false). When `AUTO_MODE` is true, all user interaction is skipped and the entire concept stage runs in a single autonomous pass.

Load chapter status:
```
!`node bin/gf-tools.cjs concept chapter-status`
```

This returns per-chapter completion status (pending, in_progress, complete, skipped).

## Step 1.5: Determine Session Granularity

**If `AUTO_MODE`:** Skip session granularity calculation entirely. Auto mode processes ALL genre-included chapters in a single agent spawn. Proceed directly to Step 2.

Check planned system complexity from genre:
- Read genre profile from .claude/skills/gf-concept/references/ to estimate expected systems
- Casual/Puzzle genres (depth 1.0): expect 3-5 systems -> 3 chapters per session
- Action/Idle genres (depth 1.2): expect 5-7 systems -> 2-3 chapters per session
- RPG/Strategy genres (depth 1.5): expect 8-12 systems -> 2 chapters per session

Adjust the chapters-per-session batch size used in the concept interview flow.
Note: At concept stage, exact system count is unknown. Use genre depth as proxy.

## Step 2: Load Genre Profile

Read the genre profile file:
```
!Read .claude/skills/gf-concept/references/genre-{GENRE}.md
```

If `GENRE` is empty or not one of (casual, rpg, puzzle, strategy, idle, action):
- Ask the user: "What genre best describes your game? Options: casual, rpg, puzzle, strategy, idle, action"
- After selection, set it: `!`node bin/gf-tools.cjs config-set genre {selected}``
- Then read the corresponding genre profile.

The genre profile defines:
- **Chapter Inclusion**: which chapters to include (YES) or skip (SKIP)
- **Questioning Emphasis**: genre-specific focus areas for each chapter
- **Section Variants**: additional or modified sections per chapter
- **Depth Multiplier**: word count scaling factor

## Step 3: Calculate Next Batch

**If `AUTO_MODE`:** Set the batch to ALL genre-included chapters at once (all 15 or however many the genre includes). Do not break into sessions. Skip Step 4 (session context display) and proceed directly to Step 5 with the full chapter list.

From chapter status (Step 1) and genre profile (Step 2), determine the next 2-3 chapters that are:
1. **Included** by the genre profile (not SKIP)
2. **Not yet complete** (status is pending or in_progress)

Pick the next 2-3 chapters in sequential order (fixed order 1 through 15, never reorder).

**If ALL included chapters are complete:** Skip directly to Step 6 (quality gate).

**If no chapters have been started yet:** This is the first session. Note this for Step 4.

## Step 4: Display Session Context

Calculate which session number this is based on completed chapter count.

Display session header:
- "**Session {N}: Chapters {X}, {Y}, {Z}**" with chapter titles.

**If first session:**
- Display a brief workflow explanation: "We'll co-create your game concept chapter by chapter. I'll ask targeted questions about each chapter, propose ideas with rationale, then generate the full chapter. Each session covers 2-3 chapters."

**If continuing (not first session):**
- Show a brief recap of completed chapters. Read the `summary` field from each completed chapter file's YAML frontmatter:
  ```
  !Read .gf/stages/01-concept/{completed_chapter_slug}.md
  ```
  Extract the `summary` frontmatter field from each. Display as a compact list:
  - "**Completed so far:** Ch1: {summary}, Ch2: {summary}, ..."

## Step 5: Spawn Concept Interviewer Agent

Use the Task tool to spawn `.claude/agents/gf-concept-interviewer.md`.

Pass the following context in the Task prompt:

```
You are working on a game concept document. Here is your assignment:

**Chapters to generate this session:** [{chapter_numbers}] (e.g., [1, 2, 3])
**Chapter titles:** {list of chapter titles for this batch}
**Genre:** {GENRE}
**Genre emphasis:** {key questioning emphasis points from the genre profile for these chapters}
**Section variants:** {any section variants from genre profile for these chapters}
**Depth multiplier:** {depth_multiplier from genre profile}
**Language:** {LANGUAGE} -- ALL chapter content must be in this language
**Entry path:** {ENTRY_PATH} (scratch or reference)
**Chapter file path prefix:** .gf/stages/01-concept/
**Chapter slugs:** {slug for each chapter, e.g., ch01-target-users, ch02-product-positioning}

**Instructions:**
- Read .claude/skills/gf-concept/references/chapter-questions.md for the question bank for your assigned chapters
- Use .claude/skills/gf-concept/templates/chapter-template.md for output format
- Register each rule ID via: node bin/gf-tools.cjs registry add-concept '{"id":"R_N_NN","chapter":N,"description":"...","data_bearing_type":"..."}'
- Data-bearing type KEYS are always English (level_config, object_config, constant_config, probability_config, growth_config, task_config, settlement_config, logic_impl)
- Rule IDs use R_N_NN format (e.g., R_3_01) regardless of language
{IF FIRST SESSION:}
- This is the FIRST session. Start with an open-ended "Tell me about your game idea" conversation before generating Chapter 1. Collect the user's game vision, then work it into the chapter structure. Do NOT generate Chapter 1 before understanding the game.
{END IF}
{IF ENTRY_PATH == "reference":}
- Read .gf/PROJECT.md for reference material. Pre-fill applicable sections from the reference analysis. Present pre-filled content for user review: "Based on the reference material, I've pre-filled: ... Does this look right?" Ask targeted questions only for gaps.
{END IF}
{IF NOT FIRST SESSION:}
- Cross-chapter context from completed chapters:
  {list of chapter summaries from frontmatter of completed chapter files}
- Maintain consistency with earlier chapters: same terminology, same system names, same user profiles. Reference earlier decisions when relevant.
{END IF}
```

**IMPORTANT constraints to include in the Task prompt:**
- Fixed chapter order: always sequential, never reorder
- 2-3 chapters per session batch, never more (unless AUTO_MODE, which sends all chapters at once)
- Rule IDs assigned DURING generation, not post-hoc
- Genre adaptation by chapter skip/include, not section-level rewriting
- Use STRONG PROPOSALS: "I recommend X because Y. Agree?" -- NOT passive "What do you think about X?"
- Must-ask topics (gameplay, monetization, audience, scope) must be thoroughly explored with the user, NEVER skipped or auto-filled

**If `AUTO_MODE`, add the following to the Task prompt context:**
```
**AUTO MODE -- No user interaction:**
- Do NOT use AskUserQuestion. Do NOT ask the user anything.
- Generate ALL assigned chapters autonomously in a single pass.
- For must-ask topics (gameplay, monetization, audience, scope): use your best judgment based on the reference material and genre conventions. Make strong, opinionated choices.
- Use the reference material (from .gf/PROJECT.md) as the primary input for all creative decisions.
- Skip the open-ended "tell me about your game" conversation. Go directly to chapter generation.
- Maintain the same output quality and structure as interactive mode.
```

## Step 6: After Agent Completes (or All Chapters Done)

Update concept stage status:
```
!`node bin/gf-tools.cjs state update "Concept" "in_progress"`
```

Check if ALL genre-included chapters are now complete by re-running:
```
!`node bin/gf-tools.cjs concept chapter-status`
```

### If all included chapters are complete:

Display: "All concept chapters complete. Running quality gate..."

Spawn `.claude/agents/gf-quality-reviewer.md` via Task with:

```
Run the concept stage quality gate.

**Chapter files location:** .gf/stages/01-concept/
**Genre profile:** .claude/skills/gf-concept/references/genre-{GENRE}.md
**Quality criteria:** .claude/skills/gf-concept/references/quality-criteria.md
**Language:** {LANGUAGE} -- REVIEW.md content in this language

**Instructions:**
- Read all chapter files from .gf/stages/01-concept/ch*.md
- Read the genre profile to determine which chapters are expected (do NOT check skipped chapters)
- Read quality-criteria.md for validation rules and REVIEW.md format
- Apply auto-fixes directly to chapter files
- Register any new rule IDs via: node bin/gf-tools.cjs registry add-concept '{"id":"...","chapter":N,"description":"...","data_bearing_type":"..."}'
- Write REVIEW.md to .gf/stages/01-concept/REVIEW.md
- NEVER auto-fill these topics -- always flag for user decision:
  - Core gameplay choice (Ch3)
  - Monetization model (Ch9/Ch10)
  - Target audience (Ch1)
  - Scope boundaries (Ch2)
{IF AUTO_MODE:}
**AUTO MODE:** For must-ask items, use AI best judgment instead of flagging for user decision. Apply your recommendation directly. Log what you decided in REVIEW.md under a new 'Auto-Resolved Decisions' section.
{END IF}
```

After quality gate completes:

**If `AUTO_MODE`:**
- Skip presenting REVIEW.md to user. Skip collecting user decisions.
- Update state to complete: `!`node bin/gf-tools.cjs state update "Concept" "complete"``
- Display: "Concept stage complete (auto mode). Proceeding to next stage..."

**If NOT `AUTO_MODE`:**
- Read and display `.gf/stages/01-concept/REVIEW.md` contents to the user.
- **If REVIEW.md has "Needs User Decision" items:**
  - Present each decision to the user and collect their answers.
  - Apply their decisions to the relevant chapter files.
  - Re-run the quality gate to verify all issues are resolved.
- **If all checks pass (no user decisions needed):**
  - Update state to complete: `!`node bin/gf-tools.cjs state update "Concept" "complete"``
  - Display: "Concept stage complete! Run `/gf:system-design` to begin Stage 2."

### If more chapters remain:

Calculate remaining chapter count.

Display: "Session complete. {N} chapters remaining across {M} more sessions. Run `/gf:concept` to continue."

Show progress:
```
!`node bin/gf-tools.cjs progress full`
```

## Constraints

These rules are locked decisions and must never be violated:

- **Fixed chapter order:** Always 1 through 15, never reorder chapters
- **2-3 chapters per session:** Never generate more than 3 chapters in a single session
- **Inline rule IDs:** Rule IDs are assigned DURING chapter generation, never post-hoc
- **Chapter-level genre adaptation:** Genre profiles skip/include entire chapters, not section-level rewriting
- **Single quality gate:** Quality gate runs ONCE after ALL chapters are complete, not per-session
- **Must-ask topics NEVER auto-filled (interactive mode):** Core gameplay (Ch3), monetization (Ch9/10), target audience (Ch1), and scope boundaries (Ch2) require explicit user input -- the quality gate must flag these if missing and never generate content for them
- **Auto mode:** When `--auto` flag is present, all user interaction is skipped. Must-ask topics are resolved by AI judgment. Chapters are generated in a single batch, not across sessions. Quality gate auto-approves. The structural quality (rule IDs, genre adaptation, section completeness) is identical to interactive mode.
