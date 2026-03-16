---
name: gf-progress
description: Show Game Forge project progress with pipeline visualization
disable-model-invocation: true
allowed-tools: [Read, Bash]
---

# /gf:progress -- Show Project Progress

## Overview

Display the current Game Forge project progress with an ASCII pipeline visualization and a stage detail table.

## Process

### Step 1: Check Project

Run:
```bash
node bin/gf-tools.cjs init progress
```

Parse the JSON result.

- If `project_exists` is `false`: Display "No Game Forge project found in this directory. Run `/gf:new-game` to start a new project." **Stop here.**

### Step 2: Display Full Progress

Run:
```bash
node bin/gf-tools.cjs progress full
```

Display the full output to the user. This includes:
1. An ASCII pipeline showing all 5 stages with status indicators (o = Pending, * = In Progress, + = Complete)
2. A detailed stage table with stage numbers, names, and statuses

### Step 3: Suggest Next Action

Based on the current stage from Step 1, suggest the appropriate next action:

| Current Stage | Next Action |
|---------------|-------------|
| 0 (setup) | "Next: run `/gf:concept` to begin Stage 1 -- Concept Design" |
| 1 (concept in progress) | "Continue: run `/gf:concept` to resume concept work" |
| 1 (concept complete) | "Next: run `/gf:system-design` to begin Stage 2 -- System Design" |
| 2 (system design in progress) | "Continue: run `/gf:system-design` to resume system design" |
| 2 (system design complete) | "Next: run `/gf:data-schema` to begin Stage 3A -- Data Schema" |
| 3A (data schema in progress) | "Continue: run `/gf:data-schema` to resume data schema work" |
| 3A (data schema complete) | "Next: run `/gf:balance` to begin Stage 3B -- Balance" |
| 3B (balance in progress) | "Continue: run `/gf:balance` to resume balance work" |
| 3B (balance complete) | "Next: run `/gf:production` to begin Stage 4 -- Production" |
| 4 (production in progress) | "Continue: run `/gf:production` to resume production work" |
| 4 (production complete) | "All stages complete! Run `/gf:export` to export your deliverables." |

## Error Handling

- If STATE.md is missing or unreadable, display an error and suggest running `/gf:resume` for recovery.
