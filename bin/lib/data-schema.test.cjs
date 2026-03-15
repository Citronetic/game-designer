/**
 * Tests for data-schema module -- 7A anchor extraction, CSV generation,
 * schema freeze mechanism, referential integrity validation, and
 * relationship validation.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('data-schema module', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-dataschema-test-'));
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
    const ds = require('./data-schema.cjs');
    assert.ok(ds);
  });

  // ---- TABLE_LAYERS constant ------------------------------------------------

  describe('TABLE_LAYERS', () => {
    it('is array of 6 layer names', () => {
      const { TABLE_LAYERS } = require('./data-schema.cjs');
      assert.ok(Array.isArray(TABLE_LAYERS));
      assert.strictEqual(TABLE_LAYERS.length, 6);
      assert.deepStrictEqual(TABLE_LAYERS, [
        'core_config', 'constants', 'probability', 'i18n', 'progress', 'periodic_rewards',
      ]);
    });
  });

  // ---- FREEZE_LOCKED_FIELDS constant ----------------------------------------

  describe('FREEZE_LOCKED_FIELDS', () => {
    it('is array of structural field categories locked after freeze', () => {
      const { FREEZE_LOCKED_FIELDS } = require('./data-schema.cjs');
      assert.ok(Array.isArray(FREEZE_LOCKED_FIELDS));
      assert.ok(FREEZE_LOCKED_FIELDS.includes('table names'));
      assert.ok(FREEZE_LOCKED_FIELDS.includes('field names'));
      assert.ok(FREEZE_LOCKED_FIELDS.includes('field types'));
      assert.ok(FREEZE_LOCKED_FIELDS.includes('primary keys'));
      assert.ok(FREEZE_LOCKED_FIELDS.includes('foreign keys'));
      assert.ok(FREEZE_LOCKED_FIELDS.includes('relationship structure'));
    });
  });

  // ---- FREEZE_ADJUSTABLE_FIELDS constant ------------------------------------

  describe('FREEZE_ADJUSTABLE_FIELDS', () => {
    it('is array of value-level fields adjustable after freeze', () => {
      const { FREEZE_ADJUSTABLE_FIELDS } = require('./data-schema.cjs');
      assert.ok(Array.isArray(FREEZE_ADJUSTABLE_FIELDS));
      assert.ok(FREEZE_ADJUSTABLE_FIELDS.includes('default values'));
      assert.ok(FREEZE_ADJUSTABLE_FIELDS.includes('validation ranges'));
      assert.ok(FREEZE_ADJUSTABLE_FIELDS.includes('sample data values'));
      assert.ok(FREEZE_ADJUSTABLE_FIELDS.includes('enum display names'));
    });
  });

  // ---- tableNameToFilename --------------------------------------------------

  describe('tableNameToFilename', () => {
    it('converts display name to snake_case', () => {
      const { tableNameToFilename } = require('./data-schema.cjs');
      assert.strictEqual(tableNameToFilename('Monster Config'), 'monster_config');
    });

    it('converts hyphens to underscores', () => {
      const { tableNameToFilename } = require('./data-schema.cjs');
      assert.strictEqual(tableNameToFilename('level-rewards'), 'level_rewards');
    });

    it('collapses multiple underscores', () => {
      const { tableNameToFilename } = require('./data-schema.cjs');
      assert.strictEqual(tableNameToFilename('Monster  Config'), 'monster_config');
    });

    it('handles already snake_case input', () => {
      const { tableNameToFilename } = require('./data-schema.cjs');
      assert.strictEqual(tableNameToFilename('monster_config'), 'monster_config');
    });

    it('returns empty string for empty/null input', () => {
      const { tableNameToFilename } = require('./data-schema.cjs');
      assert.strictEqual(tableNameToFilename(''), '');
      assert.strictEqual(tableNameToFilename(null), '');
      assert.strictEqual(tableNameToFilename(undefined), '');
    });
  });

  // ---- escapeCSVField -------------------------------------------------------

  describe('escapeCSVField', () => {
    it('returns plain string unchanged', () => {
      const { escapeCSVField } = require('./data-schema.cjs');
      assert.strictEqual(escapeCSVField('hello'), 'hello');
    });

    it('wraps strings with commas in quotes', () => {
      const { escapeCSVField } = require('./data-schema.cjs');
      assert.strictEqual(escapeCSVField('a,b'), '"a,b"');
    });

    it('doubles internal quotes and wraps', () => {
      const { escapeCSVField } = require('./data-schema.cjs');
      assert.strictEqual(escapeCSVField('say "hi"'), '"say ""hi"""');
    });

    it('wraps strings with newlines', () => {
      const { escapeCSVField } = require('./data-schema.cjs');
      assert.strictEqual(escapeCSVField('line1\nline2'), '"line1\nline2"');
    });

    it('returns empty string for null', () => {
      const { escapeCSVField } = require('./data-schema.cjs');
      assert.strictEqual(escapeCSVField(null), '');
    });

    it('returns empty string for undefined', () => {
      const { escapeCSVField } = require('./data-schema.cjs');
      assert.strictEqual(escapeCSVField(undefined), '');
    });

    it('converts numbers to string', () => {
      const { escapeCSVField } = require('./data-schema.cjs');
      assert.strictEqual(escapeCSVField(42), '42');
    });
  });

  // ---- tableToCSV -----------------------------------------------------------

  describe('tableToCSV', () => {
    it('generates BOM + header + types + data rows', () => {
      const { tableToCSV } = require('./data-schema.cjs');
      const tableDef = {
        name: 'monster_config',
        fields: [
          { name: 'id', type: 'int' },
          { name: 'name', type: 'string' },
        ],
        sampleData: [
          [1001, 'Slime'],
          [1002, 'Dragon'],
        ],
      };
      const csv = tableToCSV(tableDef);

      // BOM check
      assert.strictEqual(csv.charCodeAt(0), 0xFEFF);

      // Remove BOM for content check
      const content = csv.slice(1);
      const lines = content.trim().split('\n');
      assert.strictEqual(lines.length, 4);
      assert.strictEqual(lines[0], 'id,name');
      assert.strictEqual(lines[1], 'int,string');
      assert.strictEqual(lines[2], '1001,Slime');
      assert.strictEqual(lines[3], '1002,Dragon');
    });

    it('handles empty sampleData array', () => {
      const { tableToCSV } = require('./data-schema.cjs');
      const tableDef = {
        name: 'empty_table',
        fields: [
          { name: 'id', type: 'int' },
        ],
        sampleData: [],
      };
      const csv = tableToCSV(tableDef);
      const content = csv.slice(1); // skip BOM
      const lines = content.trim().split('\n');
      assert.strictEqual(lines.length, 2); // header + types only
      assert.strictEqual(lines[0], 'id');
      assert.strictEqual(lines[1], 'int');
    });

    it('escapes fields with special characters in data rows', () => {
      const { tableToCSV } = require('./data-schema.cjs');
      const tableDef = {
        name: 'test',
        fields: [{ name: 'desc', type: 'string' }],
        sampleData: [['has,comma'], ['has "quotes"']],
      };
      const csv = tableToCSV(tableDef);
      const content = csv.slice(1);
      const lines = content.trim().split('\n');
      assert.strictEqual(lines[2], '"has,comma"');
      assert.strictEqual(lines[3], '"has ""quotes"""');
    });
  });

  // ---- syncCSVExports -------------------------------------------------------

  describe('syncCSVExports', () => {
    it('generates one CSV file per table in configs/ subdirectory', () => {
      const { syncCSVExports } = require('./data-schema.cjs');
      const schemaDir = path.join(tmpDir, '.gf', 'stages', '03a-data-schema');
      const tables = [
        {
          name: 'Monster Config',
          fields: [{ name: 'id', type: 'int' }, { name: 'name', type: 'string' }],
          sampleData: [[1, 'Slime']],
        },
        {
          name: 'Level Config',
          fields: [{ name: 'level_id', type: 'int' }],
          sampleData: [[1]],
        },
      ];

      syncCSVExports(schemaDir, tables);

      const configsDir = path.join(schemaDir, 'configs');
      assert.ok(fs.existsSync(path.join(configsDir, 'monster_config.csv')));
      assert.ok(fs.existsSync(path.join(configsDir, 'level_config.csv')));

      // Check content of one file
      const monsterCSV = fs.readFileSync(path.join(configsDir, 'monster_config.csv'), 'utf-8');
      assert.strictEqual(monsterCSV.charCodeAt(0), 0xFEFF); // BOM
    });
  });

  // ---- extract7AAnchors -----------------------------------------------------

  describe('extract7AAnchors', () => {
    it('extracts anchors from system files with 7A sections', () => {
      const { extract7AAnchors } = require('./data-schema.cjs');

      // Create a system file with a 7A section
      const systemFile = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-COMBAT-001.md');
      fs.writeFileSync(systemFile, `---
system_id: SYS-COMBAT-001
system_name: Combat System
status: complete
---

# System: Combat System

## 7A. Data Schema Anchors

| Table Name | Purpose | Related Rules |
|-----------|---------|---------------|
| monster_config | Monster definitions | RULE-COMBAT-001, RULE-COMBAT-002 |
| skill_config | Skill definitions | RULE-COMBAT-003 |

## 7B. Numerical Balance Inputs
`, 'utf-8');

      const result = extract7AAnchors(tmpDir);
      assert.ok(result.anchors.length === 2);
      assert.ok(result.systems.includes('SYS-COMBAT-001'));
      assert.strictEqual(result.anchors[0].table_name, 'monster_config');
      assert.strictEqual(result.anchors[0].purpose, 'Monster definitions');
      assert.strictEqual(result.anchors[0].system_id, 'SYS-COMBAT-001');
      assert.strictEqual(result.anchors[0].system_name, 'Combat System');
      assert.ok(result.anchors[0].related_rules.includes('RULE-COMBAT-001'));
    });

    it('returns empty arrays when systemsDir does not exist', () => {
      const { extract7AAnchors } = require('./data-schema.cjs');

      // Use a tmpDir without systems directory
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-empty-'));
      try {
        const result = extract7AAnchors(emptyDir);
        assert.deepStrictEqual(result.anchors, []);
        assert.deepStrictEqual(result.systems, []);
      } finally {
        fs.rmSync(emptyDir, { recursive: true, force: true });
      }
    });

    it('deduplicates table names across systems, merging related_rules', () => {
      const { extract7AAnchors } = require('./data-schema.cjs');

      // System 1 references reward_config
      const sys1 = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-COMBAT-001.md');
      fs.writeFileSync(sys1, `---
system_id: SYS-COMBAT-001
system_name: Combat
status: complete
---

## 7A. Data Schema Anchors

| Table Name | Purpose | Related Rules |
|-----------|---------|---------------|
| reward_config | Battle rewards | RULE-COMBAT-001 |

## 7B. Numerical Balance Inputs
`, 'utf-8');

      // System 2 also references reward_config
      const sys2 = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-ECONOMY-001.md');
      fs.writeFileSync(sys2, `---
system_id: SYS-ECONOMY-001
system_name: Economy
status: complete
---

## 7A. Data Schema Anchors

| Table Name | Purpose | Related Rules |
|-----------|---------|---------------|
| reward_config | Economy rewards | RULE-ECONOMY-001 |

## 7B. Numerical Balance Inputs
`, 'utf-8');

      const result = extract7AAnchors(tmpDir);

      // Should be deduplicated to 1 anchor
      const rewardAnchors = result.anchors.filter(a => a.table_name === 'reward_config');
      assert.strictEqual(rewardAnchors.length, 1);
      // Merged rules should contain both
      assert.ok(rewardAnchors[0].related_rules.includes('RULE-COMBAT-001'));
      assert.ok(rewardAnchors[0].related_rules.includes('RULE-ECONOMY-001'));
    });

    it('skips files without 7A sections gracefully', () => {
      const { extract7AAnchors } = require('./data-schema.cjs');

      const systemFile = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-TUTORIAL-001.md');
      fs.writeFileSync(systemFile, `---
system_id: SYS-TUTORIAL-001
system_name: Tutorial
status: complete
---

# System: Tutorial

## 5. Core Rules

No data schema anchors defined.
`, 'utf-8');

      const result = extract7AAnchors(tmpDir);
      assert.deepStrictEqual(result.anchors, []);
      assert.ok(result.systems.includes('SYS-TUTORIAL-001'));
    });
  });

  // ---- isSchemaFrozen -------------------------------------------------------

  describe('isSchemaFrozen', () => {
    it('returns false when no config key exists', () => {
      const { isSchemaFrozen } = require('./data-schema.cjs');
      const result = isSchemaFrozen(tmpDir);
      assert.strictEqual(result, false);
    });

    it('returns true when schema_frozen is true (boolean)', () => {
      const { isSchemaFrozen } = require('./data-schema.cjs');
      const configPath = path.join(tmpDir, '.gf', 'config.json');
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      cfg.schema_frozen = true;
      fs.writeFileSync(configPath, JSON.stringify(cfg), 'utf-8');

      assert.strictEqual(isSchemaFrozen(tmpDir), true);
    });

    it('returns true when schema_frozen is "true" (string)', () => {
      const { isSchemaFrozen } = require('./data-schema.cjs');
      const configPath = path.join(tmpDir, '.gf', 'config.json');
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      cfg.schema_frozen = 'true';
      fs.writeFileSync(configPath, JSON.stringify(cfg), 'utf-8');

      assert.strictEqual(isSchemaFrozen(tmpDir), true);
    });

    it('returns false when schema_frozen is false', () => {
      const { isSchemaFrozen } = require('./data-schema.cjs');
      const configPath = path.join(tmpDir, '.gf', 'config.json');
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      cfg.schema_frozen = false;
      fs.writeFileSync(configPath, JSON.stringify(cfg), 'utf-8');

      assert.strictEqual(isSchemaFrozen(tmpDir), false);
    });
  });

  // ---- setSchemaFrozen ------------------------------------------------------

  describe('setSchemaFrozen', () => {
    it('sets schema_frozen and schema_frozen_at in config', () => {
      const { setSchemaFrozen, isSchemaFrozen } = require('./data-schema.cjs');

      setSchemaFrozen(tmpDir, true);
      assert.strictEqual(isSchemaFrozen(tmpDir), true);

      // Check frozen_at timestamp was set
      const configPath = path.join(tmpDir, '.gf', 'config.json');
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      assert.ok(cfg.schema_frozen_at);
      assert.ok(cfg.schema_frozen_at.includes('T')); // ISO timestamp
    });

    it('can unfreeze by setting false', () => {
      const { setSchemaFrozen, isSchemaFrozen } = require('./data-schema.cjs');

      setSchemaFrozen(tmpDir, true);
      assert.strictEqual(isSchemaFrozen(tmpDir), true);

      setSchemaFrozen(tmpDir, false);
      assert.strictEqual(isSchemaFrozen(tmpDir), false);
    });
  });

  // ---- validateReferentialIntegrity -----------------------------------------

  describe('validateReferentialIntegrity', () => {
    it('returns valid when all FK references exist in referenced table', () => {
      const { validateReferentialIntegrity } = require('./data-schema.cjs');

      const tables = [
        {
          name: 'monster_config',
          fields: [
            { name: 'id', type: 'int', primaryKey: true },
            { name: 'name', type: 'string' },
          ],
          sampleData: [
            [1001, 'Slime'],
            [1002, 'Dragon'],
          ],
        },
        {
          name: 'level_config',
          fields: [
            { name: 'level_id', type: 'int', primaryKey: true },
            { name: 'monster_id', type: 'int', foreignKey: { table: 'monster_config', field: 'id' } },
          ],
          sampleData: [
            [1, 1001],
            [2, 1002],
          ],
        },
      ];

      const result = validateReferentialIntegrity(tables);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.issues.length, 0);
    });

    it('detects orphan FK references', () => {
      const { validateReferentialIntegrity } = require('./data-schema.cjs');

      const tables = [
        {
          name: 'monster_config',
          fields: [
            { name: 'id', type: 'int', primaryKey: true },
            { name: 'name', type: 'string' },
          ],
          sampleData: [
            [1001, 'Slime'],
          ],
        },
        {
          name: 'level_config',
          fields: [
            { name: 'level_id', type: 'int', primaryKey: true },
            { name: 'monster_id', type: 'int', foreignKey: { table: 'monster_config', field: 'id' } },
          ],
          sampleData: [
            [1, 1001],
            [2, 9999], // orphan - monster 9999 does not exist
          ],
        },
      ];

      const result = validateReferentialIntegrity(tables);
      assert.strictEqual(result.valid, false);
      assert.ok(result.issues.length > 0);
      assert.ok(result.issues[0].table === 'level_config');
      assert.ok(result.issues[0].field === 'monster_id');
      assert.ok(result.issues[0].value === 9999);
      assert.ok(result.issues[0].referenced_table === 'monster_config');
    });

    it('returns valid with no FK fields', () => {
      const { validateReferentialIntegrity } = require('./data-schema.cjs');

      const tables = [
        {
          name: 'constants',
          fields: [{ name: 'key', type: 'string' }, { name: 'value', type: 'int' }],
          sampleData: [['max_level', 100]],
        },
      ];

      const result = validateReferentialIntegrity(tables);
      assert.strictEqual(result.valid, true);
    });
  });

  // ---- validateRelationships ------------------------------------------------

  describe('validateRelationships', () => {
    it('returns valid when all relationship tables exist', () => {
      const { validateRelationships } = require('./data-schema.cjs');

      const relationships = [
        { main_table: 'monster_config', related_table: 'skill_config', type: '1:N', key: 'monster_id' },
      ];
      const tableNames = ['monster_config', 'skill_config', 'level_config'];

      const result = validateRelationships(relationships, tableNames);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.issues.length, 0);
    });

    it('detects missing table references in relationships', () => {
      const { validateRelationships } = require('./data-schema.cjs');

      const relationships = [
        { main_table: 'monster_config', related_table: 'nonexistent_table', type: '1:N', key: 'monster_id' },
      ];
      const tableNames = ['monster_config', 'skill_config'];

      const result = validateRelationships(relationships, tableNames);
      assert.strictEqual(result.valid, false);
      assert.ok(result.issues.length > 0);
      assert.ok(result.issues.some(i => i.includes('nonexistent_table')));
    });

    it('detects missing main_table references', () => {
      const { validateRelationships } = require('./data-schema.cjs');

      const relationships = [
        { main_table: 'missing_table', related_table: 'skill_config', type: '1:N', key: 'id' },
      ];
      const tableNames = ['skill_config'];

      const result = validateRelationships(relationships, tableNames);
      assert.strictEqual(result.valid, false);
      assert.ok(result.issues.some(i => i.includes('missing_table')));
    });
  });

  // ---- exports check --------------------------------------------------------

  describe('exports', () => {
    it('exports all required constants and functions', () => {
      const ds = require('./data-schema.cjs');
      // Constants
      assert.ok(Array.isArray(ds.TABLE_LAYERS));
      assert.ok(Array.isArray(ds.FREEZE_LOCKED_FIELDS));
      assert.ok(Array.isArray(ds.FREEZE_ADJUSTABLE_FIELDS));
      // Functions
      assert.strictEqual(typeof ds.extract7AAnchors, 'function');
      assert.strictEqual(typeof ds.tableNameToFilename, 'function');
      assert.strictEqual(typeof ds.escapeCSVField, 'function');
      assert.strictEqual(typeof ds.tableToCSV, 'function');
      assert.strictEqual(typeof ds.syncCSVExports, 'function');
      assert.strictEqual(typeof ds.isSchemaFrozen, 'function');
      assert.strictEqual(typeof ds.setSchemaFrozen, 'function');
      assert.strictEqual(typeof ds.validateReferentialIntegrity, 'function');
      assert.strictEqual(typeof ds.validateRelationships, 'function');
    });
  });
});
