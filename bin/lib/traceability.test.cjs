/**
 * Tests for traceability module -- ID registry operations
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('traceability module', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-trace-test-'));
    // Create .gf directory
    fs.mkdirSync(path.join(tmpDir, '.gf', 'traceability'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('module loads without error', () => {
    const trace = require('./traceability.cjs');
    assert.ok(trace);
    assert.strictEqual(typeof trace.initRegistry, 'function');
    assert.strictEqual(typeof trace.addId, 'function');
    assert.strictEqual(typeof trace.lookupId, 'function');
    assert.strictEqual(typeof trace.validateRegistry, 'function');
  });

  describe('initRegistry', () => {
    it('creates id-registry.json with empty entries', () => {
      const trace = require('./traceability.cjs');
      const result = trace.initRegistry(tmpDir);

      assert.ok(result.success);
      const registryPath = path.join(tmpDir, '.gf', 'traceability', 'id-registry.json');
      assert.ok(fs.existsSync(registryPath));

      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
      assert.strictEqual(registry.gf_registry_version, '1.0');
      assert.ok(registry.id_convention);
      assert.strictEqual(registry.id_convention.format, '{TYPE}-{SYSTEM}-{NNN}');
      assert.ok(registry.id_convention.types);
      assert.strictEqual(registry.id_convention.types.SYS, 'System');
      assert.strictEqual(registry.id_convention.types.RULE, 'Rule');
      assert.strictEqual(registry.id_convention.types.TBL, 'Table');
      assert.strictEqual(registry.id_convention.types.FLD, 'Field');
      assert.strictEqual(registry.id_convention.types.AST, 'Asset');
      assert.strictEqual(registry.id_convention.example, 'SYS-COMBAT-001');
      assert.ok(Array.isArray(registry.entries));
      assert.strictEqual(registry.entries.length, 0);
    });
  });

  describe('addId', () => {
    it('adds a valid entry to the registry', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);

      const result = trace.addId(tmpDir, {
        id: 'SYS-COMBAT-001',
        type: 'SYS',
        system: 'COMBAT',
        description: 'Core combat system',
        source_stage: 'concept',
        source_id: 'concept-rule-1',
      });

      assert.ok(result.success);

      // Verify it's in the registry
      const registryPath = path.join(tmpDir, '.gf', 'traceability', 'id-registry.json');
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
      assert.strictEqual(registry.entries.length, 1);
      assert.strictEqual(registry.entries[0].id, 'SYS-COMBAT-001');
      assert.strictEqual(registry.entries[0].type, 'SYS');
      assert.strictEqual(registry.entries[0].system, 'COMBAT');
      assert.strictEqual(registry.entries[0].description, 'Core combat system');
    });

    it('rejects duplicate IDs', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);

      trace.addId(tmpDir, {
        id: 'RULE-LEVEL-001',
        type: 'RULE',
        system: 'LEVEL',
        description: 'Level progression rule',
      });

      const result = trace.addId(tmpDir, {
        id: 'RULE-LEVEL-001',
        type: 'RULE',
        system: 'LEVEL',
        description: 'Duplicate rule',
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Duplicate'));
    });

    it('rejects invalid ID format', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);

      const result = trace.addId(tmpDir, {
        id: 'INVALID-FORMAT',
        type: 'SYS',
        system: 'TEST',
        description: 'Bad format',
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Invalid ID format'));
    });

    it('rejects entries with missing required fields', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);

      const result = trace.addId(tmpDir, {
        id: 'SYS-TEST-001',
        // missing type, system, description
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Missing required'));
    });
  });

  describe('lookupId', () => {
    it('finds an existing ID', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);
      trace.addId(tmpDir, {
        id: 'TBL-PLAYER-001',
        type: 'TBL',
        system: 'PLAYER',
        description: 'Player data table',
      });

      const entry = trace.lookupId(tmpDir, 'TBL-PLAYER-001');
      assert.ok(entry);
      assert.strictEqual(entry.id, 'TBL-PLAYER-001');
      assert.strictEqual(entry.description, 'Player data table');
    });

    it('returns null for non-existent ID', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);

      const entry = trace.lookupId(tmpDir, 'SYS-NONEXIST-999');
      assert.strictEqual(entry, null);
    });
  });

  describe('validateRegistry', () => {
    it('validates empty registry as valid', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);

      const result = trace.validateRegistry(tmpDir);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('validates a registry with valid entries', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);
      trace.addId(tmpDir, {
        id: 'SYS-COMBAT-001',
        type: 'SYS',
        system: 'COMBAT',
        description: 'Combat system',
      });
      trace.addId(tmpDir, {
        id: 'RULE-COMBAT-001',
        type: 'RULE',
        system: 'COMBAT',
        description: 'Basic attack rule',
      });

      const result = trace.validateRegistry(tmpDir);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('detects duplicate IDs via manual registry corruption', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);

      // Manually corrupt the registry with duplicate
      const registryPath = path.join(tmpDir, '.gf', 'traceability', 'id-registry.json');
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
      registry.entries.push(
        { id: 'SYS-DUP-001', type: 'SYS', system: 'DUP', description: 'First' },
        { id: 'SYS-DUP-001', type: 'SYS', system: 'DUP', description: 'Second' }
      );
      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');

      const result = trace.validateRegistry(tmpDir);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('Duplicate')));
    });

    it('returns invalid for missing registry', () => {
      const trace = require('./traceability.cjs');
      // Don't init registry -- just check a dir without one
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-empty-'));
      const result = trace.validateRegistry(emptyDir);
      assert.strictEqual(result.valid, false);
      fs.rmSync(emptyDir, { recursive: true, force: true });
    });
  });

  // ---- Concept-stage ID extensions ------------------------------------------

  describe('CONCEPT_ID_PATTERN', () => {
    it('is exported as a RegExp', () => {
      const trace = require('./traceability.cjs');
      assert.ok(trace.CONCEPT_ID_PATTERN instanceof RegExp);
    });

    it('matches R_3_01', () => {
      const trace = require('./traceability.cjs');
      assert.ok(trace.CONCEPT_ID_PATTERN.test('R_3_01'));
    });

    it('does not match TYPE-SYSTEM-NNN format', () => {
      const trace = require('./traceability.cjs');
      assert.strictEqual(trace.CONCEPT_ID_PATTERN.test('RULE-SYS-001'), false);
    });
  });

  describe('initRegistry with concept_entries', () => {
    it('creates registry with both entries and concept_entries arrays', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);

      const registryPath = path.join(tmpDir, '.gf', 'traceability', 'id-registry.json');
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
      assert.ok(Array.isArray(registry.entries));
      assert.ok(Array.isArray(registry.concept_entries));
      assert.strictEqual(registry.concept_entries.length, 0);
    });
  });

  describe('addConceptId', () => {
    it('adds a valid concept entry', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);

      const result = trace.addConceptId(tmpDir, {
        id: 'R_3_01',
        chapter: 3,
        description: 'Merge requires adjacency',
        data_bearing_type: 'level_config',
      });

      assert.ok(result.success);

      // Verify it's in concept_entries
      const registryPath = path.join(tmpDir, '.gf', 'traceability', 'id-registry.json');
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
      assert.strictEqual(registry.concept_entries.length, 1);
      assert.strictEqual(registry.concept_entries[0].id, 'R_3_01');
      assert.strictEqual(registry.concept_entries[0].chapter, 3);
      assert.strictEqual(registry.concept_entries[0].data_bearing_type, 'level_config');
    });

    it('rejects IDs not matching R_N_NN format', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);

      const result = trace.addConceptId(tmpDir, {
        id: 'INVALID',
        chapter: 3,
        description: 'Bad ID',
        data_bearing_type: 'level_config',
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('rejects duplicate concept IDs', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);

      trace.addConceptId(tmpDir, {
        id: 'R_3_01',
        chapter: 3,
        description: 'First entry',
        data_bearing_type: 'level_config',
      });

      const result = trace.addConceptId(tmpDir, {
        id: 'R_3_01',
        chapter: 3,
        description: 'Duplicate entry',
        data_bearing_type: 'level_config',
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Duplicate'));
    });

    it('rejects invalid data_bearing_type', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);

      const result = trace.addConceptId(tmpDir, {
        id: 'R_3_01',
        chapter: 3,
        description: 'Bad type',
        data_bearing_type: 'invalid_type',
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('rejects entries with missing required fields', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);

      const result = trace.addConceptId(tmpDir, {
        id: 'R_3_01',
        // missing chapter, description, data_bearing_type
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  describe('lookupConceptId', () => {
    it('finds an existing concept ID', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);
      trace.addConceptId(tmpDir, {
        id: 'R_5_02',
        chapter: 5,
        description: 'Level progression formula',
        data_bearing_type: 'growth_config',
      });

      const entry = trace.lookupConceptId(tmpDir, 'R_5_02');
      assert.ok(entry);
      assert.strictEqual(entry.id, 'R_5_02');
      assert.strictEqual(entry.description, 'Level progression formula');
    });

    it('returns null for non-existent concept ID', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);

      const entry = trace.lookupConceptId(tmpDir, 'R_99_01');
      assert.strictEqual(entry, null);
    });
  });

  describe('validateRegistry with concept_entries', () => {
    it('validates registry with valid concept_entries', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);
      trace.addConceptId(tmpDir, {
        id: 'R_1_01',
        chapter: 1,
        description: 'Target user age range',
        data_bearing_type: 'constant_config',
      });

      const result = trace.validateRegistry(tmpDir);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('detects duplicate concept IDs via manual corruption', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);

      const registryPath = path.join(tmpDir, '.gf', 'traceability', 'id-registry.json');
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
      registry.concept_entries.push(
        { id: 'R_3_01', chapter: 3, description: 'First', data_bearing_type: 'level_config' },
        { id: 'R_3_01', chapter: 3, description: 'Second', data_bearing_type: 'level_config' }
      );
      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');

      const result = trace.validateRegistry(tmpDir);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('Duplicate')));
    });

    it('detects invalid concept ID format via manual corruption', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);

      const registryPath = path.join(tmpDir, '.gf', 'traceability', 'id-registry.json');
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
      registry.concept_entries.push(
        { id: 'BADFORMAT', chapter: 3, description: 'Bad', data_bearing_type: 'level_config' }
      );
      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');

      const result = trace.validateRegistry(tmpDir);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('Invalid')));
    });
  });

  // ---- Backward compatibility -----------------------------------------------

  describe('backward compatibility', () => {
    it('existing addId still works after extension', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);

      const result = trace.addId(tmpDir, {
        id: 'SYS-COMBAT-001',
        type: 'SYS',
        system: 'COMBAT',
        description: 'Combat system',
      });

      assert.ok(result.success);
    });

    it('existing lookupId still works after extension', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);
      trace.addId(tmpDir, {
        id: 'SYS-COMBAT-001',
        type: 'SYS',
        system: 'COMBAT',
        description: 'Combat system',
      });

      const entry = trace.lookupId(tmpDir, 'SYS-COMBAT-001');
      assert.ok(entry);
      assert.strictEqual(entry.id, 'SYS-COMBAT-001');
    });

    it('concept_entries and entries are separate', () => {
      const trace = require('./traceability.cjs');
      trace.initRegistry(tmpDir);

      trace.addId(tmpDir, {
        id: 'SYS-COMBAT-001',
        type: 'SYS',
        system: 'COMBAT',
        description: 'Combat system',
      });

      trace.addConceptId(tmpDir, {
        id: 'R_3_01',
        chapter: 3,
        description: 'Merge rule',
        data_bearing_type: 'level_config',
      });

      const registryPath = path.join(tmpDir, '.gf', 'traceability', 'id-registry.json');
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
      assert.strictEqual(registry.entries.length, 1);
      assert.strictEqual(registry.concept_entries.length, 1);
    });

    it('validateRegistry handles registries without concept_entries (graceful degradation)', () => {
      const trace = require('./traceability.cjs');
      // Manually create a registry without concept_entries
      const registryPath = path.join(tmpDir, '.gf', 'traceability', 'id-registry.json');
      const oldRegistry = {
        gf_registry_version: '1.0',
        id_convention: { format: '{TYPE}-{SYSTEM}-{NNN}', types: {} },
        entries: [],
      };
      fs.writeFileSync(registryPath, JSON.stringify(oldRegistry, null, 2), 'utf-8');

      const result = trace.validateRegistry(tmpDir);
      assert.strictEqual(result.valid, true);
    });
  });
});
