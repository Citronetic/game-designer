# Example Walkthrough: Designing a Match-3 Puzzle Game

This walkthrough demonstrates how to use Game Forge to design a complete match-3 puzzle game from scratch. It shows every stage of the pipeline with real inputs and outputs.

> **Time estimate:** The full pipeline takes ~15-20 sessions across all stages. This walkthrough shows key moments from each stage.

---

## Prerequisites

1. Install Game Forge into your project:
```bash
git clone https://github.com/citronetic/game-designer.git
cp -r game-designer/.claude/skills/ your-project/.claude/skills/
cp -r game-designer/.claude/agents/ your-project/.claude/agents/
cp -r game-designer/bin/ your-project/bin/
```

2. Open your project in Claude Code (or OpenCode):
```bash
cd your-project
claude
```

---

## Stage 0: Create a New Project

### Run the command

```
/gf-new-game
```

### What happens

The AI asks 4 setup questions:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GAME FORGE ► NEW PROJECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Let's set up your game project.
```

**Question 1: Project Name**
```
What's your game project called?
> Sweet Crush Saga
```

**Question 2: Language**
```
What language should all documents be in?
  ● English
  ○ 中文
  ○ Other
> English
```

**Question 3: Genre**
```
What type of game?
  ○ Casual
  ○ RPG
  ● Puzzle
  ○ Strategy
  ○ Idle
  ○ Action
> Puzzle
```

**Question 4: Entry Path**
```
Starting from scratch or from a reference game?
  ● From scratch — I'll describe my idea
  ○ From reference — I'll describe an existing game
> From scratch
```

### Result

A `.gf/` directory is created:
```
.gf/
  config.json    ← {name: "Sweet Crush Saga", genre: "puzzle", language: "en"}
  STATE.md       ← Stage: concept (pending)
  PROJECT.md     ← Empty template, ready for Stage 1
```

---

## Stage 1: Game Concept (`/gf-concept`)

### Session 1: The Idea + Chapters 1-2

```
/gf-concept
```

The AI starts with an open question:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GAME FORGE ► CONCEPT — Session 1/6
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tell me about your game idea.
```

**Your input:**
```
I want to make a match-3 puzzle game with a candy/dessert theme.
The twist is that matched candies create combo effects that chain
together — like explosions that clear rows, columns, or areas.
I want it to feel satisfying and addictive, targeting casual mobile
players who play during commute or breaks.
```

**AI proposes Chapter 1 (Target Users):**
```
Chapter 1: Target Users & Scenarios

I have enough to draft this chapter. Here are my proposals:

PRIMARY USER: Women 25-44, casual mobile gamers, play during commute/breaks,
prefer low-stress puzzle games with visual satisfaction. Average session: 5-15 min.

SECONDARY USER: Teens 16-24, looking for quick dopamine hits, more competitive,
care about high scores and leaderboard bragging.

Key play scenarios:
- Morning commute (subway/bus, 10-15 min)
- Work break (5-10 min, needs quick start/stop)
- Evening wind-down (20-30 min, longer sessions)

Agree with this direction, or want to adjust?
```

**You confirm**, and the AI generates `ch01-target-users.md` with full depth (800+ words), including rule IDs:

```markdown
## 1.1 Target User Profile

**R_1_01** | config: user_profile
Primary user: Women 25-44, casual mobile gamers...

**R_1_02** | config: session_params
Average session: 5-15 minutes, must support instant start/stop...
```

Then it moves to **Chapter 2 (Product Positioning)**, asking:

```
Chapter 2: Product Positioning & Differentiation

Before I draft this, a few questions:

1. What's your one-line pitch? I recommend:
   "A candy-themed match-3 with explosive chain combos that turn
   simple swaps into cascading visual spectacles."
   Agree, or different angle?

2. Main competitors to differentiate from — I'm thinking Candy Crush,
   Toon Blast, Cookie Jam. Others?

3. What should we explicitly NOT build? I recommend excluding:
   social features, real-time PvP, complex storylines.
   Agree?
```

### Session 2-6: Remaining Chapters

Each session covers 2-3 more chapters. The AI:
- Gives a brief intro: "Chapter 5 defines your levels and content pipeline."
- Asks 3-5 targeted questions with strong proposals
- Generates the full chapter with rule IDs and data-bearing-type markers

