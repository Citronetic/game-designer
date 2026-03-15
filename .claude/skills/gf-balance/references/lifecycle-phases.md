# Lifecycle Phase Definitions

This reference defines the 4 lifecycle phases used in Stage 3B numerical
balance. The balance-generator agent reads this to assign level segments to
phases and to apply genre-appropriate target ranges.

Source: `game-implement-process/stage3/数值配置工作文档模板.md` Section 1
(数值目标矩阵) and Phase 5 CONTEXT.md decisions.

---

## Phase Overview

Every game's content progression is divided into 4 lifecycle phases. Each phase
has a distinct purpose, target experience, and expected player behavior. Phase
boundaries are approximate and adjustable per project -- the defaults below
serve as starting points.

| Phase | Chinese Name | Typical Range | Purpose |
|-------|-------------|---------------|---------|
| Tutorial | 教学期 | Day 1 - Day 2 | Teach core mechanics, build confidence |
| Establishment | 建立期 | Day 3 - Day 4 | Deepen engagement, reveal system depth |
| Pressure | 压力期 | Day 5 - Day 6 | Challenge mastery, create meaningful difficulty |
| Monetization | 回收期 | Day 7+ | Sustain long-term engagement, introduce commercial value |

---

## Phase 1: Tutorial (教学期)

**Purpose:** Teach core mechanics with minimal friction. Players should feel
successful and learn the basic gameplay loop without frustration.

**Typical range:** Day 1 - Day 2 (first 2 days of content rhythm)

**Target experience:** High success rate, gentle introduction of mechanics one
at a time, immediate positive feedback. Players build muscle memory for the core
loop.

**Key risks:**
- Too easy: Players get bored and churn before seeing system depth
- Too complex: Too many mechanics introduced at once overwhelm new players
- No sense of progression: Tutorial feels static rather than building momentum

**Boundary detection signals:**
- Content rhythm shows `new_mechanic` type entries for foundational systems
- Unlock conditions in system designs show "no prerequisites" or "available
  from first launch"
- Section 7 Day 1-2 entries focus on basic interactions

---

## Phase 2: Establishment (建立期)

**Purpose:** Deepen engagement by revealing system interactions and building
player investment. Players transition from learning to mastering the core loop.

**Typical range:** Day 3 - Day 4

**Target experience:** Moderate challenge increase. Players discover system
depth, experience first meaningful choices, and begin to develop personal
strategies. Content introduces variations on learned mechanics.

**Key risks:**
- Difficulty spike: Jump from tutorial ease to establishment challenge is too
  steep, causing churn
- Feature overload: Too many new systems unlock simultaneously
- No strategic depth: Players can brute-force everything without thinking

**Boundary detection signals:**
- Content rhythm transitions from `new_mechanic` to mix of `new_mechanic` and
  `reuse_variation`
- Multiple systems begin interacting (cross-system dependencies activate)
- Section 7 Day 3-4 entries show system combination or deepening

---

## Phase 3: Pressure (压力期)

**Purpose:** Challenge player mastery and create meaningful difficulty that
rewards skill and strategy. This is where the game demonstrates its depth.

**Typical range:** Day 5 - Day 6

**Target experience:** Noticeable difficulty increase. Players must use learned
strategies effectively. Failure becomes a realistic outcome that motivates
improvement. Resource management becomes important.

**Key risks:**
- Wall effect: Difficulty is so high that average players cannot progress
- No remediation: Players who fail have no recovery path
- Grind perception: Progress feels dependent on repetition rather than skill

**Boundary detection signals:**
- Content rhythm shows `reuse_variation` entries with escalation
- Economy constraints begin introducing choke points
- Section 7 Day 5-6 entries focus on challenge and variation

---

## Phase 4: Monetization (回收期)

**Purpose:** Sustain long-term engagement while introducing commercial value
exchange. Players who enjoy the game can invest to enhance their experience;
non-paying players can still progress.

**Typical range:** Day 7+

**Target experience:** Sustained challenge with optional acceleration paths.
Long-term goals become visible. Commercial touchpoints offer convenience or
cosmetic value without gating core progression.

**Key risks:**
- Pay-to-win perception: Monetization provides unfair competitive advantage
- Forced monetization: Progress becomes impossible without paying
- Content drought: No new meaningful content beyond monetization hooks
- Breaking protected parameters: Revenue optimization alters core balance

**Boundary detection signals:**
- Content rhythm shows mature `reuse_variation` patterns
- Commercialization constraints from 7B Category 3 activate
- Section 7 Day 7 entries show endgame or repeatable content

---

## Genre-Specific Target Ranges

Target pass rate and retry rate ranges vary significantly by genre. The
balance-generator agent selects the appropriate genre column based on the
project's genre profile from Stage 1.

### Pass Rate Ranges (first-clear rate)

| Phase | Casual / Puzzle | Action / Idle | RPG / Strategy |
|-------|----------------|---------------|----------------|
| Tutorial | 85% - 95% | 80% - 90% | 70% - 85% |
| Establishment | 70% - 80% | 65% - 75% | 55% - 70% |
| Pressure | 55% - 65% | 50% - 60% | 35% - 50% |
| Monetization | 45% - 55% | 40% - 50% | 25% - 40% |

### Retry Rate Ranges (percentage of players who retry after failure)

| Phase | Casual / Puzzle | Action / Idle | RPG / Strategy |
|-------|----------------|---------------|----------------|
| Tutorial | 5% - 15% | 10% - 20% | 15% - 30% |
| Establishment | 15% - 30% | 20% - 35% | 25% - 45% |
| Pressure | 25% - 45% | 30% - 50% | 40% - 60% |
| Monetization | 30% - 50% | 35% - 55% | 45% - 65% |

### Genre Selection Guide

| Genre Profile | Use Column | Rationale |
|--------------|------------|-----------|
| Casual, Puzzle, Match-3 | Casual / Puzzle | Broad audience, low friction tolerance |
| Action, Idle, Clicker, Arcade | Action / Idle | Moderate skill ceiling, session-based |
| RPG, Strategy, Simulation, Roguelike | RPG / Strategy | High depth, invested audience tolerates difficulty |

**Note:** These are default ranges. The balance-generator agent should adjust
within +/- 5 percentage points based on specific 7B inputs from system designs.
If a game explicitly targets hardcore players within a casual genre, use the
next-harder column.

---

## Boundary Adjustment Rules

Phase boundaries are defaults that can be adjusted per project. When adjusting:

1. **Never overlap phases** -- Each content segment belongs to exactly one phase
2. **Maintain monotonicity** -- Pass rates must decrease or stay flat across
   phases (Tutorial >= Establishment >= Pressure >= Monetization). A small
   recovery dip (<= 10 percentage points) between adjacent segments within a
   phase is acceptable.
3. **Respect content rhythm** -- Phase boundaries should align with natural
   content transitions visible in system design Section 7
4. **Document adjustments** -- Any deviation from default ranges must be noted
   in difficulty.md with rationale

---

*Reference for: balance-generator agent (gf-balance-generator.md)*
*Source: game-implement-process/stage3/数值配置工作文档模板.md Section 1*
