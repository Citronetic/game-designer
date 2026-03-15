# Cross-System Consistency Checks

This reference defines the 4 mandatory cross-system consistency checks that
the quality reviewer agent runs after all system designs are complete. These
checks validate that systems work together correctly -- individual system
quality is checked separately via quality-criteria.md.

Source: Adapted from `game-implement-process/stage2/完整系统设计执行规范.md`
Section 6 (cross-system consistency rules) and CONTEXT.md locked decisions.

---

## Check 1: Economy Balance

**Purpose:** Verify that resource production matches consumption across all
systems. No system should produce a resource that no other system consumes,
and no system should consume a resource that no system produces.

**What it validates:**
- Section 7B Category 4 (Economy Constraints) from each system file
- Section 8A (Data Anchors) for resource-related tables
- Section 5 (Core Rules) for rules that produce or consume resources

**Detection pattern:**
The check scans for explicit resource production/consumption markers in
each system's 7B economy constraints section. Text markers used:
- Production: Look for "Resources produced" or "resource sources" entries
- Consumption: Look for "Resources consumed" or "resource sinks" entries

For each unique resource name found across all systems:
1. Count systems that produce it
2. Count systems that consume it
3. Flag if produced but never consumed (surplus leak)
4. Flag if consumed but never produced (drought guaranteed)

**Example violation:**
```
ECONOMY BALANCE ISSUE:
- Resource "gold" is produced by SYS-SETTLEMENT-001 (Section 7B.4)
  but no system defines gold consumption.
- Resource "gems" is consumed by SYS-SHOP-001 (Section 7B.4)
  but no system defines gem production outside of IAP.
```

**Example clean result:**
```
ECONOMY BALANCE: PASS
- "gold": produced by [SYS-SETTLEMENT-001, SYS-TASK-001],
  consumed by [SYS-GROWTH-001, SYS-SHOP-001]
- "energy": produced by [SYS-REWARD-001],
  consumed by [SYS-CORE_GAMEPLAY-001]
- All resources balanced.
```

---

## Check 2: Task References

**Purpose:** Verify that tasks in Section 3 (Entry & Triggers) only reference
content from systems that unlock at the same time or earlier. A Day 1 task
cannot require completing content that unlocks on Day 3.

**What it validates:**
- Section 3 (Entry & Triggers) -- unlock conditions and first encounter timing
- Section 7 (Day1-Day7) -- when each system introduces content
- Cross-referencing unlock timing between dependent systems

**Detection pattern:**
1. Build an unlock timeline: for each system, extract "First encounter" from
   Section 3 (Day N / Level N)
2. For each system's unlock conditions in Section 3, extract referenced systems
3. Check: if System A requires System B as unlock condition, System B's first
   encounter must be <= System A's first encounter

Also check within Day1-Day7 tables:
- If a system's Day N entry references content from another system, that other
  system must have introduced that content on Day N or earlier

**Example violation:**
```
TASK REFERENCE ISSUE:
- SYS-DAILY_TASK-001 unlocks on Day 1, but its unlock condition references
  "complete 3 levels" from SYS-LEVEL-001 which introduces level system on
  Day 2.
- SYS-GROWTH-001 Day 3 entry references "combo chain mastery" but
  SYS-CORE_GAMEPLAY-001 introduces combo chains on Day 4.
```

**Example clean result:**
```
TASK REFERENCES: PASS
- SYS-DAILY_TASK-001 (Day 1) -> SYS-CORE_GAMEPLAY-001 (Day 1): OK
- SYS-GROWTH-001 (Day 2) -> SYS-SETTLEMENT-001 (Day 1): OK
- SYS-SHOP-001 (Day 3) -> SYS-REWARD-001 (Day 2): OK
- All task references point to already-unlocked content.
```

---

## Check 3: Tutorial Coverage

**Purpose:** Verify that every core rule (Section 5) that is tested or
evaluated (appears in acceptance criteria or difficulty mechanics) is first
taught (appears in onboarding or early Day1-Day2 content).

**What it validates:**
- Section 5 (Core Rules) -- especially P0 rules
- Section 7 (Day1-Day7) -- when mechanics are introduced
- Section 3 (Entry & Triggers) -- first encounter timing
- Cross-referencing with onboarding/tutorial system if it exists

**Detection pattern:**
1. Collect all P0 rules from all systems
2. For each P0 rule, find when it first appears in a Day1-Day7 table
   (the "introduction day")
3. Check if that rule is evaluated/tested in any other system on the same
   day or earlier (the "test day")