**Example from Chapter 3 (Core Gameplay):**
```markdown
## 3.2 Basic Rules

**R_3_01** | config: level_config
Grid: 8×8 board, 6 candy colors (expandable via config).
Swap: Adjacent candies only, swap must create a match of 3+.
If no valid swap exists, board auto-shuffles.

**R_3_02** | config: combo_config
Combo rules:
- Match 4 in a row → Striped candy (clears entire row or column)
- Match 5 in L/T shape → Wrapped candy (3×3 explosion)
- Match 5 in a line → Color bomb (clears all of one color)
- Combine two specials → Super combo (varies by combination)

**R_3_03** | logic: match_engine
Match detection: After every swap AND after every gravity settle,
scan board for groups of 3+. Process largest groups first.
Chain reactions: Each cascade step adds +1 to combo multiplier.
```

### After All Chapters: Quality Gate

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GAME FORGE ► QUALITY GATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reviewing 15 chapters...

Auto-fixed:
  ✓ Ch06 difficulty curve: added missing pass rate targets (85% early, 60% mid)
  ✓ Ch09 ad frequency: added missing cooldown interval (30 sec minimum)
  ✓ Ch14 analytics: added missing funnel step (tutorial completion)

Needs your input:
  ? Ch03 core gameplay: Board size 8×8 or 9×9? (affects difficulty scaling)
  ? Ch10 payment: Price point for remove-ads? ($2.99 or $4.99?)

REVIEW.md written to .gf/stages/01-concept/REVIEW.md
```

### Output

```
.gf/stages/01-concept/
  ch01-target-users.md
  ch02-product-positioning.md
  ch03-core-gameplay.md
  ch04-game-loops.md
  ch05-levels-content.md
  ch06-difficulty-balance.md
  ch07-onboarding.md
  ch08-retention.md
  ch09-ad-monetization.md
  ch10-light-payments.md
  ch11-art-style.md
  ch12-ui-ux.md
  ch13-tech-requirements.md
  ch14-data-analytics.md
  ch15-revenue-roi.md
  REVIEW.md
```

Each file contains rule IDs (R_1_01, R_3_02, etc.) with data-bearing-type markers that Stage 2 will consume.

---

## Stage 2: System Design (`/gf-system-design`)

### System List Proposal

```
/gf-system-design
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GAME FORGE ► SYSTEM DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I've analyzed your 15 concept chapters and identified 10 systems:

 #  System                   Priority  Source Chapters
 1  Core Match Engine        P0        Ch03, Ch04
 2  Level & Chapter System   P0        Ch05, Ch06
 3  Combo & Special System   P0        Ch03
 4  Scoring & Settlement     P0        Ch04, Ch06
 5  Resource & Reward        P0        Ch04, Ch08
 6  Progression & Unlock     P1        Ch05, Ch08
 7  Tutorial & Onboarding    P1        Ch07
 8  Ad Monetization          P1        Ch09
 9  Light Payment & Shop     P1        Ch10
10  Save & Recovery          P2        Ch13

Approve this list, or adjust?
```

### Per-System Design (1-2 per session)

For each system, the AI asks 3-5 questions, then generates a complete spec:

**Example: SYS-MATCH-ENGINE.md** (excerpt)
```markdown
---
system_id: SYS-MATCH
system_name: Core Match Engine
type: core_gameplay
priority: P0
concept_sources: [R_3_01, R_3_02, R_3_03, R_3_04, R_3_05]
---

# Core Match Engine

## 4.1 System Basics
System ID: SYS-MATCH
Type: Core Gameplay (P0)

## 4.4 States & Flow
States: IDLE → SWAPPING → MATCHING → CASCADING → SETTLING → IDLE
Swap rejected if no match formed → return to IDLE with shake animation.

## 4.5 Core Rules
RULE-MATCH-001: Match detection scans after every swap and gravity settle
RULE-MATCH-002: Minimum match = 3 adjacent same-color candies
RULE-MATCH-003: Special candy created when match ≥ 4
RULE-MATCH-004: Cascade combo multiplier increments per chain step
RULE-MATCH-005: No valid moves → auto-shuffle (max 3 before fail-safe)

## 4.10 Program Contracts

### State Machine
IDLE → {user_swap} → SWAPPING
SWAPPING → {match_found} → MATCHING
SWAPPING → {no_match} → IDLE
MATCHING → {specials_created} → CASCADING
CASCADING → {no_more_matches} → SETTLING
SETTLING → {board_stable} → IDLE

### Events
EVT-MATCH-001: on_swap_start(pos1, pos2)
EVT-MATCH-002: on_match_found(cells[], match_type, combo_level)
EVT-MATCH-003: on_special_created(cell, special_type)
EVT-MATCH-004: on_cascade_complete(total_score, combo_count)

### Formulas
score = base_value × candy_count × combo_multiplier
combo_multiplier = 1.0 + (cascade_step × 0.5)

