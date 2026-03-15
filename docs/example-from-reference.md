# Example Walkthrough: From Ad Video to Full Game Design

This walkthrough demonstrates the **reference path** — starting from a game ad video and turning it into a complete game design. Instead of describing an original idea, you describe what you saw in a video, and the AI reverse-engineers the concept and expands it into a full product.

> **This is the workflow the original `game-implement-process` was designed for:** turning a 30-second hyper-casual ad into a "playable for one week" complete game.

---

## Prerequisites

Same as the [scratch path example](example-walkthrough.md#prerequisites) — install Game Forge, open your project in Claude Code or OpenCode.

---

## The Reference: A Hyper-Casual Ad Video

Imagine you saw a 30-second Instagram ad for a game like this:

> **What the ad shows:**
> A player draws a line on screen to guide a ball through obstacles.
> The ball rolls along the drawn path, collecting coins and avoiding
> spikes. When the ball reaches the end, coins explode out with a
> satisfying "cha-ching" sound. Then a "LEVEL 2" screen appears with
> a more complex obstacle layout. The whole thing looks simple,
> one-finger, oddly satisfying.

You want to build a game inspired by this concept, but expanded into a full product.

---

## Stage 0: Create Project with Reference Path

```
/gf-new-game
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GAME FORGE ► NEW PROJECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Project Name:** `Line Runner`

**Language:** `English`

**Genre:** `Casual`

**Entry Path:**
```
Starting from scratch or from a reference game?
  ○ From scratch — I'll describe my idea
  ● From reference — I'll describe an existing game
> From reference
```

Choosing "From reference" tells the AI to expect a game description rather than an original concept.

---

## Stage 1: Concept from Reference (`/gf-concept`)

### Session 1: Describing the Video

```
/gf-concept
```

Because you chose the reference path, the AI asks differently:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GAME FORGE ► CONCEPT — Session 1/5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You're starting from a reference. Describe what you saw —
an ad, a game you played, a competitor's product. Include
as much detail as you can: what happened on screen, what
the player did, what felt good or bad.
```

**Your input:**
```
I saw a 30-second ad on Instagram. Here's what I observed:

VISUALS: Clean, minimal art style. Bright colors on a white/pastel
background. The ball is neon-colored and leaves a glowing trail.

GAMEPLAY: The player draws a line/path on screen with their finger.
A ball then rolls along that path from a start point. The path goes
over gaps, around spike obstacles, through coin clusters. The ball
follows the exact path you drew — physics-based rolling.

SATISFACTION: When the ball hits coins, they burst with particles
and a "ding" sound. When you reach the goal, a big coin explosion
with screen shake. Very satisfying audio-visual feedback.

FAILURE: If the ball hits a spike or falls off the path, it pops
with a "splat" and you restart the level. Quick restart, no penalty.

LEVEL STRUCTURE: Looked like short levels (10-15 seconds each).
After completing a level, "LEVEL 2" appears with a harder layout.

MONETIZATION: I saw an "x2 COINS" button after level completion
with a play icon (rewarded video ad). Also a banner ad at the bottom
during gameplay.
```

**AI analyzes the reference and proposes Chapter 1:**

```
Great reference. Let me break down what I see:

CORE MECHANIC: Draw-to-guide physics puzzler
GENRE: Hyper-casual, ad-monetized, single-session
HOOK: "Draw a path → watch ball roll → satisfying result"
RETENTION DRIVER: Quick levels + optimization urge ("better path")

Before I draft Chapter 1, I want to understand your ambitions:

1. How far do you want to expand beyond the ad?
   I recommend: Keep the draw-to-guide core, but add a meta-layer
   (unlock ball skins, themed chapters, daily challenges) to extend
   from "play 5 minutes" to "play for a week."
   Agree, or stay closer to the hyper-casual original?

2. Target user — the ad targets ultra-casual players (anyone with
   a phone, zero gaming experience needed). Keep that, or shift
   toward light-core gamers who want more depth?

3. Monetization priority — the ad shows rewarded video + banner.
   Keep this mix, or lean harder into one? I recommend:
   Primary: rewarded video (2× coins, extra lives, power-ups)
   Secondary: interstitial between levels (every 3-4 levels)
   Tertiary: remove-ads IAP ($2.99)
```

**You respond:**
```
1. Yes, expand it — I want the meta-layer with unlocks and chapters.
2. Keep ultra-casual, but add enough depth for a week of play.
3. Agree with your monetization recommendation.
```

**AI generates Chapter 1 with pre-filled sections from the reference:**

```markdown
# Chapter 1: Target Users & Scenarios

## 1.1 Target User Profile

**R_1_01** | config: user_profile
Primary user: 18-45, all genders, ultra-casual mobile gamers.
Zero gaming experience required. The draw mechanic is intuitive —
anyone who can use a touchscreen can play.

> **From reference:** The ad's visual language (bright, clean, minimal)
> targets the broadest possible audience. No text-heavy UI, no complex
> controls, no genre-specific knowledge needed.

**R_1_02** | config: session_params
Session length: 2-10 minutes (3-8 levels per session).
Instant start — no loading screen, no login, no tutorial menu.
Player draws on the first level within 3 seconds of opening the app.

> **From reference:** The ad showed immediate gameplay — no menus,
> no story setup, no character selection. The first touch IS the game.
```

Notice how each section includes a **"From reference"** annotation explaining what was inferred from the video description. The user can confirm or override these inferences.

### Session 2-5: Expanding Beyond the Ad

This is where the AI adds value — expanding a 30-second concept into a full game:

**Chapter 3 (Core Gameplay) — AI expands the draw mechanic:**

```
Chapter 3: Core Gameplay

The ad showed basic draw-and-roll. To sustain a week of play,
I recommend expanding the mechanic in 3 dimensions:

1. PATH TOOLS (unlockable):
   - Basic draw (free-hand line) — available from start
   - Straight line tool — unlock at Level 10
   - Curve tool (bezier) — unlock at Level 20
   - Eraser (partial redraw) — unlock at Level 30

2. OBSTACLE VARIETY (chapter-based):
   - Chapter 1: Static spikes, gaps
   - Chapter 2: Moving platforms, timing gates
   - Chapter 3: Gravity zones (ball rolls uphill/downhill)
   - Chapter 4: Portals (teleport ball between points)
   - Chapter 5: Multi-ball splits

3. SCORING DEPTH:
   - Shorter path = more stars (efficiency bonus)
   - Coin collection along path
   - Time bonus (draw + roll within time limit)
   - "Perfect path" bonus (no redraw, no wall touches)

> **From reference:** The ad only showed basic draw + coins + spikes.
> These expansions maintain the same "draw and watch" satisfaction
> while adding enough variety for 100+ levels.

Agree with these expansions, or adjust?
```

**Chapter 5 (Levels & Content) — AI proposes content pipeline:**

```
Chapter 5: Levels & Content

Based on the reference's level structure (10-15 sec per level),
I recommend this content plan:

LEVEL COUNT: 150 levels across 5 chapters (30 per chapter)
PRODUCTION METHOD: Template-based with manual tuning

Each level is defined by:
- Start point + end point positions
- Obstacle layout (grid-based placement)
- Coin positions along optimal path
- Star thresholds (3-star = shortest path, 2-star = medium, 1-star = long)

The template system means we can produce 30 levels per day
once the tooling is in place. Obstacle combinations create
variety without new art assets.

> **From reference:** The ad showed simple level layouts that
> are cheap to produce. This scales well — no hand-drawn levels,
> no narrative sequences, no cutscenes. Pure mechanic + layout.

**R_5_01** | config: level_config
Level data: start_pos, end_pos, obstacles[], coins[], star_thresholds
```

### Quality Gate (Same as Scratch Path)

The quality gate runs after all chapters, auto-fixing gaps and asking about creative decisions. The reference path has one additional check:

```
Reference consistency check:
  ✓ All reference observations accounted for in chapters
  ✓ Expansions beyond reference are clearly marked
  ✓ Core mechanic preserved (draw-to-guide)
  ⚠ Reference showed banner ad during gameplay — Ch09 moved it
    to between levels instead. This is intentional? (yes/no)
```

---

## Stage 2-4: Same Flow, Reference-Aware

The remaining stages follow the same process as the [scratch path example](example-walkthrough.md), with one key difference: the AI references the original video observations when making design decisions.

**System Design example:**
```markdown
# SYS-DRAW — Drawing Engine

## 4.5 Core Rules

RULE-DRAW-001: Player draws path by touching and dragging on screen
> From reference: Single continuous stroke, not tap-to-place points

RULE-DRAW-002: Path has minimum segment length (prevents dots)
> From reference: Ad showed smooth curves, not jagged short segments

RULE-DRAW-003: Path cannot cross itself
> Design decision: Not visible in reference, but prevents exploit paths

RULE-DRAW-004: Path collision with obstacles invalidates that segment
> Design decision: Reference didn't show this — prevents drawing through walls
```

**Data Schema example:**
```markdown
### level_config

| Field | Type | Default | Required | Meaning | Example |
|-------|------|---------|----------|---------|---------|
| level_id | int | - | yes | Level number | 1 |
| chapter_id | int | 1 | yes | Which chapter | 1 |
| start_x | float | - | yes | Ball start X | 0.1 |
| start_y | float | - | yes | Ball start Y | 0.9 |
| end_x | float | - | yes | Goal X | 0.9 |
| end_y | float | - | yes | Goal Y | 0.1 |
| obstacles | string | "" | no | JSON array of obstacle specs | [{"type":"spike","x":0.5,"y":0.5}] |
| coins | string | "" | no | JSON array of coin positions | [{"x":0.3,"y":0.7}] |
| star_3_length | float | - | yes | Max path length for 3 stars | 2.5 |
| star_2_length | float | - | yes | Max path length for 2 stars | 4.0 |
| time_limit | int | 30 | no | Seconds to draw + complete | 30 |
```

---

## Key Differences: Reference Path vs Scratch Path

| Aspect | From Scratch | From Reference |
|--------|-------------|----------------|
| First question | "Tell me about your game idea" | "Describe what you saw" |
| Chapter pre-fill | Empty — AI asks everything | AI infers sections from reference, user confirms |
| Annotations | None | "From reference:" notes throughout |
| Expansion prompts | "What features?" | "How far beyond the reference?" |
| Quality gate | Standard checks | + Reference consistency check |
| System design | Pure co-creation | Reference observations inform rule origins |
| Traceability | Concept rules → systems | Reference observations → concept rules → systems |

## When to Use the Reference Path

- You saw a game ad and want to build something similar but better
- You played a competitor's game and want to differentiate
- You have a game reference video from a client or stakeholder
- You want to "clone and improve" an existing concept
- You want to validate whether an observed mechanic can sustain a full product

## Tips for Describing Video References

The more detail you provide, the better the AI can pre-fill chapters:

**Good description (AI can pre-fill most of Chapter 1-3):**
```
The player taps to jump. Double-tap for double jump. There are
platforms at different heights with coins floating above them.
Missing a platform drops you to a lower track (not death). Every
10 platforms, a checkpoint flag appears. Art style is pixel art
with parallax scrolling backgrounds. I saw a "WATCH AD FOR
CHECKPOINT" button after dying.
```

**Weak description (AI has to ask many questions):**
```
It's a jumping game with coins. Looked fun and simple.
```

The reference path works best when you can describe:
1. **What the player does** (input method, core action)
2. **What happens on screen** (visual feedback, success/failure)
3. **How levels work** (structure, progression, difficulty)
4. **How money is made** (ad placements, IAP offers)
5. **What it looks/sounds like** (art style, audio feedback)