4. Flag if test_day <= introduction_day (rule tested before taught)

Special case: if a dedicated onboarding/tutorial system exists
(SYS-ONBOARDING-* or SYS-TUTORIAL-*), its Day1-Day2 content serves as
the "taught" baseline. Any P0 rule NOT covered in onboarding Day1-Day2
is flagged as a potential gap.

**Example violation:**
```
TUTORIAL COVERAGE ISSUE:
- RULE-CORE_GAMEPLAY-003 (combo chain mechanic) is tested in
  SYS-SETTLEMENT-001 acceptance criteria on Day 1, but combo chains
  are first introduced by SYS-CORE_GAMEPLAY-001 on Day 3.
- RULE-LEVEL-002 (obstacle tiles) appears in SYS-DAILY_TASK-001 Day 2
  tasks, but obstacles are introduced by SYS-LEVEL-001 on Day 5.
```

**Example clean result:**
```
TUTORIAL COVERAGE: PASS
- RULE-CORE_GAMEPLAY-001 (basic merge): taught Day 1, first tested Day 1: OK
- RULE-CORE_GAMEPLAY-003 (combo chain): taught Day 3, first tested Day 4: OK
- RULE-LEVEL-002 (obstacle tiles): taught Day 5, first tested Day 5: OK
- All P0 rules are taught before being tested.
```

---

## Check 4: Monetization Conflicts

**Purpose:** Verify that there are no contradictions between ad-based and
premium/IAP-based systems. A system promising "no ads during gameplay" must
not coexist with another system that defines mid-level ad breaks.

**What it validates:**
- Section 7B Category 3 (Commercialization Constraints) from each system
- Section 5 (Core Rules) related to monetization
- Cross-referencing ad systems with premium/shop systems

**Detection pattern:**
The check scans for explicit monetization markers in each system's content:
- Ad placements: Look for "Ad placements" or "ad intervention" entries in
  7B.3 and Section 5 rules
- Premium removes: Look for "Premium removes" or "premium benefits" entries
  in 7B.3 and Section 5 rules

Then cross-reference:
1. If any system defines "no ads during {context}", check that no other
   system defines ad placements within that same context
2. If any system promises "premium removes ads in {context}", verify that
   the corresponding ad system actually has ads in that context (otherwise
   the premium benefit is meaningless)
3. Check for value conflicts: free-path rewards from one system should not
   undermine paid products in another system

**Example violation:**
```
MONETIZATION CONFLICT:
- SYS-CORE_GAMEPLAY-001 Section 7B.3 states "no ads during active gameplay"
  but SYS-AD-001 RULE-AD-003 defines "show interstitial ad after every 3rd
  merge combo" which fires during active gameplay.
- SYS-SHOP-001 sells "ad-free gameplay pass" but SYS-AD-001 has no ad
  placements during gameplay -- the product has no value.
```

**Example clean result:**
```
MONETIZATION CONFLICTS: PASS
- SYS-CORE_GAMEPLAY-001 "no ads during active merge" compatible with
  SYS-AD-001 ads only at level-end interstitials.
- SYS-SHOP-001 "ad-free pass" removes SYS-AD-001 level-end interstitials:
  product has clear value.
- No contradictions found.
```

---

## Running the Checks

The quality reviewer agent runs all 4 checks as part of the quality gate.
The checks are also available as CLI commands:

```bash
# Run all 4 consistency checks
gf-tools.cjs system-design consistency-check --dir .

# Output is structured JSON with pass/fail per check and issue details
```

The checks accept parsed `{id, body}` objects for testability (no file I/O
in the check functions themselves -- the CLI layer handles file reading).

## Check Execution Order

1. Economy Balance -- run first (most fundamental)
2. Task References -- run second (depends on unlock timeline)
3. Tutorial Coverage -- run third (depends on rule mapping)
4. Monetization Conflicts -- run last (most specialized)

If any check produces FAIL results, they are listed in REVIEW.md under
"Cross-System Check Results". FAILs do not block the quality gate from
completing, but they are highlighted for user attention.

## Severity Levels

| Severity | Meaning | Action |
|----------|---------|--------|
| ERROR | Contradiction that will cause gameplay bugs | Must fix before Stage 3 |
| WARNING | Potential issue that may cause confusion | Should fix, but not blocking |
| INFO | Observation for user awareness | No action required |

Economy balance issues are typically ERROR (resource drought).
Task reference issues are typically ERROR (impossible tasks).
Tutorial coverage issues are typically WARNING (learnable from context).
Monetization conflicts are typically ERROR (contradictory promises).