## 7A Data Anchors
| Table | Purpose |
|-------|---------|
| candy_types | Color, base score, sprite reference |
| special_rules | Match pattern → special type mapping |
| combo_multipliers | Cascade step → multiplier values |

## 7B Balance Inputs
- Base candy score range: 10-50 per candy
- Combo multiplier curve: 1.0, 1.5, 2.0, 3.0, 5.0
- Max cascade depth before force-settle: 10

## 7C Program Contracts
[State machines, events, formulas as shown above]
```

### One-Week Content Rhythm

After all systems, the AI generates `CONTENT-RHYTHM.md`:

```markdown
| Day | Core Target        | New Content              | Growth Change     |
|-----|--------------------|--------------------------|-------------------|
| D1  | Learn swap + match | 5 tutorial levels        | Unlock colors 1-4 |
| D2  | First combos       | Introduce striped candy  | Unlock color 5    |
| D3  | Chapter 2 start    | New theme + obstacles    | First power-up    |
| D4  | Challenge spike    | Wrapped candy combos     | Star rewards      |
| D5  | Color bomb          | 5-in-a-line mechanic     | Daily missions    |
| D6  | Mixed challenges    | Combined obstacles       | Shop unlock       |
| D7  | Boss level          | Chapter 2 boss + reward  | Chapter 3 tease   |
```

---

## Stage 3A: Data Schema (`/gf-data-schema`)

```
/gf-data-schema
```

The AI reads all system 7A anchors and generates the complete schema automatically:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GAME FORGE ► DATA SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reading 10 system files... extracting 7A anchors...

Generated 18 tables across 6 layers:
  Core Config:    candy_types, special_rules, level_config, obstacles
  Constants:      game_constants
  Probability:    combo_multipliers, drop_rates, reward_pools
  i18n:           text_strings
  Progress:       chapters, level_progress, player_unlocks
  Rewards:        daily_rewards, achievement_rewards, ad_rewards

Review the schema? (yes / adjust)
```

**Example table definition (from `tables.md`):**
```markdown
### candy_types

| Field | Type | Default | Required | Meaning | Validation | Example |
|-------|------|---------|----------|---------|------------|---------|
| candy_id | int | - | yes | Unique candy identifier | > 0 | 1 |
| color | enum(CandyColor) | - | yes | Visual color category | valid enum | RED |
| base_score | int | 10 | yes | Points per candy matched | 1-100 | 10 |
| sprite_key | string | - | yes | Asset reference | non-empty | candy_red_01 |
| unlock_level | int | 1 | no | Level where this candy appears | >= 1 | 1 |
| weight | float | 1.0 | no | Spawn probability weight | 0.1-10.0 | 1.0 |
```

**Auto-generated CSV (in `configs/candy_types.csv`):**
```csv
candy_id,color,base_score,sprite_key,unlock_level,weight
1,RED,10,candy_red_01,1,1.0
2,BLUE,10,candy_blue_01,1,1.0
3,GREEN,10,candy_green_01,1,1.0
4,YELLOW,15,candy_yellow_01,1,0.9
5,PURPLE,15,candy_purple_01,5,0.8
6,ORANGE,20,candy_orange_01,10,0.7
```

### Schema Freeze

```
Schema generation complete. Ready to freeze?

Freezing locks: table names, field names, types, primary/foreign keys.
Balance stage can still modify: default values, validation ranges, sample data.

  ● Freeze and proceed to balance
  ○ Make adjustments first
> Freeze and proceed to balance

✓ Schema frozen. Structure locked for Stage 3B.
```

---

## Stage 3B: Numerical Balance (`/gf-balance`)

```
/gf-balance
```

The AI reads frozen schema + system 7B inputs and generates all balance values:

**Example output (from `difficulty.md`):**
```markdown
## Difficulty Curve

### Numerical Target Matrix

| Phase | Target Experience | Pass Rate | Retry Rate | Risk |
|-------|-------------------|-----------|------------|------|
| Tutorial (L1-10) | Build confidence | 90-95% | 5-10% | Too easy = boring |
| Establish (L11-30) | Introduce combos | 75-85% | 15-25% | Skip combos |
| Pressure (L31-60) | Create challenge | 55-70% | 30-45% | Frustration spike |
| Monetize (L61+) | Drive ad views | 45-60% | 40-55% | Pay-to-win feel |

### Per-Segment Parameters

| Segment | Pressure Source | Key Param | Range | If Too Hard | If Too Easy |
|---------|----------------|-----------|-------|-------------|-------------|
| L1-5 | None (tutorial) | moves | 25-30 | +5 moves | -3 moves |
| L6-10 | Color count | colors | 4 | Remove color 4 | Add color 5 |
| L11-20 | Obstacles intro | obstacle_hp | 1-2 | -1 HP | +1 HP |
| L21-30 | Move limit | moves | 18-22 | +3 moves | -2 moves |
| L31-45 | Mixed obstacles | obstacle_count | 8-15 | -3 obstacles | +3 obstacles |
| L46-60 | Board size | grid_size | 7×7 | Use 8×8 | Use 7×7 |
```

