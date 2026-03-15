# Quality Gate Criteria -- Concept Stage

The quality reviewer agent loads this file when running the post-completion
quality gate on all concept chapters. The gate produces REVIEW.md listing
what was checked, what was auto-fixed, and what needs user input.

## Auto-Fix Categories (fix without asking user)

These are structural/mechanical issues the quality gate resolves automatically.
Auto-fixes are applied directly to chapter files and logged in REVIEW.md.

### 1. Missing Sections

Fill missing required sections from context of adjacent chapters and genre profile.
If a chapter is missing a section that the template defines as required, generate
it based on the content of related sections in other chapters.

- **Detection:** Compare each chapter's section headings against the required
  sections list for that chapter (from template + genre section variants).
- **Fix:** Generate the missing section using cross-chapter context.
- **Log:** `[auto-fix] ch{N}: Added missing section {section_name} -- inferred from ch{M} context`

### 2. Missing Rule IDs

Assign next sequential `R_N_NN` ID with appropriate data-bearing type to any
key rule statement that lacks an ID.

- **Detection:** Scan for rule-like statements (concrete, implementable requirements)
  that do not have a `> **R_N_NN**` blockquote marker.
- **Fix:** Assign the next available `R_{chapter}_{seq}` ID. Determine
  data-bearing type from rule content analysis (level_config for level parameters,
  constant_config for fixed values, etc.).
- **Log:** `[auto-fix] ch{N}: Assigned R_{N}_{seq} | {type} to rule: "{description}"`

### 3. Inconsistencies Between Chapters

Resolve contradictions using the more specific or more detailed chapter as the
source of truth.

- **Detection:** Compare key facts across chapters -- resource names, mechanic
  descriptions, progression numbers, terminology.
- **Fix:** Update the less-specific chapter to align with the more-specific one.
- **Log:** `[auto-fix] ch{N}/ch{M}: Resolved inconsistency -- "{what}" aligned to ch{source} usage`

### 4. Depth Gaps

Expand shallow sections that fall below the genre depth threshold.

- **Detection:** Word count per chapter compared against minimum depth
  requirement: `depth_multiplier * threshold` where threshold is:
  - Core chapters (3, 5, 6, 7): 800 words
  - Supporting chapters (1, 2, 4, 8): 500 words
  - Specialized chapters (9-15): 400 words
- **Fix:** Expand the shallowest sections using cross-chapter context and
  genre-appropriate detail.
- **Log:** `[auto-fix] ch{N}: Expanded from {old_count} to {new_count} words (minimum: {threshold})`

### 5. Missing Data-Bearing-Type Markers

Assign data-bearing type based on rule content analysis for any rule ID that
has a missing or empty type field.

- **Detection:** Rules with `R_N_NN` ID but no `| {type} |` marker, or type
  field is blank/unrecognized.
- **Fix:** Analyze rule content to determine type:
  - Level parameters, constraints, dimensions -> `level_config`
  - Object properties, attributes -> `object_config`
  - Fixed numeric values, thresholds -> `constant_config`
  - Random events, drop rates, chances -> `probability_config`
  - Progression curves, scaling, experience -> `growth_config`
  - Quests, missions, objectives -> `task_config`
  - Score calculation, rewards, results -> `settlement_config`
  - Non-configurable behavior, hard-coded logic -> `logic_impl`
- **Log:** `[auto-fix] ch{N}: Assigned type {type} to R_{N}_{seq}`

### 6. Missing Frontmatter Fields

Fill missing frontmatter fields from content analysis.

- **Detection:** Compare chapter frontmatter against the required schema
  (chapter, title, status, rule_count, word_count, generated_at, genre_adapted, summary).
- **Fix:** Calculate missing values from chapter content (count rules, count words,
  generate summary from first paragraph and key rules).
- **Log:** `[auto-fix] ch{N}: Filled frontmatter field {field} = {value}`

## Must-Ask Categories (NEVER auto-fill, always ask user)

These are creative decisions that define the game's identity. The quality gate
must NEVER generate content for these topics -- it must present a specific
question to the user and wait for their response.

### 1. Core Gameplay Choice (Chapter 3)

What the player actually does -- the central mechanic, the moment-to-moment
experience, the "verb" of the game.

