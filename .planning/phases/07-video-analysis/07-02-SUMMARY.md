---
phase: 07-video-analysis
plan: 02
subsystem: video
tags: [claude-vision, video-analysis, agent, template, skill-orchestration]

# Dependency graph
requires:
  - phase: 07-video-analysis/01
    provides: "video.cjs library with 5 CLI subcommands (check-ffmpeg, probe, plan, extract, cleanup)"
provides:
  - "gf-video-analyzer.md agent for batch frame analysis and VIDEO-ANALYSIS.md generation"
  - "video-analysis-template.md with 7 sections covering 6 design dimensions"
  - "SKILL.md video input detection and Step 2A orchestration flow"
affects: [08-auto-pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns: [batch frame analysis (8-10 frames per pass), synthesis-by-dimension agent pattern, video input detection in skill orchestration]

key-files:
  created:
    - .claude/agents/gf-video-analyzer.md
    - .claude/skills/gf-new-game/references/video-analysis-template.md
  modified:
    - .claude/skills/gf-new-game/SKILL.md

key-decisions:
  - "Agent model set to opus for best vision analysis quality on game frames"
  - "Batch size 8-10 frames balances context usage with analysis depth"
  - "Video analysis feeds into existing --auto flow at Step 4, keeping all downstream steps unchanged"

patterns-established:
  - "Video input detection: check file extension against supported set (.mp4, .mov, .avi, .webm, .mkv) before routing"
  - "Agent delegation with structured parameters: frameDir, sampleIndices, videoMeta, outputPath, templatePath"
  - "Synthesis-by-dimension: agent analyzes frames in batches then consolidates by design dimension, never by frame"

requirements-completed: [VDEO-02, VDEO-03]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 7 Plan 2: Video Analyzer Agent and SKILL.md Orchestration Summary

**gf-video-analyzer agent with batch frame analysis (8-10 frames), structured VIDEO-ANALYSIS.md template covering 6 design dimensions, and /gf:new-game Step 2A video orchestration flow (probe -> plan -> extract -> analyze -> cleanup)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T16:23:43Z
- **Completed:** 2026-03-16T16:27:19Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Video analyzer agent with complete behavior spec: batch frame reading via Read tool, cross-batch synthesis by design dimension, template variable replacement, and output quality checks
- VIDEO-ANALYSIS.md template with all 7 major sections (Game Overview, Core Gameplay Mechanics, Art Style, UI Layout and Patterns, Monetization Patterns, Level and Progression Structure, Key Design Insights) and 16 subsections
- SKILL.md updated with video file detection in --auto mode and full Step 2A orchestration: check-ffmpeg -> probe -> plan -> extract -> agent delegation -> cleanup -> read analysis -> continue to Step 4

## Task Commits

Each task was committed atomically:

1. **Task 1: Create video analysis template and video analyzer agent** - `1b2f25d` (feat)
2. **Task 2: Update /gf:new-game SKILL.md with video input detection** - `b01e270` (feat)

## Files Created/Modified
- `.claude/agents/gf-video-analyzer.md` - Agent for batch frame analysis and VIDEO-ANALYSIS.md generation (opus model, Read/Write/Bash tools)
- `.claude/skills/gf-new-game/references/video-analysis-template.md` - Structured output template with 7 sections, 16 subsections, and template variables for video metadata
- `.claude/skills/gf-new-game/SKILL.md` - Added video file detection, Step 2A video analysis flow, --fps flag support, and video-related notes

## Decisions Made
- Set agent model to `opus` (not `inherit`) because video frame analysis benefits from the strongest vision capability available
- Batch size of 8-10 frames per analysis pass balances context window usage with sufficient visual context for cross-frame pattern recognition
- Video analysis integrates at Step 2A, feeding VIDEO-ANALYSIS.md content into the existing Step 4 extraction flow -- all downstream steps (scaffold, git, success message) remain completely unchanged

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. ffmpeg/ffprobe must be on system PATH (covered by Plan 01 documentation).

## Next Phase Readiness
- Phase 7 complete: video.cjs library (Plan 01) + video analyzer agent + SKILL.md orchestration (Plan 02)
- End-to-end video analysis flow ready: user provides video file -> frames extracted -> analyzed by agent -> VIDEO-ANALYSIS.md produced -> fed into concept generation
- Phase 8 (Auto Pipeline Engine) can now consume the video input path alongside text and file inputs

---
*Phase: 07-video-analysis*
*Completed: 2026-03-16*

## Self-Check: PASSED

- FOUND: .claude/agents/gf-video-analyzer.md
- FOUND: .claude/skills/gf-new-game/references/video-analysis-template.md
- FOUND: .claude/skills/gf-new-game/SKILL.md
- FOUND: .planning/phases/07-video-analysis/07-02-SUMMARY.md
- FOUND: 1b2f25d (Task 1 commit)
- FOUND: b01e270 (Task 2 commit)
