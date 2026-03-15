---
stage: 04-production
spec_type: art
systems_covered: []  # filled by agent
total_assets: 0       # filled by agent
status: draft
---

# Art Requirement Specification

<!-- ART-SPEC output template for the art-spec-generator agent.
     Adapted from game-implement-process/stage4/系统提示词_美术需求文档.md
     All section headings and column names in English.
     Genre-agnostic: asset types and entity names are configurable per game.
     Output language follows the project's LANGUAGE config; structure/field names stay in English.
-->

## A. Input Confirmation and Scope

<!-- Source: System design file paths and version info from .gf/stages/02-system-design/.
     List every system ID whose art requirements are covered in this spec.
     Cross-reference the id-registry.json for valid system IDs. -->

- **Stage 2 path:**
- **Stage 2 version:**
- **Stage 3A reference (if applicable):**
- **Systems covered:**

| System ID | System Name | Coverage |
|-----------|-------------|----------|
| | | Full / Partial |

- **Out-of-scope systems and reasons:**

---

## B. Art Targets and Style Boundaries

<!-- Source: Stage 2 concept document and system design overviews.
     Define the visual identity without hardcoding game-specific entity types.
     Use configurable terms (e.g., "primary entities" instead of "monsters"). -->

- **Core style keywords** (3--5):
- **Art direction principles:**
- **Target audience visual preferences:**
- **Style boundaries** (explicitly NOT doing):
- **Risk items** (areas prone to style drift):

---

## C. Asset Master List

<!-- Source: Section 8 art anchors from each system design file.
     This is the core deliverable. Every asset must trace to a system ID.
     Asset types are configurable -- adapt the type list to the game's genre.
     Typical types include: characters, opponents, environment objects,
     scene/theme elements, UI icons/graphics, effects, animations. -->

| Asset ID | System ID | Asset Name | Asset Type | Usage Scene | States Required | Priority | Notes |
|----------|-----------|------------|------------|-------------|-----------------|----------|-------|
| | | | | | | P0/P1/P2 | |

**Asset type definitions for this project:**

| Asset Type | Description | Examples |
|------------|-------------|----------|
| | | |

---

## D. Asset State and Spec Definitions

<!-- Source: Section 8 art anchors and core gameplay rules from each system design.
     Define per-asset-type state specifications.
     Keep required fields (states, resolution, animation); make state names flexible. -->

### Per-Asset-Type Specifications

**[Asset Type Name]:**

- **State set:** (e.g., idle, active, disabled, highlighted)
- **Resolution and proportion standard:**
- **Animation frame requirements:**
  - Frame count range:
  - Duration range (ms):
- **Visual identification rules:** (color, silhouette, contrast)
- **Swappable layers:** (theme slots, skin slots)

<!-- Repeat for each asset type defined in Section C. -->

---

## E. Chapter and Content Phase Needs

<!-- Source: Content rhythm from Stage 2 system designs (Day1-Day7 or chapter structure).
     Map new visual additions to the content progression timeline.
     Cross-reference the content rhythm document if available. -->

| Phase | New Visual Additions | Reuse Strategy | Theme Switch Minimum Change Unit | Anti-Repetition Notes |
|-------|---------------------|----------------|----------------------------------|-----------------------|
| Day 1--2 (Tutorial) | | | | |
| Day 3--4 (Establishment) | | | | |
| Day 5--6 (Pressure) | | | | |
| Day 7+ (Monetization) | | | | |

---

## F. Key Feedback Needs

<!-- Source: Core gameplay feedback points from each system design (Section 5-6).
     Map visual feedback to system-defined feedback moments.
     Do NOT hardcode specific game actions -- reference system feedback points. -->

| Feedback Point | System ID | Trigger Timing | Visual Expression | Animation Layer | Audio Sync Requirements |
|----------------|-----------|----------------|-------------------|-----------------|------------------------|
| Success feedback | | | | | |
| Failure feedback | | | | | |
| Pressure point feedback | | | | | |
| Reward receipt feedback | | | | | |
| Ad reward feedback | | | | | |

