/**
 * Tests for system-design module -- ID validation, status tracking,
 * system list management, traceability checks, cross-system consistency.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('system-design module', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-sysdesign-test-'));
    fs.mkdirSync(path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.gf', 'traceability'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('module loads without error', () => {
    const sd = require('./system-design.cjs');
    assert.ok(sd);
  });

  // ---- SYSTEM_TYPES --------------------------------------------------------

  describe('SYSTEM_TYPES', () => {
    it('is array of [core, growth, commercial, support]', () => {
      const { SYSTEM_TYPES } = require('./system-design.cjs');
      assert.ok(Array.isArray(SYSTEM_TYPES));
      assert.deepStrictEqual(SYSTEM_TYPES, ['core', 'growth', 'commercial', 'support']);
    });
  });

  // ---- SYSTEM_PRIORITIES ---------------------------------------------------

  describe('SYSTEM_PRIORITIES', () => {
    it('is array of [P0, P1, P2]', () => {
      const { SYSTEM_PRIORITIES } = require('./system-design.cjs');
      assert.ok(Array.isArray(SYSTEM_PRIORITIES));
      assert.deepStrictEqual(SYSTEM_PRIORITIES, ['P0', 'P1', 'P2']);
    });
  });

  // ---- SYSTEM_ID_PATTERN ---------------------------------------------------

  describe('SYSTEM_ID_PATTERN', () => {
    it('matches SYS-CORE_GAMEPLAY-001', () => {
      const { SYSTEM_ID_PATTERN } = require('./system-design.cjs');
      assert.ok(SYSTEM_ID_PATTERN.test('SYS-CORE_GAMEPLAY-001'));
    });

    it('rejects sys-bad-1 (lowercase)', () => {
      const { SYSTEM_ID_PATTERN } = require('./system-design.cjs');
      assert.strictEqual(SYSTEM_ID_PATTERN.test('sys-bad-1'), false);
    });

    it('rejects SYS--001 (empty system name)', () => {
      const { SYSTEM_ID_PATTERN } = require('./system-design.cjs');
      assert.strictEqual(SYSTEM_ID_PATTERN.test('SYS--001'), false);
    });

    it('rejects RULE-X-001 (wrong prefix)', () => {
      const { SYSTEM_ID_PATTERN } = require('./system-design.cjs');
      assert.strictEqual(SYSTEM_ID_PATTERN.test('RULE-X-001'), false);
    });
  });

  // ---- SYSTEM_RULE_ID_PATTERN ----------------------------------------------

  describe('SYSTEM_RULE_ID_PATTERN', () => {
    it('matches RULE-CORE_GAMEPLAY-001', () => {
      const { SYSTEM_RULE_ID_PATTERN } = require('./system-design.cjs');
      assert.ok(SYSTEM_RULE_ID_PATTERN.test('RULE-CORE_GAMEPLAY-001'));
    });

    it('rejects SYS-X-001 (wrong prefix)', () => {
      const { SYSTEM_RULE_ID_PATTERN } = require('./system-design.cjs');
      assert.strictEqual(SYSTEM_RULE_ID_PATTERN.test('SYS-X-001'), false);
    });

    it('rejects RULE--001 (empty rule name)', () => {
      const { SYSTEM_RULE_ID_PATTERN } = require('./system-design.cjs');
      assert.strictEqual(SYSTEM_RULE_ID_PATTERN.test('RULE--001'), false);
    });
  });

  // ---- systemNameToId ------------------------------------------------------

  describe('systemNameToId', () => {
    it('converts "Core Gameplay" to SYS-CORE_GAMEPLAY-001', () => {
      const { systemNameToId } = require('./system-design.cjs');
      assert.strictEqual(systemNameToId('Core Gameplay'), 'SYS-CORE_GAMEPLAY-001');
    });

    it('converts "Ad Monetization" to SYS-AD_MONETIZATION-001', () => {
      const { systemNameToId } = require('./system-design.cjs');
      assert.strictEqual(systemNameToId('Ad Monetization'), 'SYS-AD_MONETIZATION-001');
    });

    it('accepts custom seq number: "Core Gameplay", 5 -> SYS-CORE_GAMEPLAY-005', () => {
      const { systemNameToId } = require('./system-design.cjs');
      assert.strictEqual(systemNameToId('Core Gameplay', 5), 'SYS-CORE_GAMEPLAY-005');
    });
  });

  // ---- validateSystemId ----------------------------------------------------

  describe('validateSystemId', () => {
    it('returns {valid: true} for SYS-COMBAT-001', () => {
      const { validateSystemId } = require('./system-design.cjs');
      const result = validateSystemId('SYS-COMBAT-001');
      assert.strictEqual(result.valid, true);
    });

    it('returns {valid: false, error: ...} for "bad"', () => {
      const { validateSystemId } = require('./system-design.cjs');
      const result = validateSystemId('bad');
      assert.strictEqual(result.valid, false);
      assert.ok(result.error);
    });
  });

  // ---- validateSystemRuleId ------------------------------------------------

  describe('validateSystemRuleId', () => {
    it('returns {valid: true} for RULE-COMBAT-001', () => {
      const { validateSystemRuleId } = require('./system-design.cjs');
      const result = validateSystemRuleId('RULE-COMBAT-001');
      assert.strictEqual(result.valid, true);
    });

    it('returns {valid: false, error: ...} for invalid', () => {
      const { validateSystemRuleId } = require('./system-design.cjs');
      const result = validateSystemRuleId('invalid');
      assert.strictEqual(result.valid, false);
      assert.ok(result.error);
    });
  });

  // ---- getSystemStatus -----------------------------------------------------

  describe('getSystemStatus', () => {
    it('returns empty object when no system-list.json exists', () => {
      const { getSystemStatus } = require('./system-design.cjs');
      const result = getSystemStatus(tmpDir);
      assert.deepStrictEqual(result, {});
    });

    it('reads status from system file frontmatter', () => {
      const { getSystemStatus } = require('./system-design.cjs');
      const systemFile = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-COMBAT-001.md');
      fs.writeFileSync(systemFile, `---
system_id: SYS-COMBAT-001
status: complete
---

# System: Combat
`, 'utf-8');

      const result = getSystemStatus(tmpDir);
      assert.strictEqual(result['SYS-COMBAT-001'], 'complete');
    });
  });

  // ---- updateSystemStatus --------------------------------------------------

  describe('updateSystemStatus', () => {
    it('writes status to system file frontmatter', () => {
      const { updateSystemStatus, getSystemStatus } = require('./system-design.cjs');
      const systemFile = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-COMBAT-001.md');
      fs.writeFileSync(systemFile, `---
system_id: SYS-COMBAT-001
status: pending
---

# System: Combat
`, 'utf-8');

      const result = updateSystemStatus(tmpDir, 'SYS-COMBAT-001', 'complete');
      assert.strictEqual(result.success, true);

      const statuses = getSystemStatus(tmpDir);
      assert.strictEqual(statuses['SYS-COMBAT-001'], 'complete');
    });
  });

  // ---- getConfirmedSystems -------------------------------------------------

  describe('getConfirmedSystems', () => {
    it('reads from system-list.json', () => {
      const { getConfirmedSystems } = require('./system-design.cjs');
      const listPath = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'system-list.json');
      fs.writeFileSync(listPath, JSON.stringify({
        confirmed: true,
        systems: [
          { name: 'Core Gameplay', type: 'core', priority: 'P0' },
        ],
      }), 'utf-8');

      const result = getConfirmedSystems(tmpDir);
      assert.ok(result);
      assert.strictEqual(result.confirmed, true);
      assert.strictEqual(result.systems.length, 1);
      assert.strictEqual(result.systems[0].name, 'Core Gameplay');
    });

    it('returns null when file does not exist', () => {
      const { getConfirmedSystems } = require('./system-design.cjs');
      const result = getConfirmedSystems(tmpDir);
      assert.strictEqual(result, null);
    });
  });

  // ---- saveConfirmedSystems ------------------------------------------------

  describe('saveConfirmedSystems', () => {
    it('writes confirmed system list with confirmed flag and timestamp', () => {
      const { saveConfirmedSystems, getConfirmedSystems } = require('./system-design.cjs');
      const systems = [
        { name: 'Core Gameplay', type: 'core', priority: 'P0' },
        { name: 'Settlement', type: 'growth', priority: 'P1' },
      ];

      const result = saveConfirmedSystems(tmpDir, systems);
      assert.strictEqual(result.success, true);

      const loaded = getConfirmedSystems(tmpDir);
      assert.ok(loaded);
      assert.strictEqual(loaded.confirmed, true);
      assert.strictEqual(loaded.systems.length, 2);
      assert.ok(loaded.confirmed_at); // ISO timestamp
    });
  });

  // ---- checkConceptTraceability --------------------------------------------

  describe('checkConceptTraceability', () => {
    it('with all concept IDs mapped returns coverage 1.0 and empty unmapped', () => {
      const { checkConceptTraceability } = require('./system-design.cjs');

      // Create registry with concept entries
      const registry = {
        gf_registry_version: '1.0',
        entries: [],
        concept_entries: [
          { id: 'R_3_01', chapter: 3, description: 'Rule 1' },
          { id: 'R_3_02', chapter: 3, description: 'Rule 2' },
        ],
      };
      fs.writeFileSync(
        path.join(tmpDir, '.gf', 'traceability', 'id-registry.json'),
        JSON.stringify(registry),
        'utf-8',
      );

      // Create system file that references both concept IDs
      const systemFile = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-COMBAT-001.md');
      fs.writeFileSync(systemFile, `---
system_id: SYS-COMBAT-001
concept_sources: [R_3_01, R_3_02]
---

# System: Combat
`, 'utf-8');

      const result = checkConceptTraceability(tmpDir);
      assert.strictEqual(result.coverage, 1.0);
      assert.deepStrictEqual(result.unmapped, []);
    });

    it('with unmapped IDs returns them in unmapped array with coverage < 1.0', () => {
      const { checkConceptTraceability } = require('./system-design.cjs');

      const registry = {
        gf_registry_version: '1.0',
        entries: [],
        concept_entries: [
          { id: 'R_3_01', chapter: 3, description: 'Rule 1' },
          { id: 'R_3_02', chapter: 3, description: 'Rule 2' },
          { id: 'R_4_01', chapter: 4, description: 'Rule 3' },
        ],
      };
      fs.writeFileSync(
        path.join(tmpDir, '.gf', 'traceability', 'id-registry.json'),
        JSON.stringify(registry),
        'utf-8',
      );

      // Only map R_3_01
      const systemFile = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-COMBAT-001.md');
      fs.writeFileSync(systemFile, `---
system_id: SYS-COMBAT-001
concept_sources: [R_3_01]
---

# System: Combat
`, 'utf-8');

      const result = checkConceptTraceability(tmpDir);
      assert.ok(result.coverage < 1.0);
      assert.ok(result.unmapped.includes('R_3_02'));
      assert.ok(result.unmapped.includes('R_4_01'));
    });
  });

  // ---- checkEconomyBalance -------------------------------------------------

  describe('checkEconomyBalance', () => {
    it('detects resource produced but never consumed', () => {
      const { checkEconomyBalance } = require('./system-design.cjs');

      const systemFiles = [
        {
          id: 'SYS-CORE-001',
          body: `## 7A. Data Schema Anchors

| Table Name | Purpose | Related Rules |
|-----------|---------|---------------|
| coin_ledger | Tracks coin production | RULE-CORE-001 |

## 7B. Numerical Balance Inputs

Resources produced: coins, gems
Resources consumed: coins
`,
        },
      ];

      const result = checkEconomyBalance(systemFiles);
      assert.strictEqual(result.balanced, false);
      assert.ok(result.issues.length > 0);
      assert.ok(result.issues.some(i => i.includes('gems')));
    });

    it('returns balanced: true when production matches consumption', () => {
      const { checkEconomyBalance } = require('./system-design.cjs');

      const systemFiles = [
        {
          id: 'SYS-CORE-001',
          body: `## 7B. Numerical Balance Inputs

Resources produced: coins, gems
Resources consumed: coins, gems
`,
        },
      ];

      const result = checkEconomyBalance(systemFiles);
      assert.strictEqual(result.balanced, true);
      assert.strictEqual(result.issues.length, 0);
    });
  });

  // ---- checkTaskReferences -------------------------------------------------

  describe('checkTaskReferences', () => {
    it('detects tasks referencing locked content', () => {
      const { checkTaskReferences } = require('./system-design.cjs');

      const systemFiles = [
        {
          id: 'SYS-TASKS-001',
          body: `## 3. Entry & Triggers

- Unlock conditions: requires SYS-PREMIUM-001
`,
        },
      ];

      const knownSystems = ['SYS-TASKS-001']; // SYS-PREMIUM-001 is NOT known

      const result = checkTaskReferences(systemFiles, knownSystems);
      assert.strictEqual(result.valid, false);
      assert.ok(result.issues.length > 0);
      assert.ok(result.issues.some(i => i.includes('SYS-PREMIUM-001')));
    });

    it('returns valid: true when all refs are to known systems', () => {
      const { checkTaskReferences } = require('./system-design.cjs');

      const systemFiles = [
        {
          id: 'SYS-TASKS-001',
          body: `## 3. Entry & Triggers

- Unlock conditions: requires SYS-CORE-001
`,
        },
      ];

      const knownSystems = ['SYS-TASKS-001', 'SYS-CORE-001'];

      const result = checkTaskReferences(systemFiles, knownSystems);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.issues.length, 0);
    });
  });

  // ---- checkTutorialCoverage -----------------------------------------------

  describe('checkTutorialCoverage', () => {
    it('detects rules tested before taught', () => {
      const { checkTutorialCoverage } = require('./system-design.cjs');

      const systemFiles = [
        {
          id: 'SYS-CORE-001',
          body: `## 7. One-Week Content Contribution (Day1-Day7)

| Day | This System Provides | Type |
|-----|---------------------|------|
| Day1 | Introduces merge mechanic | new_mechanic |
| Day2 | Tests combo chains | reuse_variation |

## 3. Entry & Triggers

- First encounter: Day3 tutorial for RULE-CORE-002

## 5. Core Rules

> **RULE-CORE-001** | config_driven | Merge requires adjacency. Source: R_3_01 [P0]
> **RULE-CORE-002** | logic_driven | Combo chain multiplier. Source: R_3_02 [P0]
`,
        },
      ];

      const result = checkTutorialCoverage(systemFiles);
      assert.strictEqual(result.complete, false);
      assert.ok(result.gaps.length > 0);
    });

    it('returns complete: true when all rules taught before tested', () => {
      const { checkTutorialCoverage } = require('./system-design.cjs');

      const systemFiles = [
        {
          id: 'SYS-CORE-001',
          body: `## 7. One-Week Content Contribution (Day1-Day7)

| Day | This System Provides | Type |
|-----|---------------------|------|
| Day1 | Introduces RULE-CORE-001 merge mechanic | new_mechanic |
| Day2 | Introduces RULE-CORE-002 combo chains | new_mechanic |
| Day3 | Tests RULE-CORE-001 and RULE-CORE-002 | reuse_variation |
`,
        },
      ];

      const result = checkTutorialCoverage(systemFiles);
      assert.strictEqual(result.complete, true);
      assert.strictEqual(result.gaps.length, 0);
    });
  });

  // ---- checkMonetizationConflicts ------------------------------------------

  describe('checkMonetizationConflicts', () => {
    it('detects ad/payment contradictions', () => {
      const { checkMonetizationConflicts } = require('./system-design.cjs');

      const systemFiles = [
        {
          id: 'SYS-ADS-001',
          body: `## 5. Core Rules

> **RULE-ADS-001** | config_driven | Show rewarded ad after level complete. Source: R_9_01 [P0]

Ad placements: level_complete_reward
`,
        },
        {
          id: 'SYS-PAYMENT-001',
          body: `## 5. Core Rules

> **RULE-PAY-001** | config_driven | Remove ads with premium purchase. Source: R_10_01 [P0]

Premium removes: level_complete_reward
`,
        },
      ];

      const result = checkMonetizationConflicts(systemFiles);
      assert.strictEqual(result.clean, false);
      assert.ok(result.conflicts.length > 0);
    });

    it('returns clean: true when no conflicts', () => {
      const { checkMonetizationConflicts } = require('./system-design.cjs');

      const systemFiles = [
        {
          id: 'SYS-ADS-001',
          body: `## 5. Core Rules

> **RULE-ADS-001** | config_driven | Show rewarded ad after level complete. Source: R_9_01 [P0]

Ad placements: level_complete_reward
`,
        },
        {
          id: 'SYS-PAYMENT-001',
          body: `## 5. Core Rules

> **RULE-PAY-001** | config_driven | Cosmetic-only premium purchase. Source: R_10_01 [P0]

Premium provides: cosmetic_skin
`,
        },
      ];

      const result = checkMonetizationConflicts(systemFiles);
      assert.strictEqual(result.clean, true);
      assert.strictEqual(result.conflicts.length, 0);
    });
  });

  // ---- exports check -------------------------------------------------------

  describe('exports', () => {
    it('exports all required constants and functions', () => {
      const sd = require('./system-design.cjs');
      assert.ok(Array.isArray(sd.SYSTEM_TYPES));
      assert.ok(Array.isArray(sd.SYSTEM_PRIORITIES));
      assert.ok(sd.SYSTEM_ID_PATTERN instanceof RegExp);
      assert.ok(sd.SYSTEM_RULE_ID_PATTERN instanceof RegExp);
      assert.strictEqual(typeof sd.systemNameToId, 'function');
      assert.strictEqual(typeof sd.validateSystemId, 'function');
      assert.strictEqual(typeof sd.validateSystemRuleId, 'function');
      assert.strictEqual(typeof sd.getSystemStatus, 'function');
      assert.strictEqual(typeof sd.updateSystemStatus, 'function');
      assert.strictEqual(typeof sd.getConfirmedSystems, 'function');
      assert.strictEqual(typeof sd.saveConfirmedSystems, 'function');
      assert.strictEqual(typeof sd.checkConceptTraceability, 'function');
      assert.strictEqual(typeof sd.checkEconomyBalance, 'function');
      assert.strictEqual(typeof sd.checkTaskReferences, 'function');
      assert.strictEqual(typeof sd.checkTutorialCoverage, 'function');
      assert.strictEqual(typeof sd.checkMonetizationConflicts, 'function');
    });
  });
});
