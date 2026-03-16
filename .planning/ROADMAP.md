# Roadmap: Game Forge

## Milestones

- v0.1.0 Initial Release - Phases 1-6 (shipped 2026-03-16)
- v0.2.0 Auto Mode + Video Analysis - Phases 7-9 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v0.1.0 Initial Release (Phases 1-6) - SHIPPED 2026-03-16</summary>

- [x] **Phase 1: Foundation** - Plugin skeleton, state management, project lifecycle, and the architectural scaffolding all stages depend on (completed 2026-03-14)
- [x] **Phase 2: Game Concept** - Stage 1 concept document generation with deep questioning, genre adaptation, and auto-fix quality gates (completed 2026-03-14)
- [x] **Phase 3: System Design** - Stage 2 system expansion with IDs, handoff packages, cross-system validation, and cross-stage consistency checking (completed 2026-03-15)
- [x] **Phase 4: Data Schema** - Stage 3A table generation with ER relationships, field definitions, dual-format export, and schema freeze mechanism (completed 2026-03-15)
- [x] **Phase 5: Numerical Balance** - Stage 3B balance values, difficulty curves, economy tuning, and commercialization boundaries (completed 2026-03-15)
- [x] **Phase 6: Production Specs** - Stage 4 art, UI/UX, and tech specifications with upstream traceability and session granularity adaptation (completed 2026-03-15)

</details>

### v0.2.0 Auto Mode + Video Analysis (Phases 7-9)

- [ ] **Phase 7: Video Analysis** - Accept game video files, extract key frames via ffmpeg, analyze with Claude vision, and produce a structured game reference document
- [ ] **Phase 8: Auto Pipeline Engine** - `--auto` flag on `/gf-new-game`, input detection (text/file/video), and automatic chaining of all 5 stages with self-approving quality gates
- [ ] **Phase 9: Auto Completion and Review** - Final summary of all generated output, autonomous decision log, and interactive re-entry for post-auto adjustments

## Phase Details

<details>
<summary>v0.1.0 Phase Details (Phases 1-6)</summary>

### Phase 1: Foundation
**Goal**: Users can create, resume, and track Game Forge projects with persistent state across sessions
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07, FOUND-08
**Success Criteria** (what must be TRUE):
  1. User can run a slash command to create a new Game Forge project and see a `.game-forge/` directory initialized with state files (STATE.md, config.json, registry.json)
  2. User can close Claude Code, reopen it, resume the project, and see full context restoration -- the plugin knows what stage they were on and what decisions were made
  3. User can check project progress at any time and see a clear display of which stages are complete, in-progress, or pending
  4. User is asked for language preference at project start, and the choice is persisted in config for all future document generation
  5. User can start a project either by describing an original game idea in text OR by describing an existing game/ad/competitor as reference material -- both paths initialize correctly
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md -- Core library and state engine (core.cjs, frontmatter.cjs, state.cjs, config.cjs + Wave 0 test scaffolds)
- [x] 01-02-PLAN.md -- CLI tool, project scaffolding, progress visualization, and traceability registry
- [x] 01-03-PLAN.md -- User-facing skills (/gf:new-game, /gf:resume, /gf:progress), stage placeholders, and agent definitions

### Phase 2: Game Concept
**Goal**: Users can produce a complete, genre-adapted game concept document through AI-guided co-creation
**Depends on**: Phase 1
**Requirements**: CONC-01, CONC-02, CONC-03, CONC-04, CONC-05, QUAL-01, QUAL-04
**Success Criteria** (what must be TRUE):
  1. User can generate a game concept document that covers all key sections (target users, positioning, core gameplay, game loops, level design, difficulty/balance, onboarding, retention, monetization direction) -- with sections adapted based on detected genre
  2. AI conducts a deep questioning session before generating the document -- vague answers are challenged, abstract ideas are made concrete through iterative back-and-forth
  3. The generated concept document contains rule IDs and data-bearing-type markers on every key rule, visible in the document and registered in the ID registry
  4. Before Stage 2 can begin, the quality gate runs automatically -- structural gaps are filled by the AI without user intervention, and the user is only asked to decide on genuine creative questions
  5. User working on a casual mobile game and a user working on a premium PC RPG see different section coverage in their concept documents -- genre detection adapts the template
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md -- Concept module (concept.cjs) with chapter mapping, rule ID validation, genre filtering, and traceability extension for R_N_NN IDs
- [x] 02-02-PLAN.md -- Genre profiles (6), chapter question bank, quality criteria reference, and chapter output template
- [x] 02-03-PLAN.md -- /gf:concept orchestrator SKILL.md rewrite, concept-interviewer agent rewrite, quality-reviewer agent rewrite

