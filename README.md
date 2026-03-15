# Game Forge

A Claude Code skills plugin that guides anyone — from seasoned game designers to first-time idea holders — through a structured, multi-session game design process. Starting from a raw game concept, Game Forge acts as an AI co-creator to produce the full suite of documents a developer needs to implement the game.

## What It Produces

| Stage | Output | Description |
|-------|--------|-------------|
| 1. Concept | 15 chapter files | Target users, core gameplay, game loops, levels, difficulty, onboarding, retention, monetization, art direction, UI/UX, tech requirements, analytics, ROI |
| 2. System Design | Per-system spec files | System IDs, rules, states, dependencies, handoff packages (data/art/UI/tech anchors), program contracts, one-week content rhythm |
| 3A. Data Schema | Table definitions + CSV | Field-level specs, ER relationships, enums, ID conventions, save/migration, sample data |
| 3B. Balance | Difficulty + economy docs | Difficulty curves, resource economy, commercialization boundaries, tuning/rollback strategies |
| 4. Production | Art/UI/Tech specs | Asset inventories, page architecture, interaction flows, module boundaries, client/server split |

## Installation

### For Claude Code

Copy the skills and agents to your project or user-level `.claude/` directory:

```bash
# Clone the repository
git clone https://github.com/citronetic/game-designer.git

# Copy to your project (project-level)
cp -r game-designer/.claude/skills/ your-project/.claude/skills/
cp -r game-designer/.claude/agents/ your-project/.claude/agents/
cp -r game-designer/bin/ your-project/bin/

# OR copy to user-level (available in all projects)
cp -r game-designer/.claude/skills/ ~/.claude/skills/
cp -r game-designer/.claude/agents/ ~/.claude/agents/
cp -r game-designer/bin/ ~/bin/
```

### For OpenCode

OpenCode uses the same `.claude/` directory structure. Copy the files the same way:

```bash
cp -r game-designer/.claude/skills/ your-project/.claude/skills/
cp -r game-designer/.claude/agents/ your-project/.claude/agents/
cp -r game-designer/bin/ your-project/bin/
```

> **Note:** OpenCode may use different tool names. The skills reference `AskUserQuestion` and `Agent` tools — verify these are available in your OpenCode version.

### Requirements

- **Node.js** >= 16.7.0 (for CLI tooling)
- **No npm dependencies** — all tooling uses Node.js built-in modules only

## Quick Start

1. **Start a new game project:**
   ```
   /gf-new-game
   ```
   The AI will ask for: project name, language, genre, and entry path (from scratch or reference material).

2. **Create the game concept document:**
   ```
   /gf-concept
   ```
   The AI co-creates a 15-chapter concept document with you, 2-3 chapters per session.

3. **Expand into system designs:**
   ```
   /gf-system-design
   ```
   AI proposes a system list from your concept, then designs each system with full specs.

4. **Generate data schemas:**
   ```
   /gf-data-schema
   ```
   Automatically generates table definitions from system design anchors. Includes CSV export.

5. **Fill in balance values:**
   ```
   /gf-balance
   ```
   Fills frozen data tables with difficulty curves, economy values, and tuning strategies.

6. **Generate production specs:**
   ```
   /gf-production
   ```
   Generates art, UI/UX, and tech specs in parallel. Use `--art-only`, `--ui-only`, or `--tech-only` for individual specs.

## Commands Reference

| Command | Description |
|---------|-------------|
| `/gf-new-game` | Initialize a new game project (asks name, language, genre, entry path) |
| `/gf-concept` | Stage 1: Create game concept document (15 chapters, 2-3 per session) |
| `/gf-system-design` | Stage 2: Expand concept into detailed system designs |
| `/gf-data-schema` | Stage 3A: Generate data table definitions with CSV export |
| `/gf-balance` | Stage 3B: Fill tables with balanced values (difficulty, economy, tuning) |
| `/gf-production` | Stage 4: Generate art/UI/tech specs (`--art-only`, `--ui-only`, `--tech-only`) |
| `/gf-progress` | Check current stage status with pipeline visualization |
| `/gf-resume` | Resume a project from where you left off |
| `/gf-export` | Re-export data tables to CSV format |

