---
name: gf-resume
description: Resume a Game Forge project with full context restoration
disable-model-invocation: true
allowed-tools: [Read, Bash, Write]
---

# /gf:resume -- Resume a Game Forge Project

## Overview

Restore full project context for a Game Forge session. Displays project status, pipeline progress, and offers to continue where the user left off.

## Process

### Step 1: Load Project Context

Run:
```bash
node bin/gf-tools.cjs init resume
```

Parse the JSON result.

- If `project_exists` is `false`: Display "No Game Forge project found in this directory. Run `/gf:new-game` to start a new project." **Stop here.**

Extract from the result:
- `project_name` -- the game's name
- `current_stage` -- numeric stage (0 = setup, 1 = concept, etc.)
- `current_stage_name` -- human-readable stage name
- `status` -- current status (initialized, in_progress, etc.)
- `language` -- document language
- `genre` -- game genre
- `stages` -- object with stage statuses (concept, system_design, data_schema, balance, production)

### Step 2: Display Project Summary

Present the project overview:

> ## Game Forge -- {project_name}
>
> | Field | Value |
> |-------|-------|
> | Genre | {genre} |
> | Language | {language} |
> | Platform | {platform} |
> | Monetization | {monetization} |
> | Current Stage | {current_stage_name} |
> | Status | {status} |

### Step 3: Show Pipeline Visualization

Run:
```bash
node bin/gf-tools.cjs progress pipeline
```

Display the ASCII pipeline output to the user. This shows all 5 stages with their current status indicators (o = Pending, * = In Progress, + = Complete).

### Step 4: Load Session Context

Read `.gf/STATE.md` to find the "Session Continuity" section:
- Extract "Stopped at" value for context on what the user was last doing.
- Extract "Resume file" if one is specified.

### Step 5: Offer to Continue

Based on the current stage and status, present a contextual continuation offer:

**If status is "initialized" (stage 0):**
> Your project is set up and ready to begin. Run `/gf:concept` to start the concept stage.

**If a stage is "in_progress":**
> You were working on **{current_stage_name}**. {stopped_at_context}
>
> Ready to continue? I can pick up right where you left off.

**If a stage just completed:**
> **{completed_stage_name}** is complete! The next stage is **{next_stage_name}**.
>
> Run `/gf:{next_stage_command}` to continue.

Map stage names to commands:
- concept -> `/gf:concept`
- system_design -> `/gf:system-design`
- data_schema -> `/gf:data-schema`
- balance -> `/gf:balance`
- production -> `/gf:production`

### Step 6: Update Session Timestamp

Run:
```bash
node bin/gf-tools.cjs state record-session
```

This records the current session start time for continuity tracking.

## Error Handling

- If STATE.md is missing or corrupted, warn the user and suggest running `/gf:progress` for a basic status check.
- If config.json is missing, fall back to defaults for display fields.