### Phase 3: System Design
**Goal**: Users can expand a concept document into detailed, traceable system designs with handoff packages for downstream stages
**Depends on**: Phase 2
**Requirements**: SYST-01, SYST-02, SYST-03, SYST-04, SYST-05, SYST-06, SYST-07, QUAL-02
**Success Criteria** (what must be TRUE):
  1. User can expand their concept into complete system designs, each saved as a separate file with a unique system ID, detailed rules (with rule IDs), states, dependencies, and exception handling
  2. Each system design produces three handoff packages: data anchors (7A -- which tables are needed), numerical balance inputs (7B -- which values need tuning), and program implementation contracts (7C -- state machines, event bus, formulas, error codes)
  3. Cross-system consistency is validated automatically: tasks reference only opened content, resource economy balances, ad/payment mechanisms do not conflict, and tutorials cover rules before testing them
  4. Cross-stage traceability is validated: every system and rule in Stage 2 traces back to a concept document rule, and the user can see the audit results
  5. Before Stage 3 can begin, the quality gate runs automatically -- structural gaps are filled by the AI, the user is only asked about genuine design decisions
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md -- System design module (system-design.cjs) with ID validation, status tracking, traceability checks, cross-system consistency validation, and CLI wiring
- [x] 03-02-PLAN.md -- System template reference (10 sections + 7A/7B/7C), quality criteria, cross-system checks, and content rhythm template
- [x] 03-03-PLAN.md -- /gf:system-design orchestrator SKILL.md rewrite, system-designer agent, system-quality-reviewer agent

### Phase 4: Data Schema
**Goal**: Users can generate frozen, implementation-ready data schemas from system designs with dual-format output
**Depends on**: Phase 3
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06, DATA-07, QUAL-03
**Success Criteria** (what must be TRUE):
  1. User can generate a complete data schema including system mapping matrix, table catalog, field-level definitions (name, type, default, required, validation rules), ER diagrams in Mermaid format, and foreign key constraints
  2. Schema includes enum definitions, ID conventions, compound field encoding standards, save/archive structure, and version migration strategy
  3. Each core table includes minimum viable sample data sufficient for a complete gameplay loop (new player through first level through settlement through growth through next level)
  4. Schema data is output in both markdown tables (for human review) and CSV/TSV files (for game engine import), generated from the same canonical data model
  5. User explicitly confirms schema freeze before numerical balance work can begin -- after freeze, table structure cannot be modified
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md -- Data schema module (data-schema.cjs) with 7A anchor extraction, CSV generation, freeze mechanism, validation, and CLI wiring
- [x] 04-02-PLAN.md -- Table definition template, 6-layer architecture reference, quality criteria, mapping matrix template, sample data template
- [x] 04-03-PLAN.md -- /gf:data-schema orchestrator SKILL.md rewrite, schema-generator agent, schema-quality-reviewer agent

### Phase 5: Numerical Balance
**Goal**: Users can fill frozen data tables with balanced, tunable game values that produce playable difficulty curves and sustainable economies
**Depends on**: Phase 4
**Requirements**: NUMR-01, NUMR-02, NUMR-03, NUMR-04, NUMR-05, NUMR-06
**Success Criteria** (what must be TRUE):
  1. User can generate numerical balance documentation that fills data tables with concrete values for difficulty curves, resource economy, and progression pacing across the full player lifecycle
  2. Balance documentation includes per-level-segment difficulty parameters with pressure sources, remediation mechanisms, and bidirectional tuning strategies (what to adjust if too hard vs. too easy)
  3. Economic production/consumption analysis shows designed choke points, prohibited drought points, and safety-net mechanisms -- the user can trace how resources flow through the game
  4. Commercialization boundaries are explicitly documented: which parameters are off-limits for revenue optimization, and what experience protection rules apply
  5. Each balanced value has a tuning priority, hot-update flag, adjustment step limit, and rollback condition -- the user can see exactly how to adjust the game post-launch
**Plans**: 3 plans

Plans:
- [x] 05-01-PLAN.md -- Balance library module (balance.cjs) with 7B extraction, CSV value update, economy validation, difficulty checks, and CLI wiring
- [x] 05-02-PLAN.md -- Lifecycle phases reference, balance output templates (difficulty, economy, monetization, tuning), and quality criteria
- [x] 05-03-PLAN.md -- /gf:balance orchestrator SKILL.md rewrite, balance-generator agent, balance-quality-reviewer agent

### Phase 6: Production Specs
**Goal**: Users can generate implementation-ready specifications for art, UI/UX, and tech teams, completing the full design document pipeline
**Depends on**: Phase 5
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04, QUAL-05
**Success Criteria** (what must be TRUE):
  1. User can generate art requirement specs including asset inventories by system, state requirements per asset, resolution standards, theme variations, and production priority
  2. User can generate UI/UX requirement specs including page architecture with navigation flow, key page layouts with data bindings and error states, and core interaction flows with step-by-step specs
  3. User can generate tech requirement specs including module boundaries, config loading timing, exception handling scenarios, and client/server responsibility divisions
  4. Every production spec asset traces back to a Stage 2 system ID -- no spec references a system or rule not defined upstream, and the user can verify this
  5. Plugin adapts session granularity based on game complexity -- simple games complete stages in fewer sessions, complex games split into sub-sessions
**Plans**: 3 plans