- **Why never auto-fill:** This is the most fundamental creative decision.
  Getting it wrong means the entire document is wrong.
- **Gate behavior:** If Chapter 3 lacks a clear, concrete core mechanic
  description, flag it and ask: "Chapter 3 does not clearly define what the
  player repeatedly does. Please describe the core action in concrete terms."

### 2. Monetization Model (Chapters 9/10)

How the game makes money -- the balance between ad revenue and IAP, the
specific products offered, the pricing philosophy.

- **Why never auto-fill:** Monetization strategy has massive implications for
  game design, user experience, and business viability. It requires business
  judgment, not pattern-matching.
- **Gate behavior:** If monetization chapters lack concrete product definitions
  or pricing direction, flag and ask: "Monetization strategy is unclear. Please
  specify your primary revenue model and at least 2 specific product/placement
  details."

### 3. Target Audience (Chapter 1)

Who plays this game -- specific demographics, behaviors, needs, and pain points.

- **Why never auto-fill:** Target audience determines every downstream decision.
  An AI-generated audience profile would be generic and potentially misleading.
- **Gate behavior:** If Chapter 1 uses vague terms like "all users" or "casual
  gamers" without behavioral specifics, flag and ask: "Target audience is too
  vague. Please describe at least 2 specific user types with age range, gaming
  experience, and session length preferences."

### 4. Scope Boundaries (Chapter 2)

What the game does NOT include -- the explicit exclusions that prevent scope
creep and clarify the product's identity.

- **Why never auto-fill:** Scope boundaries are strategic decisions that reflect
  the team's capacity, market positioning, and product philosophy.
- **Gate behavior:** If Chapter 2 lacks a "not-included" list, flag and ask:
  "No scope boundaries defined. Please list at least 3 things this game
  explicitly will NOT include."

## Structural Checks

These checks produce warnings but do not auto-fix or block.

### Chapter Presence

- All genre-included chapters must exist as files in `.gf/stages/01-concept/`
- Genre-skipped chapters must NOT exist (or be explicitly marked as skipped)
- Check against the active genre profile's Chapter Inclusion table

### Rule ID Uniqueness

- No duplicate `R_N_NN` IDs across all chapters
- No gaps in sequence numbering within a chapter (warning, not error)
- All rule IDs registered in the concept_entries registry

### Section Completeness

- Each chapter has a "Chapter Goal" section
- Each chapter has a "Must-Answer Questions Addressed" section
- Core chapters (3, 5, 6, 7) have all template-required sections

### Cross-Chapter References

- Resources mentioned in Chapter 4 should appear in Chapters 6 and 8-10
- Mechanics introduced in Chapter 3 should be referenced in Chapters 5, 6, and 7
- Pain points from Chapter 1 should be addressed in Chapters 3 and 7

## Depth Requirements

Per-chapter minimum word counts (before depth_multiplier):

| Category | Chapters | Base Minimum |
|----------|----------|-------------|
| Core | 3, 5, 6, 7 | 800 words |
| Supporting | 1, 2, 4, 8 | 500 words |
| Specialized | 9, 10, 11, 12, 13, 14, 15 | 400 words |

The active genre profile's `depth_multiplier` is applied to these minimums:
- Casual/Puzzle: 1.0x (800/500/400)
- Action/Idle: 1.2x (960/600/480)
- RPG/Strategy: 1.5x (1200/750/600)

## REVIEW.md Output Format

The quality gate produces a REVIEW.md file with this structure:

```markdown
# Quality Review Results

## Summary

- Chapters reviewed: {N} ({M} skipped by genre)
- Rule IDs validated: {N} (unique, sequential, typed)
- Auto-fixes applied: {N}
- User decisions needed: {N}

## Auto-Fixed Issues

- [ch{N}] {description of fix}
- [ch{M}] {description of fix}

## Needs User Decision

- [ch{N}] {question for user}

## Passed Checks

- All chapters present: {OK/FAIL}
- Rule ID uniqueness: {OK/FAIL} ({count} unique IDs)
- Data-bearing-type coverage: {OK/FAIL}
- Minimum depth: {OK/FAIL}
- Section completeness: {OK/FAIL}
- Cross-chapter consistency: {OK/FAIL}
```