<!-- Add additional feedback points as defined by the game's systems. -->

---

## G. UI-Related Art Asset Handoff

<!-- Source: Cross-reference with UI-SPEC.md for consistency.
     List all art assets that must be delivered to the UI/UX team.
     This section ensures art and UI specs align on shared assets. -->

### Button States

| Button Type | Normal | Pressed | Disabled | Highlighted |
|-------------|--------|---------|----------|-------------|
| | | | | |

### Popup Backdrops and Component Skins

| Component | Asset Description | Variants |
|-----------|-------------------|----------|
| | | |

### Icon Library

| Icon Category | Icon List | Size Spec |
|---------------|-----------|-----------|
| Resources | | |
| Tasks/Missions | | |
| Store/Shop | | |
| Ad placements | | |

### Font and Typography

- **Primary font:**
- **Heading sizes:**
- **Body sizes:**
- **Hierarchy levels:**

---

## H. Technical Implementation Constraints

<!-- Source: Engine/platform requirements. Keep as-is -- critical for integration.
     These constraints are typically consistent across game types. -->

- **Atlas/spritesheet strategy:**
  - Maximum atlas size:
  - Packing algorithm:
  - Separation rules (static vs animated, UI vs gameplay):
- **Transparency channel standard:**
- **Naming conventions:**
  - File naming pattern:
  - Directory structure:
- **Animation slice and export format:**
  - Spine / sprite sheet / Lottie / other:
  - Frame export format:
- **Compression settings:**
  - PNG compression level:
  - JPEG quality (if applicable):
- **Performance constraints (low-end devices):**
  - Maximum draw calls per scene:
  - Maximum texture memory:
  - Minimum target FPS:

---

## I. Production Schedule and Priority

<!-- Source: Priority levels from asset master list (Section C).
     Organize into P0/P1/P2 tiers with dependencies and milestones. -->

### P0 -- First Build Must-Have

| Asset ID | Asset Name | Estimated Effort | Dependencies | Risk |
|----------|------------|------------------|--------------|------|
| | | | | |

**P0 coverage requirement:** Must support core loop entry, core interaction, result settlement, and reward receipt.

### P1 -- First-Week Content Support

| Asset ID | Asset Name | Estimated Effort | Dependencies | Risk |
|----------|------------|------------------|--------------|------|
| | | | | |

### P2 -- Future Expansion

| Asset ID | Asset Name | Estimated Effort | Dependencies | Risk |
|----------|------------|------------------|--------------|------|
| | | | | |

**Milestone summary:**

| Milestone | Asset Count | Estimated Duration | Key Dependencies |
|-----------|------------|-------------------|-----------------|
| P0 complete | | | |
| P1 complete | | | |
| P2 complete | | | |

---

## J. Acceptance and Quality Standards

<!-- Source: Derive from asset types and project quality expectations.
     Each asset type needs specific acceptance criteria. -->

| Asset Type | Visual Fidelity | Animation Smoothness | State Completeness | Device Performance | Gameplay Consistency |
|------------|-----------------|----------------------|--------------------|--------------------|---------------------|
| | Pass criteria | Pass criteria | Pass criteria | Pass criteria | Pass criteria |

### Per-Asset Acceptance Checklist

- [ ] Readability at target resolution
- [ ] Functional correctness (states match system design)
- [ ] State completeness (all required states present)
- [ ] Device performance (meets low-end constraints from Section H)
- [ ] Gameplay consistency (visual behavior matches system rules)

---

## K. Blockers and Open Questions

<!-- List any issues that block art production or require resolution.
     Separate blocking issues from items that can proceed in parallel. -->

### Blockers (Block Production)

| ID | Description | Blocking | Owner | Status |
|----|-------------|----------|-------|--------|
| | | [which assets/sections] | | Open |

### Open Questions (Can Proceed in Parallel)

| ID | Question | Impact | Proposed Resolution |
|----|----------|--------|---------------------|
| | | | |

---

*Spec type: art | Generated by: art-spec-generator agent*
*Source: Adapted from game-implement-process/stage4/系统提示词_美术需求文档.md*
