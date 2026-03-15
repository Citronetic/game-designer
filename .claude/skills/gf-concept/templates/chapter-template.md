# Chapter Output Template

This template defines the standard output format for generated concept chapters.
The concept interviewer agent uses this structure when writing each chapter file
to `.gf/stages/01-concept/`.

## Frontmatter Schema

Every chapter file must begin with YAML frontmatter containing these fields:

```yaml
---
chapter: {N}                    # Chapter number (1-15)
title: "{Chapter Title}"        # Chapter title from CHAPTER_MAP
status: complete                # complete | draft | review
rule_count: {N}                 # Number of R_N_NN rules in this chapter
word_count: {N}                 # Approximate word count of body content
generated_at: "{ISO timestamp}" # When this chapter was generated
genre_adapted: {true|false}     # Whether genre profile modifications were applied
summary: "{1-2 sentence summary for cross-chapter context}"
---
```

The `summary` field is critical -- it provides compressed context that the
orchestrator carries forward to subsequent chapter generation sessions.

## Body Structure

```markdown
# Chapter {N}: {Title}

## Chapter Goal

{1-2 sentences: what this chapter answers, adapted from the source template's
"本章目标" section. Written in the user's configured language.}

## {Section N.1}: {Section Title}

{Section content with concrete rules, not abstract statements.
Every key rule must have an inline rule ID and data-bearing type:}

> **R_{N}_{seq}** | {data_bearing_type} | {Rule description}. [{priority}]

{Continue with detailed content for this section...}

## {Section N.2}: {Section Title}

{Next section content...}

...{Continue for all required sections in this chapter}...

## Must-Answer Questions Addressed

1. {Question from chapter-questions.md} -> {Where/how answered in this chapter}
2. {Question} -> {Reference to section}
3. {Question} -> {Reference to section}
...
```

## Rule ID Format

Rules are embedded inline using blockquote format:

```markdown
> **R_3_01** | level_config | Merge requires same-tier adjacency. Tier range: 1-12. [P0]
```

Components:
- `R_{chapter}_{sequence}`: Unique ID within the concept stage
- `{data_bearing_type}`: One of the 8 types (level_config, object_config,
  constant_config, probability_config, growth_config, task_config,
  settlement_config, logic_impl)
- `{description}`: Concrete, implementable rule statement
- `[{priority}]`: P0 (must have), P1 (should have), P2 (nice to have)

## Section Depth Guidelines

Section depth varies by chapter importance and genre:

- **Core chapters** (3, 5, 6, 7): minimum `depth_multiplier * 800` words
- **Supporting chapters** (1, 2, 4, 8): minimum `depth_multiplier * 500` words
- **Specialized chapters** (9-15): minimum `depth_multiplier * 400` words

The `depth_multiplier` comes from the active genre profile (1.0 for casual/puzzle,
1.2 for action/idle, 1.5 for RPG/strategy).

## Language

All chapter body content (headings, descriptions, rules, questions) is generated
in the user's configured language (from `.gf/config.json`). Data-bearing type
keys always use English identifiers regardless of language setting.

## Example

```markdown
---
chapter: 3
title: "Core Gameplay"
status: complete
rule_count: 8
word_count: 1247
generated_at: "2026-03-15T10:30:00Z"
genre_adapted: true
summary: "Tap-and-merge puzzle with 12-tier object system, 6x6 grid, and combo chains as primary satisfaction loop."
---

# Chapter 3: Core Gameplay

## Chapter Goal

Explain what the player actually does, why it is fun, and how a single
session works from start to finish.

## 3.1 Core Operations

The primary player action is **tap-and-merge**: the player taps two adjacent
objects to combine them into a higher-tier object.

- **Input:** Single tap on object A, then tap on adjacent object B
- **Trigger:** Both objects are same tier and adjacent
- **Success:** Objects merge, tier+1 object appears, score increases
- **Failure:** Objects not same tier -- gentle shake animation, no penalty

> **R_3_01** | level_config | Merge requires same-tier + adjacency. Tier range: 1-12. [P0]

> **R_3_02** | constant_config | Maximum grid size: 6x6. Minimum: 4x4. [P1]

## 3.2 Basic Rules

...

## Must-Answer Questions Addressed

1. What does the player repeatedly do? -> Tap-and-merge adjacent same-tier objects (Section 3.1)
2. Complete single-session flow? -> See Section 3.3
3. When does the player make decisions? -> See Section 3.2
4. Why does the player fail, and why retry? -> See Section 3.5
5. When does the core "fun moment" first appear? -> See Section 3.6
6. How does this differ from competitors? -> See Section 3.6
```
