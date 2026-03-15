/**
 * Tests for init module -- project initialization and CLI router
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('init module', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-init-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('module loads without error', () => {
    const init = require('./init.cjs');
    assert.ok(init);
    assert.strictEqual(typeof init.cmdScaffoldProject, 'function');
    assert.strictEqual(typeof init.cmdInitNewGame, 'function');
    assert.strictEqual(typeof init.cmdInitResume, 'function');
    assert.strictEqual(typeof init.cmdInitProgress, 'function');
  });

  describe('cmdScaffoldProject', () => {
    it('creates complete .gf/ directory structure', () => {
      const init = require('./init.cjs');
      const result = init.cmdScaffoldProject(tmpDir, {
        name: 'Test RPG',
        language: 'en',
        genre: 'rpg',
        platform: 'mobile',
        monetization: 'free-to-play',
        entry_path: 'scratch',
      });

      // Check all directories exist
      assert.ok(fs.existsSync(path.join(tmpDir, '.gf')));
      assert.ok(fs.existsSync(path.join(tmpDir, '.gf', 'stages', '01-concept')));
      assert.ok(fs.existsSync(path.join(tmpDir, '.gf', 'stages', '02-system-design', 'systems')));
      assert.ok(fs.existsSync(path.join(tmpDir, '.gf', 'stages', '03a-data-schema')));
      assert.ok(fs.existsSync(path.join(tmpDir, '.gf', 'stages', '03b-balance', 'configs')));
      assert.ok(fs.existsSync(path.join(tmpDir, '.gf', 'stages', '04-production')));
      assert.ok(fs.existsSync(path.join(tmpDir, '.gf', 'traceability')));

      // Check files exist
      assert.ok(fs.existsSync(path.join(tmpDir, '.gf', 'config.json')));
      assert.ok(fs.existsSync(path.join(tmpDir, '.gf', 'STATE.md')));
      assert.ok(fs.existsSync(path.join(tmpDir, '.gf', 'PROJECT.md')));
      assert.ok(fs.existsSync(path.join(tmpDir, '.gf', 'traceability', 'id-registry.json')));

      // Check result
      assert.ok(result.success);
    });

    it('creates correct config.json with user settings', () => {
      const init = require('./init.cjs');
      init.cmdScaffoldProject(tmpDir, {
        name: 'My Puzzle Game',
        language: 'zh',
        genre: 'puzzle',
        platform: 'PC',
        monetization: 'premium',
        entry_path: 'scratch',
      });

      const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.gf', 'config.json'), 'utf-8'));
      assert.strictEqual(config.project_name, 'My Puzzle Game');
      assert.strictEqual(config.language, 'zh');
      assert.strictEqual(config.genre, 'puzzle');
      assert.strictEqual(config.platform, 'PC');
      assert.strictEqual(config.monetization, 'premium');
      assert.strictEqual(config.entry_path, 'scratch');
    });

    it('creates STATE.md with initial template', () => {
      const init = require('./init.cjs');
      init.cmdScaffoldProject(tmpDir, {
        name: 'Test Game',
        language: 'en',
        genre: 'casual',
        entry_path: 'scratch',
      });

      const stateContent = fs.readFileSync(path.join(tmpDir, '.gf', 'STATE.md'), 'utf-8');
      // Should have frontmatter
      assert.ok(stateContent.startsWith('---\n'));
      // Should have key fields
      assert.ok(stateContent.includes('current_stage'));
      assert.ok(stateContent.includes('status'));
      assert.ok(stateContent.includes('Test Game'));
    });

    it('creates different PROJECT.md for scratch vs reference entry path', () => {
      const init = require('./init.cjs');

      // Create scratch project
      const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-scratch-'));
      init.cmdScaffoldProject(scratchDir, {
        name: 'Scratch Game',
        language: 'en',
        genre: 'casual',
        entry_path: 'scratch',
      });

      // Create reference project
      const refDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-ref-'));
      init.cmdScaffoldProject(refDir, {
        name: 'Reference Game',
        language: 'en',
        genre: 'casual',
        entry_path: 'reference',
      });

      const scratchProject = fs.readFileSync(path.join(scratchDir, '.gf', 'PROJECT.md'), 'utf-8');
      const refProject = fs.readFileSync(path.join(refDir, '.gf', 'PROJECT.md'), 'utf-8');

      // They should be different
      assert.notStrictEqual(scratchProject, refProject);
      // Scratch should mention original idea/vision
      assert.ok(scratchProject.includes('scratch') || scratchProject.includes('original') || scratchProject.includes('vision'));
      // Reference should mention reference/existing
      assert.ok(refProject.includes('reference') || refProject.includes('existing') || refProject.includes('Reference'));

      // Cleanup
      fs.rmSync(scratchDir, { recursive: true, force: true });
      fs.rmSync(refDir, { recursive: true, force: true });
    });

    it('creates valid id-registry.json', () => {
      const init = require('./init.cjs');
      init.cmdScaffoldProject(tmpDir, {
        name: 'Test',
        language: 'en',
        genre: 'casual',
        entry_path: 'scratch',
      });

      const registry = JSON.parse(fs.readFileSync(path.join(tmpDir, '.gf', 'traceability', 'id-registry.json'), 'utf-8'));
      assert.strictEqual(registry.gf_registry_version, '1.0');
      assert.ok(registry.id_convention);
      assert.ok(Array.isArray(registry.entries));
      assert.strictEqual(registry.entries.length, 0);
    });
  });

  describe('cmdInitNewGame', () => {
    it('returns project_exists: false when no .gf/ exists', () => {
      const init = require('./init.cjs');
      const result = init.cmdInitNewGame(tmpDir);
      assert.strictEqual(result.project_exists, false);
      assert.strictEqual(typeof result.has_git, 'boolean');
    });

    it('returns project_exists: true when .gf/ exists', () => {
      const init = require('./init.cjs');
      // Create .gf directory
      fs.mkdirSync(path.join(tmpDir, '.gf'), { recursive: true });
      const result = init.cmdInitNewGame(tmpDir);
      assert.strictEqual(result.project_exists, true);
    });
  });

  describe('cmdInitResume', () => {
    it('returns project_exists: false when no project', () => {
      const init = require('./init.cjs');
      const result = init.cmdInitResume(tmpDir);
      assert.strictEqual(result.project_exists, false);
    });

    it('returns full context when project exists', () => {
      const init = require('./init.cjs');
      // Scaffold a project first
      init.cmdScaffoldProject(tmpDir, {
        name: 'Resume Test',
        language: 'en',
        genre: 'rpg',
        entry_path: 'scratch',
      });

      const result = init.cmdInitResume(tmpDir);
      assert.strictEqual(result.project_exists, true);
      assert.strictEqual(result.project_name, 'Resume Test');
      assert.ok(result.stages);
      assert.ok(result.language);
    });
  });

  describe('cmdInitProgress', () => {
    it('returns project_exists: false when no project', () => {
      const init = require('./init.cjs');
      const result = init.cmdInitProgress(tmpDir);
      assert.strictEqual(result.project_exists, false);
    });

    it('returns stages and current_stage when project exists', () => {
      const init = require('./init.cjs');
      init.cmdScaffoldProject(tmpDir, {
        name: 'Progress Test',
        language: 'en',
        genre: 'casual',
        entry_path: 'scratch',
      });

      const result = init.cmdInitProgress(tmpDir);
      assert.strictEqual(result.project_exists, true);
      assert.strictEqual(result.project_name, 'Progress Test');
      assert.ok(result.stages);
    });
  });
});
