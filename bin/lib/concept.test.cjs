/**
 * Tests for concept module -- chapter mapping, rule ID validation,
 * data-bearing type validation, genre filtering, chapter status tracking
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('concept module', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-concept-test-'));
    fs.mkdirSync(path.join(tmpDir, '.gf'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('module loads without error', () => {
    const concept = require('./concept.cjs');
    assert.ok(concept);
  });

  // ---- CHAPTER_MAP --------------------------------------------------------

  describe('CHAPTER_MAP', () => {
    it('contains exactly 15 entries', () => {
      const { CHAPTER_MAP } = require('./concept.cjs');
      assert.ok(Array.isArray(CHAPTER_MAP));
      assert.strictEqual(CHAPTER_MAP.length, 15);
    });

    it('each entry has num, slug, and titleKey', () => {
      const { CHAPTER_MAP } = require('./concept.cjs');
      for (const entry of CHAPTER_MAP) {
        assert.ok(typeof entry.num === 'number', `num should be number, got ${typeof entry.num}`);
        assert.ok(typeof entry.slug === 'string', `slug should be string, got ${typeof entry.slug}`);
        assert.ok(typeof entry.titleKey === 'string', `titleKey should be string, got ${typeof entry.titleKey}`);
      }
    });

    it('chapter numbers run from 1 to 15', () => {
      const { CHAPTER_MAP } = require('./concept.cjs');
      const nums = CHAPTER_MAP.map(e => e.num);
      for (let i = 1; i <= 15; i++) {
        assert.ok(nums.includes(i), `Missing chapter number ${i}`);
      }
    });

    it('slugs match expected format chNN-name', () => {
      const { CHAPTER_MAP } = require('./concept.cjs');
      for (const entry of CHAPTER_MAP) {
        const padded = String(entry.num).padStart(2, '0');
        assert.ok(entry.slug.startsWith(`ch${padded}-`), `Slug ${entry.slug} should start with ch${padded}-`);
      }
    });
  });

  // ---- getChapterSlug -----------------------------------------------------

  describe('getChapterSlug', () => {
    it('returns correct slug for chapter 1', () => {
      const { getChapterSlug } = require('./concept.cjs');
      assert.strictEqual(getChapterSlug(1), 'ch01-target-users');
    });

    it('returns correct slug for chapter 3', () => {
      const { getChapterSlug } = require('./concept.cjs');
      assert.strictEqual(getChapterSlug(3), 'ch03-core-gameplay');
    });

    it('returns correct slug for chapter 15', () => {
      const { getChapterSlug } = require('./concept.cjs');
      assert.strictEqual(getChapterSlug(15), 'ch15-revenue-roi');
    });

    it('returns correct slug for all 15 chapters', () => {
      const { getChapterSlug, CHAPTER_MAP } = require('./concept.cjs');
      for (const entry of CHAPTER_MAP) {
        assert.strictEqual(getChapterSlug(entry.num), entry.slug);
      }
    });

    it('throws for chapter 0', () => {
      const { getChapterSlug } = require('./concept.cjs');
      assert.throws(() => getChapterSlug(0), /invalid chapter/i);
    });

    it('throws for chapter 16', () => {
      const { getChapterSlug } = require('./concept.cjs');
      assert.throws(() => getChapterSlug(16), /invalid chapter/i);
    });

    it('throws for non-integer input', () => {
      const { getChapterSlug } = require('./concept.cjs');
      assert.throws(() => getChapterSlug('abc'), /invalid chapter/i);
    });
  });

  // ---- CONCEPT_RULE_PATTERN -----------------------------------------------

  describe('CONCEPT_RULE_PATTERN', () => {
    it('is exported as a RegExp', () => {
      const { CONCEPT_RULE_PATTERN } = require('./concept.cjs');
      assert.ok(CONCEPT_RULE_PATTERN instanceof RegExp);
    });

    it('matches R_3_01', () => {
      const { CONCEPT_RULE_PATTERN } = require('./concept.cjs');
      assert.ok(CONCEPT_RULE_PATTERN.test('R_3_01'));
    });

    it('matches R_15_99', () => {
      const { CONCEPT_RULE_PATTERN } = require('./concept.cjs');
      assert.ok(CONCEPT_RULE_PATTERN.test('R_15_99'));
    });

    it('matches R_1_01', () => {
      const { CONCEPT_RULE_PATTERN } = require('./concept.cjs');
      assert.ok(CONCEPT_RULE_PATTERN.test('R_1_01'));
    });

    it('does not match R_99_1 (seq must be 2 digits)', () => {
      const { CONCEPT_RULE_PATTERN } = require('./concept.cjs');
      assert.strictEqual(CONCEPT_RULE_PATTERN.test('R_99_1'), false);
    });

    it('does not match RULE-SYS-001', () => {
      const { CONCEPT_RULE_PATTERN } = require('./concept.cjs');
      assert.strictEqual(CONCEPT_RULE_PATTERN.test('RULE-SYS-001'), false);
    });

    it('does not match empty string', () => {
      const { CONCEPT_RULE_PATTERN } = require('./concept.cjs');
      assert.strictEqual(CONCEPT_RULE_PATTERN.test(''), false);
    });
  });

  // ---- validateConceptRuleId ----------------------------------------------

  describe('validateConceptRuleId', () => {
    it('returns valid result for R_3_01', () => {
      const { validateConceptRuleId } = require('./concept.cjs');
      const result = validateConceptRuleId('R_3_01');
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.chapter, 3);
      assert.strictEqual(result.seq, 1);
    });

    it('returns valid result for R_15_05', () => {
      const { validateConceptRuleId } = require('./concept.cjs');
      const result = validateConceptRuleId('R_15_05');
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.chapter, 15);
      assert.strictEqual(result.seq, 5);
    });

    it('returns invalid for R_16_01 (chapter out of range)', () => {
      const { validateConceptRuleId } = require('./concept.cjs');
      const result = validateConceptRuleId('R_16_01');
      assert.strictEqual(result.valid, false);
      assert.ok(result.error.includes('chapter out of range'));
    });

    it('returns invalid for R_0_01 (chapter out of range)', () => {
      const { validateConceptRuleId } = require('./concept.cjs');
      const result = validateConceptRuleId('R_0_01');
      assert.strictEqual(result.valid, false);
      assert.ok(result.error.includes('chapter out of range'));
    });

    it('returns invalid for INVALID', () => {
      const { validateConceptRuleId } = require('./concept.cjs');
      const result = validateConceptRuleId('INVALID');
      assert.strictEqual(result.valid, false);
      assert.ok(result.error);
    });

    it('returns invalid for null', () => {
      const { validateConceptRuleId } = require('./concept.cjs');
      const result = validateConceptRuleId(null);
      assert.strictEqual(result.valid, false);
    });

    it('returns invalid for empty string', () => {
      const { validateConceptRuleId } = require('./concept.cjs');
      const result = validateConceptRuleId('');
      assert.strictEqual(result.valid, false);
    });
  });

  // ---- DATA_BEARING_TYPES -------------------------------------------------

  describe('DATA_BEARING_TYPES', () => {
    it('contains exactly 8 types', () => {
      const { DATA_BEARING_TYPES } = require('./concept.cjs');
      assert.ok(Array.isArray(DATA_BEARING_TYPES));
      assert.strictEqual(DATA_BEARING_TYPES.length, 8);
    });

    it('contains all expected types', () => {
      const { DATA_BEARING_TYPES } = require('./concept.cjs');
      const expected = [
        'level_config', 'object_config', 'constant_config',
        'probability_config', 'growth_config', 'task_config',
        'settlement_config', 'logic_impl',
      ];
      for (const t of expected) {
        assert.ok(DATA_BEARING_TYPES.includes(t), `Missing type: ${t}`);
      }
    });
  });

  // ---- validateDataBearingType --------------------------------------------

  describe('validateDataBearingType', () => {
    it('returns true for level_config', () => {
      const { validateDataBearingType } = require('./concept.cjs');
      assert.strictEqual(validateDataBearingType('level_config'), true);
    });

    it('returns true for logic_impl', () => {
      const { validateDataBearingType } = require('./concept.cjs');
      assert.strictEqual(validateDataBearingType('logic_impl'), true);
    });

    it('returns true for all 8 valid types', () => {
      const { validateDataBearingType, DATA_BEARING_TYPES } = require('./concept.cjs');
      for (const t of DATA_BEARING_TYPES) {
        assert.strictEqual(validateDataBearingType(t), true, `Expected true for ${t}`);
      }
    });

    it('returns false for unknown type', () => {
      const { validateDataBearingType } = require('./concept.cjs');
      assert.strictEqual(validateDataBearingType('unknown_type'), false);
    });

    it('returns false for empty string', () => {
      const { validateDataBearingType } = require('./concept.cjs');
      assert.strictEqual(validateDataBearingType(''), false);
    });

    it('returns false for null', () => {
      const { validateDataBearingType } = require('./concept.cjs');
      assert.strictEqual(validateDataBearingType(null), false);
    });
  });

  // ---- filterChaptersByGenre ----------------------------------------------

  describe('filterChaptersByGenre', () => {
    it('returns all 15 chapters when all are included', () => {
      const { filterChaptersByGenre } = require('./concept.cjs');
      const profile = {
        chapters: Array.from({ length: 15 }, (_, i) => ({ num: i + 1, include: true })),
      };
      const result = filterChaptersByGenre(profile);
      assert.deepStrictEqual(result, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    });

    it('filters out skipped chapters', () => {
      const { filterChaptersByGenre } = require('./concept.cjs');
      const profile = {
        chapters: [
          { num: 1, include: true },
          { num: 2, include: true },
          { num: 3, include: true },
          { num: 9, include: false },
          { num: 10, include: true },
        ],
      };
      const result = filterChaptersByGenre(profile);
      assert.deepStrictEqual(result, [1, 2, 3, 10]);
    });

    it('accepts YES string as include', () => {
      const { filterChaptersByGenre } = require('./concept.cjs');
      const profile = {
        chapters: [
          { num: 1, include: 'YES' },
          { num: 2, include: 'SKIP' },
          { num: 3, include: 'YES' },
        ],
      };
      const result = filterChaptersByGenre(profile);
      assert.deepStrictEqual(result, [1, 3]);
    });

    it('returns empty array when all chapters are skipped', () => {
      const { filterChaptersByGenre } = require('./concept.cjs');
      const profile = {
        chapters: [
          { num: 1, include: false },
          { num: 2, include: false },
        ],
      };
      const result = filterChaptersByGenre(profile);
      assert.deepStrictEqual(result, []);
    });

    it('returns empty array for empty chapters array', () => {
      const { filterChaptersByGenre } = require('./concept.cjs');
      const result = filterChaptersByGenre({ chapters: [] });
      assert.deepStrictEqual(result, []);
    });
  });

  // ---- getChapterStatus ---------------------------------------------------

  describe('getChapterStatus', () => {
    it('returns per-chapter status from STATE.md', () => {
      const { getChapterStatus } = require('./concept.cjs');
      const stateContent = `---
current_stage: concept
---

# Game State

**Current Stage:** concept

## Concept Stage Progress

| Chapter | Status | Rules |
|---------|--------|-------|
| 1. Target Users | complete | R_1_01 |
| 2. Product Positioning | pending | - |
| 3. Core Gameplay | in-progress | - |
`;
      fs.writeFileSync(path.join(tmpDir, '.gf', 'STATE.md'), stateContent, 'utf-8');

      const result = getChapterStatus(tmpDir);
      assert.strictEqual(result[1], 'complete');
      assert.strictEqual(result[2], 'pending');
      assert.strictEqual(result[3], 'in-progress');
    });

    it('returns empty object when no chapter table exists', () => {
      const { getChapterStatus } = require('./concept.cjs');
      const stateContent = `---
current_stage: concept
---

# Game State

**Current Stage:** concept
`;
      fs.writeFileSync(path.join(tmpDir, '.gf', 'STATE.md'), stateContent, 'utf-8');

      const result = getChapterStatus(tmpDir);
      assert.deepStrictEqual(result, {});
    });

    it('returns empty object when STATE.md does not exist', () => {
      const { getChapterStatus } = require('./concept.cjs');
      const result = getChapterStatus(tmpDir);
      assert.deepStrictEqual(result, {});
    });
  });

  // ---- updateChapterStatus ------------------------------------------------

  describe('updateChapterStatus', () => {
    it('updates an existing chapter status in STATE.md', () => {
      const { updateChapterStatus, getChapterStatus } = require('./concept.cjs');
      const stateContent = `---
current_stage: concept
---

# Game State

**Current Stage:** concept

## Concept Stage Progress

| Chapter | Status | Rules |
|---------|--------|-------|
| 1. Target Users | pending | - |
| 2. Product Positioning | pending | - |
`;
      fs.writeFileSync(path.join(tmpDir, '.gf', 'STATE.md'), stateContent, 'utf-8');

      const result = updateChapterStatus(tmpDir, 1, 'complete');
      assert.strictEqual(result.success, true);

      const statuses = getChapterStatus(tmpDir);
      assert.strictEqual(statuses[1], 'complete');
      assert.strictEqual(statuses[2], 'pending');
    });

    it('creates chapter table if it does not exist', () => {
      const { updateChapterStatus, getChapterStatus } = require('./concept.cjs');
      const stateContent = `---
current_stage: concept
---

# Game State

**Current Stage:** concept
`;
      fs.writeFileSync(path.join(tmpDir, '.gf', 'STATE.md'), stateContent, 'utf-8');

      const result = updateChapterStatus(tmpDir, 3, 'complete');
      assert.strictEqual(result.success, true);

      const statuses = getChapterStatus(tmpDir);
      assert.strictEqual(statuses[3], 'complete');
    });

    it('returns error for invalid chapter number', () => {
      const { updateChapterStatus } = require('./concept.cjs');
      const stateContent = `---
current_stage: concept
---

# Game State

**Current Stage:** concept
`;
      fs.writeFileSync(path.join(tmpDir, '.gf', 'STATE.md'), stateContent, 'utf-8');

      const result = updateChapterStatus(tmpDir, 16, 'complete');
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  // ---- buildConceptEntry --------------------------------------------------

  describe('buildConceptEntry', () => {
    it('creates a registry-ready entry object', () => {
      const { buildConceptEntry } = require('./concept.cjs');
      const entry = buildConceptEntry('R_3_01', 'level_config', 'Merge requires adjacency', 3);
      assert.strictEqual(entry.id, 'R_3_01');
      assert.strictEqual(entry.data_bearing_type, 'level_config');
      assert.strictEqual(entry.description, 'Merge requires adjacency');
      assert.strictEqual(entry.chapter, 3);
    });

    it('returns error for invalid rule ID', () => {
      const { buildConceptEntry } = require('./concept.cjs');
      const entry = buildConceptEntry('INVALID', 'level_config', 'Description', 3);
      assert.strictEqual(entry.valid, false);
      assert.ok(entry.error);
    });

    it('returns error for invalid data-bearing type', () => {
      const { buildConceptEntry } = require('./concept.cjs');
      const entry = buildConceptEntry('R_3_01', 'invalid_type', 'Description', 3);
      assert.strictEqual(entry.valid, false);
      assert.ok(entry.error);
    });
  });

  // ---- exports check ------------------------------------------------------

  describe('exports', () => {
    it('exports all required constants and functions', () => {
      const concept = require('./concept.cjs');
      assert.ok(Array.isArray(concept.CHAPTER_MAP));
      assert.ok(concept.CONCEPT_RULE_PATTERN instanceof RegExp);
      assert.ok(Array.isArray(concept.DATA_BEARING_TYPES));
      assert.strictEqual(typeof concept.getChapterSlug, 'function');
      assert.strictEqual(typeof concept.validateConceptRuleId, 'function');
      assert.strictEqual(typeof concept.validateDataBearingType, 'function');
      assert.strictEqual(typeof concept.filterChaptersByGenre, 'function');
      assert.strictEqual(typeof concept.getChapterStatus, 'function');
      assert.strictEqual(typeof concept.updateChapterStatus, 'function');
      assert.strictEqual(typeof concept.buildConceptEntry, 'function');
    });
  });
});