Plans:
- [x] 06-01-PLAN.md -- Production library module (production.cjs) with art/UI/tech anchor extraction, traceability validation, status tracking, and CLI wiring
- [x] 06-02-PLAN.md -- Art spec template (A-K), UI spec template (A-M), tech spec template (A-K), and production quality criteria (8+4)
- [x] 06-03-PLAN.md -- /gf:production orchestrator SKILL.md rewrite, 3 generator agents, quality reviewer agent, and session granularity updates to all stage SKILL.md files

</details>

### Phase 7: Video Analysis
**Goal**: Users can provide a game video file and get a structured game reference document that captures the game's mechanics, art style, UI patterns, and design philosophy -- ready to feed into the design pipeline
**Depends on**: Phase 6 (uses existing project infrastructure)
**Requirements**: VDEO-01, VDEO-02, VDEO-03, VDEO-04, VDEO-05
**Success Criteria** (what must be TRUE):
  1. User can provide an mp4/mov video file to `/gf-new-game --auto` and the plugin extracts key frames from the video using ffmpeg without manual intervention
  2. Extracted frames are sent to Claude's vision capability which identifies and describes: core gameplay mechanics, art style, UI layout, monetization patterns, level structure, and player interactions visible in the footage
  3. The analysis produces a structured `.gf/VIDEO-ANALYSIS.md` document that reads like a game reference brief -- organized by design dimension, not by frame -- and is usable as input for concept generation
  4. User can control frame extraction density (default 1 frame per 2 seconds, overridable with `--fps`), and the plugin handles both short ad clips (10-60s) and longer gameplay recordings (3-10min) without degradation
**Plans**: 2 plans

Plans:
- [x] 07-01-PLAN.md -- Video library module (video.cjs) with ffmpeg/ffprobe wrappers, frame budget management, cleanup, and 5 CLI subcommands
- [x] 07-02-PLAN.md -- Video analyzer agent, VIDEO-ANALYSIS.md output template, and /gf:new-game SKILL.md video input detection

### Phase 8: Auto Pipeline Engine
**Goal**: Users can run a single command with `--auto` to produce all game design documents automatically from any supported input (text, reference file, or video), with no intermediate interaction required
**Depends on**: Phase 7
**Requirements**: AUTO-01, AUTO-02, AUTO-03, AUTO-04, AUTO-05, AUTO-06, AUTO-07
**Success Criteria** (what must be TRUE):
  1. User can run `/gf-new-game --auto` with inline text, a reference file (`@reference.md`), or a video file, and the entire 5-stage pipeline (concept, systems, schema, balance, specs) executes end-to-end without stopping for user input
  2. Auto mode correctly detects genre, language, and project name from the provided input material -- the user does not need to answer any setup questions
  3. All 5 stages chain automatically: concept generation produces all 15 chapters autonomously, system design proposes and designs all systems, schema and balance run with automatic schema freeze, and production specs generate all three types
  4. Quality gates run during auto mode but auto-approve all decisions -- structural gaps are filled and creative decisions use the AI's best judgment, producing the same structural quality as interactive mode
  5. All intermediate stage outputs are written to `.gf/` with the same file structure as interactive mode -- a project created via auto mode is indistinguishable in structure from one created interactively
**Plans**: 2 plans

Plans:
- [ ] 08-01-PLAN.md -- Add --auto mode to all 5 stage SKILL.md files (concept, system-design, data-schema, balance, production) with auto-approve quality gates
- [ ] 08-02-PLAN.md -- Wire gf-new-game --auto as master auto-chain orchestrator running all 5 stages sequentially

### Phase 9: Auto Completion and Review
**Goal**: Users can see exactly what the auto pipeline produced, understand the AI's autonomous decisions, and selectively re-enter interactive mode to adjust any stage
**Depends on**: Phase 8
**Requirements**: AUTO-08, AUTO-09
**Success Criteria** (what must be TRUE):
  1. After auto mode completes, user sees a comprehensive summary listing: all generated files organized by stage, total document count, and every key decision the AI made autonomously (genre detected, systems proposed, balance strategies chosen, creative calls made)
  2. User can pick any completed stage and re-run it interactively using existing commands (`/gf-concept`, `/gf-system-design`, etc.) -- the auto-generated project loads correctly and the interactive flow works as if the user had created it manually
  3. Re-running a stage interactively overwrites auto-generated output for that stage while preserving all other stages the user is satisfied with
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 7 -> 8 -> 9

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v0.1.0 | 3/3 | Complete | 2026-03-14 |
| 2. Game Concept | v0.1.0 | 3/3 | Complete | 2026-03-14 |
| 3. System Design | v0.1.0 | 3/3 | Complete | 2026-03-15 |
| 4. Data Schema | v0.1.0 | 3/3 | Complete | 2026-03-15 |
| 5. Numerical Balance | v0.1.0 | 3/3 | Complete | 2026-03-15 |
| 6. Production Specs | v0.1.0 | 3/3 | Complete | 2026-03-15 |
| 7. Video Analysis | v0.2.0 | 2/2 | Complete | 2026-03-16 |
| 8. Auto Pipeline Engine | v0.2.0 | 0/2 | Not started | - |
| 9. Auto Completion and Review | v0.2.0 | 0/? | Not started | - |
