/**
 * Tests for production module -- art anchor extraction, UI anchor extraction,
 * 7C contract extraction, traceability validation, and production status tracking.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('production module', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-production-test-'));
    fs.mkdirSync(path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.gf', 'traceability'), { recursive: true });
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
    const prod = require('./production.cjs');
    assert.ok(prod);
  });

  // ---- extractArtAnchors -------------------------------------------------------

  describe('extractArtAnchors', () => {
    it('extracts art anchor content from Section 8 of system files', () => {
      const { extractArtAnchors } = require('./production.cjs');

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

## 8. Downstream Anchors

### 8.1 Data Anchors
Already extracted by data-schema.cjs

### 8.2 Art Anchors
- Monster sprites: idle, attack, hit, death states
- Boss entrance effects: screen shake + particle burst
- Combat background: arena environment per biome

### 8.3 UI Anchors
- Health bar component with animated damage
- Combo counter overlay

### 8.4 Tech Anchors
- Real-time hit detection callback

## 9. Dependencies
`, 'utf-8');

      const result = extractArtAnchors(tmpDir);
      assert.strictEqual(result.anchors.length, 1);
      assert.strictEqual(result.anchors[0].system_id, 'SYS-COMBAT-001');
      assert.strictEqual(result.anchors[0].system_name, 'Combat System');
      assert.ok(result.anchors[0].raw_art.includes('Monster sprites'));
      assert.ok(result.anchors[0].raw_art.includes('Boss entrance effects'));
      assert.ok(result.anchors[0].raw_art.includes('Combat background'));
      assert.ok(result.systems.includes('SYS-COMBAT-001'));
    });

    it('returns empty arrays when systemsDir does not exist', () => {
      const { extractArtAnchors } = require('./production.cjs');
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-empty-'));
      try {
        const result = extractArtAnchors(emptyDir);
        assert.deepStrictEqual(result.anchors, []);
        assert.deepStrictEqual(result.systems, []);
      } finally {
        fs.rmSync(emptyDir, { recursive: true, force: true });
      }
    });

    it('skips files without Section 8', () => {
      const { extractArtAnchors } = require('./production.cjs');

      const systemFile = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-TUTORIAL-001.md');
      fs.writeFileSync(systemFile, `---
system_id: SYS-TUTORIAL-001
system_name: Tutorial
status: complete
---

# System: Tutorial

## 5. Core Rules

No Section 8 here.
`, 'utf-8');

      const result = extractArtAnchors(tmpDir);
      assert.deepStrictEqual(result.anchors, []);
      assert.ok(result.systems.includes('SYS-TUTORIAL-001'));
    });

    it('returns raw_art content only from the art subsection of Section 8', () => {
      const { extractArtAnchors } = require('./production.cjs');

      const systemFile = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-SHOP-001.md');
      fs.writeFileSync(systemFile, `---
system_id: SYS-SHOP-001
system_name: Shop System
---

## 8. Downstream Anchors

### 8.2 Art Anchors
- Shop background illustration
- Item icons (64x64)

### 8.3 UI Anchors
- Shop grid layout
`, 'utf-8');

      const result = extractArtAnchors(tmpDir);
      assert.strictEqual(result.anchors.length, 1);
      assert.ok(result.anchors[0].raw_art.includes('Shop background'));
      assert.ok(result.anchors[0].raw_art.includes('Item icons'));
      // Should NOT include UI content
      assert.ok(!result.anchors[0].raw_art.includes('Shop grid layout'));
    });
  });

  // ---- extractUIAnchors --------------------------------------------------------

  describe('extractUIAnchors', () => {
    it('extracts UI anchor content from Section 8 of system files', () => {
      const { extractUIAnchors } = require('./production.cjs');

      const systemFile = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-COMBAT-001.md');
      fs.writeFileSync(systemFile, `---
system_id: SYS-COMBAT-001
system_name: Combat System
status: complete
---

## 8. Downstream Anchors

### 8.2 Art Anchors
- Monster sprites for all states

### 8.3 UI Anchors
- Health bar with animated damage feedback
- Combo counter with multiplier display
- Skill cooldown wheel

### 8.4 Tech Anchors
- Hit detection callback
`, 'utf-8');

      const result = extractUIAnchors(tmpDir);
      assert.strictEqual(result.anchors.length, 1);
      assert.strictEqual(result.anchors[0].system_id, 'SYS-COMBAT-001');
      assert.strictEqual(result.anchors[0].system_name, 'Combat System');
      assert.ok(result.anchors[0].raw_ui.includes('Health bar'));
      assert.ok(result.anchors[0].raw_ui.includes('Combo counter'));
      assert.ok(result.anchors[0].raw_ui.includes('Skill cooldown'));
      assert.ok(result.systems.includes('SYS-COMBAT-001'));
    });

    it('returns empty arrays when systemsDir does not exist', () => {
      const { extractUIAnchors } = require('./production.cjs');
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-empty-'));
      try {
        const result = extractUIAnchors(emptyDir);
        assert.deepStrictEqual(result.anchors, []);
        assert.deepStrictEqual(result.systems, []);
      } finally {
        fs.rmSync(emptyDir, { recursive: true, force: true });
      }
    });

    it('skips files without Section 8', () => {
      const { extractUIAnchors } = require('./production.cjs');

      const systemFile = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-TUTORIAL-001.md');
      fs.writeFileSync(systemFile, `---
system_id: SYS-TUTORIAL-001
system_name: Tutorial
---

## 5. Core Rules

No Section 8.
`, 'utf-8');

      const result = extractUIAnchors(tmpDir);
      assert.deepStrictEqual(result.anchors, []);
      assert.ok(result.systems.includes('SYS-TUTORIAL-001'));
    });

    it('returns raw_ui content only from the UI subsection of Section 8', () => {
      const { extractUIAnchors } = require('./production.cjs');

      const systemFile = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-SHOP-001.md');
      fs.writeFileSync(systemFile, `---
system_id: SYS-SHOP-001
system_name: Shop System
---

## 8. Downstream Anchors

### 8.2 Art Anchors
- Shop background illustration

### 8.3 UI Anchors
- Shop grid layout with scrollable categories
- Item detail popup with buy/sell buttons

### 8.4 Tech Anchors
- Inventory sync callback
`, 'utf-8');

      const result = extractUIAnchors(tmpDir);
      assert.strictEqual(result.anchors.length, 1);
      assert.ok(result.anchors[0].raw_ui.includes('Shop grid layout'));
      assert.ok(result.anchors[0].raw_ui.includes('Item detail popup'));
      // Should NOT include art or tech content
      assert.ok(!result.anchors[0].raw_ui.includes('Shop background'));
      assert.ok(!result.anchors[0].raw_ui.includes('Inventory sync'));
    });
  });

  // ---- extract7CContracts ------------------------------------------------------

  describe('extract7CContracts', () => {
    it('extracts Section 10 (7C contracts) from system files', () => {
      const { extract7CContracts } = require('./production.cjs');

      const systemFile = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-COMBAT-001.md');
      fs.writeFileSync(systemFile, `---
system_id: SYS-COMBAT-001
system_name: Combat System
status: complete
---

# System: Combat System

## 9. Dependencies

- SYS-INVENTORY-001

## 10. Program Implementation Contracts (7C)

### 10.1 State Machine
- CombatState: IDLE -> ENGAGING -> RESOLVING -> COMPLETE

### 10.2 Event Bus Contracts
- combat.start: {enemy_id, player_stats}
- combat.end: {result, rewards}

### 10.3 Formula Pseudo-Code
- damage = ATK * multiplier - DEF * 0.5

## 11. Version History
`, 'utf-8');

      const result = extract7CContracts(tmpDir);
      assert.strictEqual(result.contracts.length, 1);
      assert.strictEqual(result.contracts[0].system_id, 'SYS-COMBAT-001');
      assert.strictEqual(result.contracts[0].system_name, 'Combat System');
      assert.ok(result.contracts[0].raw_7c.includes('State Machine'));
      assert.ok(result.contracts[0].raw_7c.includes('Event Bus'));
      assert.ok(result.contracts[0].raw_7c.includes('Formula'));
      assert.ok(result.systems.includes('SYS-COMBAT-001'));
    });

    it('returns empty arrays when systemsDir does not exist', () => {
      const { extract7CContracts } = require('./production.cjs');
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-empty-'));
      try {
        const result = extract7CContracts(emptyDir);
        assert.deepStrictEqual(result.contracts, []);
        assert.deepStrictEqual(result.systems, []);
      } finally {
        fs.rmSync(emptyDir, { recursive: true, force: true });
      }
    });

    it('skips files without Section 10', () => {
      const { extract7CContracts } = require('./production.cjs');

      const systemFile = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-TUTORIAL-001.md');
      fs.writeFileSync(systemFile, `---
system_id: SYS-TUTORIAL-001
system_name: Tutorial
---

## 9. Dependencies

No Section 10 here.
`, 'utf-8');

      const result = extract7CContracts(tmpDir);
      assert.deepStrictEqual(result.contracts, []);
      assert.ok(result.systems.includes('SYS-TUTORIAL-001'));
    });

    it('extracts from "## 10" header (NOT "## 7C") per locked decision', () => {
      const { extract7CContracts } = require('./production.cjs');

      const systemFile = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-SHOP-001.md');
      fs.writeFileSync(systemFile, `---
system_id: SYS-SHOP-001
system_name: Shop System
---

## 7C. This Is Not The Section

This should NOT be extracted.

## 10. Program Implementation Contracts (7C)

### 10.1 State Machine
- ShopState: BROWSING -> PURCHASING -> CONFIRMING -> COMPLETE

## 11. Version History
`, 'utf-8');

      const result = extract7CContracts(tmpDir);
      assert.strictEqual(result.contracts.length, 1);
      assert.ok(result.contracts[0].raw_7c.includes('ShopState'));
      assert.ok(!result.contracts[0].raw_7c.includes('This should NOT'));
    });

    it('extracts Section 10 content to end of file when no next heading', () => {
      const { extract7CContracts } = require('./production.cjs');

      const systemFile = path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems', 'SYS-LAST-001.md');
      fs.writeFileSync(systemFile, `---
system_id: SYS-LAST-001
system_name: Last System
---

## 10. Program Implementation Contracts (7C)

Final section content here.
Last line of the file.
`, 'utf-8');

      const result = extract7CContracts(tmpDir);
      assert.strictEqual(result.contracts.length, 1);
      assert.ok(result.contracts[0].raw_7c.includes('Final section content'));
      assert.ok(result.contracts[0].raw_7c.includes('Last line'));
    });
  });

  // ---- validateSpecTraceability ------------------------------------------------

  describe('validateSpecTraceability', () => {
    it('returns valid=true with empty specIds', () => {
      const { validateSpecTraceability } = require('./production.cjs');

      const result = validateSpecTraceability(tmpDir, []);
      assert.strictEqual(result.valid, true);
      assert.deepStrictEqual(result.issues, []);
    });

    it('returns valid=true when all IDs are registered', () => {
      const { validateSpecTraceability } = require('./production.cjs');

      // Create registry with entries
      const registry = {
        gf_registry_version: '1.0',
        entries: [
          { id: 'SYS-COMBAT-001', type: 'SYS', name: 'Combat System' },
          { id: 'RULE-COMBAT-001', type: 'RULE', name: 'Attack Rule' },
        ],
        concept_entries: [],
      };
      fs.writeFileSync(
        path.join(tmpDir, '.gf', 'traceability', 'id-registry.json'),
        JSON.stringify(registry),
        'utf-8'
      );

      const result = validateSpecTraceability(tmpDir, ['SYS-COMBAT-001', 'RULE-COMBAT-001']);
      assert.strictEqual(result.valid, true);
      assert.deepStrictEqual(result.issues, []);
    });

    it('returns valid=false with issues for unregistered IDs', () => {
      const { validateSpecTraceability } = require('./production.cjs');

      // Create registry with only one entry
      const registry = {
        gf_registry_version: '1.0',
        entries: [
          { id: 'SYS-COMBAT-001', type: 'SYS', name: 'Combat System' },
        ],
        concept_entries: [],
      };
      fs.writeFileSync(
        path.join(tmpDir, '.gf', 'traceability', 'id-registry.json'),
        JSON.stringify(registry),
        'utf-8'
      );

      const result = validateSpecTraceability(tmpDir, ['SYS-COMBAT-001', 'SYS-UNKNOWN-999', 'RULE-MISSING-001']);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.issues.length, 2);
      assert.ok(result.issues.some(i => i.includes('SYS-UNKNOWN-999')));
      assert.ok(result.issues.some(i => i.includes('RULE-MISSING-001')));
    });

    it('returns valid=false when registry does not exist', () => {
      const { validateSpecTraceability } = require('./production.cjs');

      // No registry file created -- tmpDir has no id-registry.json
      const result = validateSpecTraceability(tmpDir, ['SYS-COMBAT-001']);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.issues.length, 1);
    });
  });

  // ---- getProductionStatus ----------------------------------------------------

  describe('getProductionStatus', () => {
    it('returns "not_started" when no production config exists', () => {
      const { getProductionStatus } = require('./production.cjs');

      const result = getProductionStatus(tmpDir);
      assert.strictEqual(result, 'not_started');
    });

    it('returns stored status when set', () => {
      const { getProductionStatus, setProductionStatus } = require('./production.cjs');

      setProductionStatus(tmpDir, 'in_progress');
      assert.strictEqual(getProductionStatus(tmpDir), 'in_progress');
    });
  });

  // ---- setProductionStatus ----------------------------------------------------

  describe('setProductionStatus', () => {
    it('sets production_status in config', () => {
      const { setProductionStatus } = require('./production.cjs');
      const config = require('./config.cjs');

      setProductionStatus(tmpDir, 'complete');
      assert.strictEqual(config.getConfigValue(tmpDir, 'production_status'), 'complete');
    });
  });

  // ---- exports check ----------------------------------------------------------

  describe('exports', () => {
    it('exports all 6 required functions', () => {
      const prod = require('./production.cjs');
      assert.strictEqual(typeof prod.extractArtAnchors, 'function');
      assert.strictEqual(typeof prod.extractUIAnchors, 'function');
      assert.strictEqual(typeof prod.extract7CContracts, 'function');
      assert.strictEqual(typeof prod.validateSpecTraceability, 'function');
      assert.strictEqual(typeof prod.getProductionStatus, 'function');
      assert.strictEqual(typeof prod.setProductionStatus, 'function');
    });
  });
});
