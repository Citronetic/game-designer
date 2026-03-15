/**
 * Tests for balance module -- 7B input extraction, CSV value update,
 * economy flow validation, difficulty monotonicity, tuning threshold
 * validation, and balance status tracking.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('balance module', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-balance-test-'));
    fs.mkdirSync(path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.gf', 'stages', '03a-data-schema', 'configs'), { recursive: true });
    // Create a minimal config.json so config.cjs can load/save
    fs.writeFileSync(path.join(tmpDir, '.gf', 'config.json'), JSON.stringify({
      gf_version: '1.0',
      project_name: 'Test Project',
    }), 'utf-8');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('module loads without error', () => {
    const bal = require('./balance.cjs');
    assert.ok(bal);
  });

  // ---- BALANCE_LAYERS constant ------------------------------------------------

  describe('BALANCE_LAYERS', () => {
    it('is array of 3 balance-relevant layer names', () => {
      const { BALANCE_LAYERS } = require('./balance.cjs');
      assert.ok(Array.isArray(BALANCE_LAYERS));
      assert.strictEqual(BALANCE_LAYERS.length, 3);
      assert.deepStrictEqual(BALANCE_LAYERS, ['core_config', 'probability', 'periodic_rewards']);
    });
  });

  // ---- extract7BInputs -------------------------------------------------------

  describe('extract7BInputs', () => {
    it('extracts 7B sections from system files', () => {
      const { extract7BInputs } = require('./balance.cjs');

      const systemFile = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-COMBAT-001.md');
      fs.writeFileSync(systemFile, `---
system_id: SYS-COMBAT-001
system_name: Combat System
status: complete
---

# System: Combat System

## 7A. Data Schema Anchors

| Table Name | Purpose |
|-----------|---------|
| monster_config | Monster defs |

## 7B. Numerical Balance Inputs

- Difficulty curve: levels 1-50
- Boss HP scaling: 1.2x per tier
- Drop rate baseline: 5%

## 8. Summary
`, 'utf-8');

      const result = extract7BInputs(tmpDir);
      assert.strictEqual(result.inputs.length, 1);
      assert.strictEqual(result.inputs[0].system_id, 'SYS-COMBAT-001');
      assert.strictEqual(result.inputs[0].system_name, 'Combat System');
      assert.ok(result.inputs[0].raw_7b.includes('Difficulty curve'));
      assert.ok(result.inputs[0].raw_7b.includes('Boss HP scaling'));
      assert.ok(result.inputs[0].raw_7b.includes('Drop rate baseline'));
      assert.ok(result.systems.includes('SYS-COMBAT-001'));
    });

    it('returns empty arrays when systemsDir does not exist', () => {
      const { extract7BInputs } = require('./balance.cjs');
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-empty-'));
      try {
        const result = extract7BInputs(emptyDir);
        assert.deepStrictEqual(result.inputs, []);
        assert.deepStrictEqual(result.systems, []);
      } finally {
        fs.rmSync(emptyDir, { recursive: true, force: true });
      }
    });

    it('skips files without 7B sections gracefully', () => {
      const { extract7BInputs } = require('./balance.cjs');

      const systemFile = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-TUTORIAL-001.md');
      fs.writeFileSync(systemFile, `---
system_id: SYS-TUTORIAL-001
system_name: Tutorial
status: complete
---

# System: Tutorial

## 5. Core Rules

No 7B section here.
`, 'utf-8');

      const result = extract7BInputs(tmpDir);
      assert.deepStrictEqual(result.inputs, []);
      assert.ok(result.systems.includes('SYS-TUTORIAL-001'));
    });

    it('extracts content from "## 7B" until next same-level heading or EOF', () => {
      const { extract7BInputs } = require('./balance.cjs');

      // Case 1: 7B until next ## heading
      const sys1 = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-A-001.md');
      fs.writeFileSync(sys1, `---
system_id: SYS-A-001
system_name: System A
---

## 7B. Balance

Content A line 1
Content A line 2

## 8. Summary

Should not be included
`, 'utf-8');

      const result = extract7BInputs(tmpDir);
      assert.strictEqual(result.inputs.length, 1);
      assert.ok(result.inputs[0].raw_7b.includes('Content A line 1'));
      assert.ok(result.inputs[0].raw_7b.includes('Content A line 2'));
      assert.ok(!result.inputs[0].raw_7b.includes('Should not be included'));
    });

    it('extracts content from "## 7B" until end of file when no next heading', () => {
      const { extract7BInputs } = require('./balance.cjs');

      const sys1 = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-B-001.md');
      fs.writeFileSync(sys1, `---
system_id: SYS-B-001
system_name: System B
---

## 7B. Balance

Last section content
Final line
`, 'utf-8');

      const result = extract7BInputs(tmpDir);
      assert.strictEqual(result.inputs.length, 1);
      assert.ok(result.inputs[0].raw_7b.includes('Last section content'));
      assert.ok(result.inputs[0].raw_7b.includes('Final line'));
    });
  });

  // ---- updateTableValues ------------------------------------------------------

  describe('updateTableValues', () => {
    it('returns error when schema is not frozen', () => {
      const { updateTableValues } = require('./balance.cjs');

      const result = updateTableValues(tmpDir, 'monster_config', [['1001', 'Slime']]);
      assert.strictEqual(result.success, false);
      assert.ok(result.error.toLowerCase().includes('frozen'));
    });

    it('replaces data rows while preserving field names and field types rows', () => {
      const { updateTableValues } = require('./balance.cjs');

      // Freeze the schema
      const configPath = path.join(tmpDir, '.gf', 'config.json');
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      cfg.schema_frozen = true;
      fs.writeFileSync(configPath, JSON.stringify(cfg), 'utf-8');

      // Create CSV file with BOM + field names + field types + old data
      const BOM = '\uFEFF';
      const csvContent = BOM + 'id,name,hp\nint,string,int\n1001,Slime,100\n1002,Dragon,5000\n';
      const csvPath = path.join(tmpDir, '.gf', 'stages', '03a-data-schema', 'configs', 'monster_config.csv');
      fs.writeFileSync(csvPath, csvContent, 'utf-8');

      const newDataRows = [
        ['1001', 'Slime', '150'],
        ['1002', 'Dragon', '7500'],
        ['1003', 'Phoenix', '3000'],
      ];

      const result = updateTableValues(tmpDir, 'monster_config', newDataRows);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.rows_updated, 3);

      // Read back and verify
      const updated = fs.readFileSync(csvPath, 'utf-8');
      assert.strictEqual(updated.charCodeAt(0), 0xFEFF); // BOM preserved
      const lines = updated.slice(1).split('\n').filter(l => l.length > 0);
      assert.strictEqual(lines[0], 'id,name,hp');       // field names preserved
      assert.strictEqual(lines[1], 'int,string,int');    // field types preserved
      assert.strictEqual(lines[2], '1001,Slime,150');    // new data
      assert.strictEqual(lines[3], '1002,Dragon,7500');
      assert.strictEqual(lines[4], '1003,Phoenix,3000');
    });

    it('preserves BOM prefix in updated CSV', () => {
      const { updateTableValues } = require('./balance.cjs');

      const configPath = path.join(tmpDir, '.gf', 'config.json');
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      cfg.schema_frozen = true;
      fs.writeFileSync(configPath, JSON.stringify(cfg), 'utf-8');

      const BOM = '\uFEFF';
      const csvContent = BOM + 'id,value\nint,int\n1,10\n';
      const csvPath = path.join(tmpDir, '.gf', 'stages', '03a-data-schema', 'configs', 'test_table.csv');
      fs.writeFileSync(csvPath, csvContent, 'utf-8');

      updateTableValues(tmpDir, 'test_table', [['1', '20']]);

      const updated = fs.readFileSync(csvPath, 'utf-8');
      assert.strictEqual(updated.charCodeAt(0), 0xFEFF);
    });

    it('returns success with rows_updated count', () => {
      const { updateTableValues } = require('./balance.cjs');

      const configPath = path.join(tmpDir, '.gf', 'config.json');
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      cfg.schema_frozen = true;
      fs.writeFileSync(configPath, JSON.stringify(cfg), 'utf-8');

      const BOM = '\uFEFF';
      const csvPath = path.join(tmpDir, '.gf', 'stages', '03a-data-schema', 'configs', 'level_config.csv');
      fs.writeFileSync(csvPath, BOM + 'level,xp\nint,int\n1,100\n', 'utf-8');

      const result = updateTableValues(tmpDir, 'level_config', [['1', '200'], ['2', '500']]);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.rows_updated, 2);
    });

    it('returns error when CSV file does not exist', () => {
      const { updateTableValues } = require('./balance.cjs');

      const configPath = path.join(tmpDir, '.gf', 'config.json');
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      cfg.schema_frozen = true;
      fs.writeFileSync(configPath, JSON.stringify(cfg), 'utf-8');

      const result = updateTableValues(tmpDir, 'nonexistent_table', [['1', '2']]);
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  // ---- validateEconomyFlow ----------------------------------------------------

  describe('validateEconomyFlow', () => {
    it('returns invalid with "guaranteed drought" when resource has no sources', () => {
      const { validateEconomyFlow } = require('./balance.cjs');

      const flows = [
        { resource: 'gold', sources: [], sinks: ['shop'], choke_points: [], safety_nets: [] },
      ];

      const result = validateEconomyFlow(flows);
      assert.strictEqual(result.valid, false);
      assert.ok(result.issues.some(i => i.toLowerCase().includes('drought') || i.toLowerCase().includes('no source')));
    });

    it('returns invalid with "infinite accumulation" when resource has no sinks', () => {
      const { validateEconomyFlow } = require('./balance.cjs');

      const flows = [
        { resource: 'gems', sources: ['daily_login'], sinks: [], choke_points: [], safety_nets: [] },
      ];

      const result = validateEconomyFlow(flows);
      assert.strictEqual(result.valid, false);
      assert.ok(result.issues.some(i => i.toLowerCase().includes('accumulation') || i.toLowerCase().includes('no sink')));
    });

    it('returns invalid when choke points exist but no safety nets', () => {
      const { validateEconomyFlow } = require('./balance.cjs');

      const flows = [
        { resource: 'energy', sources: ['regen'], sinks: ['combat'], choke_points: ['boss_gate'], safety_nets: [] },
      ];

      const result = validateEconomyFlow(flows);
      assert.strictEqual(result.valid, false);
      assert.ok(result.issues.some(i => i.toLowerCase().includes('safety') || i.toLowerCase().includes('choke')));
    });

    it('returns valid when flows have sources, sinks, and safety nets for chokes', () => {
      const { validateEconomyFlow } = require('./balance.cjs');

      const flows = [
        { resource: 'gold', sources: ['quests', 'drops'], sinks: ['shop', 'upgrades'], choke_points: ['boss_gate'], safety_nets: ['daily_bonus'] },
        { resource: 'gems', sources: ['achievements'], sinks: ['premium_shop'], choke_points: [], safety_nets: [] },
      ];

      const result = validateEconomyFlow(flows);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.issues.length, 0);
    });
  });

  // ---- validateDifficultyMonotonicity -----------------------------------------

  describe('validateDifficultyMonotonicity', () => {
    it('returns invalid when pass rate increases significantly in later segment', () => {
      const { validateDifficultyMonotonicity } = require('./balance.cjs');

      const segments = [
        { segment: 'tutorial', expected_pass_rate: 95 },
        { segment: 'early', expected_pass_rate: 85 },
        { segment: 'mid', expected_pass_rate: 70 },
        { segment: 'late', expected_pass_rate: 85 },  // >10pp jump back up
      ];

      const result = validateDifficultyMonotonicity(segments);
      assert.strictEqual(result.valid, false);
      assert.ok(result.issues.length > 0);
    });

    it('returns valid with decreasing or stable pass rates', () => {
      const { validateDifficultyMonotonicity } = require('./balance.cjs');

      const segments = [
        { segment: 'tutorial', expected_pass_rate: 98 },
        { segment: 'early', expected_pass_rate: 90 },
        { segment: 'mid', expected_pass_rate: 75 },
        { segment: 'late', expected_pass_rate: 60 },
      ];

      const result = validateDifficultyMonotonicity(segments);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.issues.length, 0);
    });

    it('allows small recovery dips (<=10pp increase) between consecutive segments', () => {
      const { validateDifficultyMonotonicity } = require('./balance.cjs');

      const segments = [
        { segment: 'tutorial', expected_pass_rate: 95 },
        { segment: 'early', expected_pass_rate: 80 },
        { segment: 'mid', expected_pass_rate: 88 },  // +8pp -- allowed
        { segment: 'late', expected_pass_rate: 70 },
      ];

      const result = validateDifficultyMonotonicity(segments);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.issues.length, 0);
    });
  });

  // ---- validateTuningThresholds -----------------------------------------------

  describe('validateTuningThresholds', () => {
    it('returns invalid when rollback conditions have no numbers', () => {
      const { validateTuningThresholds } = require('./balance.cjs');

      const entries = [
        { parameter: 'drop_rate', rollback_condition: 'if players complain a lot' },
        { parameter: 'boss_hp', rollback_condition: 'when too many players quit' },
      ];

      const result = validateTuningThresholds(entries);
      assert.strictEqual(result.valid, false);
      assert.ok(result.issues.length >= 2);
      assert.ok(result.issues.some(i => i.includes('drop_rate')));
      assert.ok(result.issues.some(i => i.includes('boss_hp')));
    });

    it('returns valid when rollback conditions contain concrete numeric thresholds', () => {
      const { validateTuningThresholds } = require('./balance.cjs');

      const entries = [
        { parameter: 'drop_rate', rollback_condition: 'if completion rate drops below 40%' },
        { parameter: 'boss_hp', rollback_condition: 'if average clear time exceeds 300 seconds' },
      ];

      const result = validateTuningThresholds(entries);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.issues.length, 0);
    });
  });

  // ---- getBalanceStatus -------------------------------------------------------

  describe('getBalanceStatus', () => {
    it('returns "not_started" when no balance config exists', () => {
      const { getBalanceStatus } = require('./balance.cjs');

      const result = getBalanceStatus(tmpDir);
      assert.strictEqual(result, 'not_started');
    });

    it('returns stored status when set', () => {
      const { getBalanceStatus, setBalanceStatus } = require('./balance.cjs');

      setBalanceStatus(tmpDir, 'in_progress');
      assert.strictEqual(getBalanceStatus(tmpDir), 'in_progress');
    });
  });

  // ---- setBalanceStatus -------------------------------------------------------

  describe('setBalanceStatus', () => {
    it('sets balance_status in config', () => {
      const { setBalanceStatus } = require('./balance.cjs');
      const config = require('./config.cjs');

      setBalanceStatus(tmpDir, 'complete');
      assert.strictEqual(config.getConfigValue(tmpDir, 'balance_status'), 'complete');
    });
  });

  // ---- exports check ----------------------------------------------------------

  describe('exports', () => {
    it('exports all required constants and functions', () => {
      const bal = require('./balance.cjs');
      // Constants
      assert.ok(Array.isArray(bal.BALANCE_LAYERS));
      // Functions
      assert.strictEqual(typeof bal.extract7BInputs, 'function');
      assert.strictEqual(typeof bal.updateTableValues, 'function');
      assert.strictEqual(typeof bal.validateEconomyFlow, 'function');
      assert.strictEqual(typeof bal.validateDifficultyMonotonicity, 'function');
      assert.strictEqual(typeof bal.validateTuningThresholds, 'function');
      assert.strictEqual(typeof bal.getBalanceStatus, 'function');
      assert.strictEqual(typeof bal.setBalanceStatus, 'function');
    });
  });
});
