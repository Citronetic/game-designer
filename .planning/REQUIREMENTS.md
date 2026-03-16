# Requirements: Game Forge v0.2.0 — Auto Mode + Video Analysis

**Defined:** 2026-03-16
**Core Value:** Any person with a game idea can follow the process and produce professional-quality, implementation-ready game design documents — without needing prior game design expertise.

## v0.2.0 Requirements

### Video Analysis

- [x] **VDEO-01**: User can provide a game video file (mp4, mov, etc.) as input to `/gf-new-game --auto`, and the plugin extracts key frames using ffmpeg
- [x] **VDEO-02**: Extracted frames are analyzed using Claude's vision capability to identify: core gameplay mechanics, art style, UI layout, monetization patterns, level structure, and player interactions
- [x] **VDEO-03**: Video analysis produces a structured game reference document (`.gf/VIDEO-ANALYSIS.md`) that serves as the input for the concept generation stage
- [x] **VDEO-04**: Frame extraction is configurable: default 1 frame per 2 seconds, user can override with `--fps` flag
- [x] **VDEO-05**: Video analysis handles short clips (10-60 seconds, typical ad videos) and longer recordings (3-10 minutes, gameplay demos)

### Auto Pipeline

- [x] **AUTO-01**: User can run `/gf-new-game --auto @reference.md` (or inline text, or video file) to start an automatic pipeline that runs all 5 stages without intermediate user interaction
- [x] **AUTO-02**: Auto mode detects genre, language, and project name from the provided input material without asking the user
- [x] **AUTO-03**: Auto mode runs concept generation (Stage 1) using the provided reference as the AI's primary context — no questioning rounds, AI generates all 15 chapters autonomously
- [x] **AUTO-04**: Auto mode chains Stage 2 (system design) automatically after concept, proposing and designing all systems without user confirmation
- [x] **AUTO-05**: Auto mode chains Stage 3A (data schema) and Stage 3B (balance) automatically, including schema freeze
- [x] **AUTO-06**: Auto mode chains Stage 4 (production specs) automatically, generating all three spec types
- [x] **AUTO-07**: Quality gates in auto mode run but auto-approve — structural gaps are filled, creative decisions use AI's best judgment instead of blocking
- [x] **AUTO-08**: Auto mode produces a final summary showing all generated files, total document count, and any decisions the AI made autonomously
- [x] **AUTO-09**: After auto completion, user can review any stage output and re-run individual stages interactively if they want to adjust

## Future Requirements

### Enhanced Auto Mode

- **EAUTO-01**: Auto mode with intermediate checkpoints — pause after each stage for quick review
- **EAUTO-02**: Auto mode progress streaming — show real-time progress as stages complete
- **EAUTO-03**: Batch auto mode — process multiple game concepts in sequence

## Out of Scope

| Feature | Reason |
|---------|--------|
| New stages or document types | v0.2.0 only adds auto-chaining + video analysis |
| Interactive mode changes | Existing interactive flow unchanged |
| New genre profiles | 6 profiles from v0.1.0 are sufficient |
| Real-time video streaming analysis | Only supports pre-recorded video files |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| VDEO-01 | Phase 7 | Complete |
| VDEO-02 | Phase 7 | Complete |
| VDEO-03 | Phase 7 | Complete |
| VDEO-04 | Phase 7 | Complete |
| VDEO-05 | Phase 7 | Complete |
| AUTO-01 | Phase 8 | Complete |
| AUTO-02 | Phase 8 | Complete |
| AUTO-03 | Phase 8 | Complete |
| AUTO-04 | Phase 8 | Complete |
| AUTO-05 | Phase 8 | Complete |
| AUTO-06 | Phase 8 | Complete |
| AUTO-07 | Phase 8 | Complete |
| AUTO-08 | Phase 9 | Complete |
| AUTO-09 | Phase 9 | Complete |

**Coverage:**
- v0.2.0 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after roadmap revision to 3 phases*