## How It Works

### AI Co-Creator

Game Forge doesn't just organize your input — it **actively proposes** game design ideas. The AI:
- Proposes specific mechanics, systems, and balance approaches with rationale
- Challenges vague answers ("fun gameplay" → "what does the player actually do?")
- Fills gaps automatically when structural issues are detected
- Only blocks progression when a creative decision requires your input

### Multi-Session Workflow

Game design documents are too large for a single session. Game Forge splits work across sessions:
- **Concept:** 2-3 chapters per session (~5-7 sessions)
- **System Design:** 1-2 systems per session
- **Data/Balance/Specs:** Automated generation, typically 1-2 sessions each

Session state is persisted in `.gf/STATE.md` — run `/gf-resume` to continue where you left off.

### Genre Adaptation

6 genre profiles adapt the process to your game type:
- **Casual** — ad monetization focus, short sessions, simple loops
- **RPG** — deep progression, character systems, narrative elements
- **Puzzle** — level generation, difficulty curves, mechanic layering
- **Strategy** — resource management, tech trees, AI opponents
- **Idle** — offline progression, prestige systems, exponential growth
- **Action** — combat systems, enemy design, skill-based difficulty

Irrelevant chapters/sections are automatically skipped based on genre.

### Quality Gates

Between each stage, an automated quality gate:
- **Auto-fixes:** Missing sections, missing IDs, inconsistencies, depth gaps
- **Asks you:** Core gameplay choices, monetization model, target audience, scope boundaries
- Produces a `REVIEW.md` showing what was checked and fixed

### Traceability

Every artifact traces back to its source:
```
Concept Rule (R_3_01) → System Rule (RULE-COMBAT-001) → Data Table (monsters) → Balance Value → Art Asset
```
The ID registry (`.gf/traceability/id-registry.json`) enables automated cross-stage validation.

## Project Structure

When you run `/gf-new-game`, the following structure is created:

```
.gf/
  config.json              # Project settings (language, genre, etc.)
  STATE.md                 # Current stage, session continuity
  PROJECT.md               # Game concept summary
  stages/
    01-concept/            # Stage 1: Game concept chapters
      ch01-target-users.md
      ch03-core-gameplay.md
      ...
    02-system-design/      # Stage 2: System designs
      systems/
        SYS-CORE-GAMEPLAY.md
        SYS-LEVEL.md
        ...
      CONTENT-RHYTHM.md
    03a-data-schema/       # Stage 3A: Data tables
      tables.md
      relationships.md
      enums.md
      configs/             # CSV exports
        monsters.csv
        items.csv
        ...
    03b-balance/           # Stage 3B: Balance values
      difficulty.md
      economy.md
      monetization.md
      tuning.md
    04-production/         # Stage 4: Production specs
      ART-SPEC.md
      UI-SPEC.md
      TECH-SPEC.md
  traceability/
    id-registry.json       # Cross-stage ID tracking
```

## Plugin Structure

```
game-designer/
  bin/
    gf-tools.cjs           # CLI tool (state, validation, export)
    lib/                    # Library modules (254 tests)
  .claude/
    skills/                 # 9 slash commands
      gf-new-game/
      gf-concept/
      gf-system-design/
      gf-data-schema/
      gf-balance/
      gf-production/
      gf-progress/
      gf-resume/
      gf-export/
    agents/                 # 12 specialized agents
      gf-concept-interviewer.md
      gf-system-designer.md
      gf-schema-generator.md
      gf-balance-generator.md
      gf-art-spec-generator.md
      gf-ui-spec-generator.md
      gf-tech-spec-generator.md
      gf-quality-reviewer.md
      gf-system-quality-reviewer.md
      gf-schema-quality-reviewer.md
      gf-balance-quality-reviewer.md
      gf-production-quality-reviewer.md
```

## Running Tests

```bash
node --test bin/lib/*.test.cjs
```

254 tests, zero external dependencies.

## License

MIT
