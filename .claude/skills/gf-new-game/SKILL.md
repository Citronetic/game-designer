---
name: gf-new-game
description: Create a new Game Forge project with guided setup
argument-hint: "[--auto]"
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
- Expect the user to provide a game concept document (pasted text, a file path, or a description).
- Read and analyze the provided material.
- Extract: project name, genre, language, platform, monetization model.
- Use smart defaults for any missing values:
  - Language: detect from the user's writing language, or default to the language the concept document is written in
  - Genre: infer from content
  - Platform: default to "mobile" if unclear
  - Monetization: default to "free-to-play" if unclear
- Skip to **Step 4** with extracted values.

**If `--auto` is NOT present (interactive mode):**
- Continue to **Step 3**.

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
- Stage and commit the initial `.gf/` files:
  ```
  !`git add .gf/`
  !`git commit -m "feat: initialize Game Forge project"`
  ```

### Step 7: Entry Path Follow-up

**If entry_path is "reference":**
- Ask the user to describe the reference game, ad, or competitor they want to base their design on.
- Save their description into the "Reference Material" section of `.gf/PROJECT.md`.

**If entry_path is "scratch":**
- No additional follow-up needed.

### Step 8: Present Success

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

## Error Handling

- If `scaffold project` fails, show the error output and suggest checking write permissions.
- If git commit fails, warn but don't block -- the project is still usable without git tracking.
- If the user provides invalid or ambiguous answers, ask for clarification naturally.

## Notes

- All design documents will be written in the user's chosen language.
- The genre hint influences later stages but doesn't lock the project into a rigid structure.
- The `--auto` flag is useful for quickly bootstrapping from existing game concept documents.