CSV files in `configs/` are updated in place with real balance values.

---

## Stage 4: Production Specs (`/gf-production`)

```
/gf-production
```

Three specs generated in parallel:

### ART-SPEC.md (excerpt)
```markdown
## C. Asset Master List

| Asset ID | Name | Type | System | States | Priority |
|----------|------|------|--------|--------|----------|
| ART-001 | Red Candy | game_object | SYS-MATCH | idle, matched, falling | P0 |
| ART-002 | Striped Candy | game_object | SYS-COMBO | idle, activating, clearing | P0 |
| ART-003 | Color Bomb | game_object | SYS-COMBO | idle, expanding, exploding | P0 |
| ART-004 | Ice Obstacle | obstacle | SYS-LEVEL | frozen, cracking, breaking | P0 |
| ART-005 | Chapter 1 BG | background | SYS-LEVEL | static | P0 |

## F. Key Feedback Requirements

| Trigger | Visual | Animation Duration | Sound |
|---------|--------|--------------------|-------|
| Match 3 | Candies pop + particles | 0.3s | pop_basic.wav |
| Match 4 (striped) | Row/column flash | 0.5s | streak_clear.wav |
| Cascade combo | Screen shake + multiplier text | 0.2s per step | combo_rise.wav |
| Level complete | Star burst + confetti | 1.5s | victory_fanfare.wav |
```

### UI-SPEC.md (excerpt)
```markdown
## D. Key Pages

### Game Board Page
- Grid: 8×8 centered, 75% screen width
- Score: top-left, large font, combo multiplier animated
- Moves remaining: top-right, turns red at ≤5
- Objectives: top-center, icons with progress bars
- Power-ups: bottom row, 3 slots, cooldown overlay
- Pause: top-right corner, small icon

### Settlement Page (Win)
- Star rating: 1-3 stars with fill animation
- Score breakdown: base + combo bonus + time bonus
- Rewards: animated coin/gem drop
- Next Level button: primary CTA, center
- Watch Ad for 2× Rewards: secondary CTA, below
```

---

## Checking Progress: `/gf-progress`

At any point, run:

```
/gf-progress
```

Output:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GAME FORGE ► Sweet Crush Saga
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Concept ✓] → [Systems ✓] → [Schema ✓] → [Balance ◆] → [Specs ○]

| Stage | Status | Files | Last Updated |
|-------|--------|-------|--------------|
| 1. Concept | ✓ Complete | 15 chapters | Mar 15 |
| 2. Systems | ✓ Complete | 10 systems | Mar 15 |
| 3A. Schema | ✓ Complete | 18 tables + CSV | Mar 15 |
| 3B. Balance | ◆ In Progress | 2/4 docs | Mar 15 |
| 4. Specs | ○ Pending | - | - |
```

---

## Resuming Work: `/gf-resume`

If you close Claude Code and come back later:

```
/gf-resume
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GAME FORGE ► RESUMING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project: Sweet Crush Saga (Puzzle)
Current stage: Balance (Stage 3B) — 2/4 docs complete
Last activity: Mar 15 — completed economy.md

Remaining work:
  ○ monetization.md — commercialization boundaries
  ○ tuning.md — parameter tuning strategies

Continue with /gf-balance to complete Stage 3B.
```

---

## Final Deliverables

When all stages are complete, the developer receives:

```
.gf/
  stages/
    01-concept/          ← 15 chapters defining the game
    02-system-design/    ← 10 system specs with program contracts
      systems/
      CONTENT-RHYTHM.md
    03a-data-schema/     ← 18 table definitions
      tables.md
      relationships.md
      enums.md
      configs/           ← 18 CSV files ready for engine import
        candy_types.csv
        level_config.csv
        special_rules.csv
        ...
    03b-balance/         ← Difficulty + economy + tuning
    04-production/       ← Art/UI/Tech specs
      ART-SPEC.md
      UI-SPEC.md
      TECH-SPEC.md
  traceability/
    id-registry.json     ← Every ID traced from concept to spec
```

A developer can pick up these documents and start building the game without any design meetings.
