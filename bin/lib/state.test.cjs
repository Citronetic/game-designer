/**
 * Tests for state.cjs -- STATE.md management
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('state.cjs', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-state-test-'));
    fs.mkdirSync(path.join(tmpDir, '.gf'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const state = require('./state.cjs');

  describe('loadState', () => {
    it('returns parsed {frontmatter, body} from .gf/STATE.md', () => {
      const content = '---\nstatus: in_progress\nstage: concept\n---\n\n# Project State\n\n**Current Stage:** concept\n';
      fs.writeFileSync(path.join(tmpDir, '.gf', 'STATE.md'), content);

      const result = state.loadState(tmpDir);
      assert.ok(result);
      assert.strictEqual(result.frontmatter.status, 'in_progress');
      assert.strictEqual(result.frontmatter.stage, 'concept');
      assert.ok(result.body.includes('# Project State'));
    });

    it('returns default when STATE.md is missing', () => {
      const result = state.loadState(tmpDir);
      assert.ok(result === null || (result.frontmatter && Object.keys(result.frontmatter).length === 0));
    });
  });

  describe('writeStateMd', () => {
    it('writes content and syncs frontmatter from body', () => {
      const body = '# Project State\n\n**Current Stage:** concept\n**Status:** in_progress\n';
      state.writeStateMd(tmpDir, body);

      const written = fs.readFileSync(path.join(tmpDir, '.gf', 'STATE.md'), 'utf-8');
      assert.ok(written.startsWith('---\n'), 'Should have frontmatter');
      assert.ok(written.includes('# Project State'), 'Should preserve body');
    });

    it('produces frontmatter that matches body content', () => {
      const body = '# Project State\n\n**Current Stage:** system_design\n**Status:** complete\n';
      state.writeStateMd(tmpDir, body);

      const written = fs.readFileSync(path.join(tmpDir, '.gf', 'STATE.md'), 'utf-8');
      const { extractFrontmatter } = require('./frontmatter.cjs');
      const parsed = extractFrontmatter(written);

      // Frontmatter should reflect the body values
      assert.strictEqual(parsed.frontmatter.current_stage, 'system_design');
      assert.ok(parsed.frontmatter.status);
    });
  });

  describe('updateStateField', () => {
    it('updates a single field in STATE.md', () => {
      const content = '---\nstatus: pending\n---\n\n# Project State\n\n**Current Stage:** concept\n**Status:** pending\n';
      fs.writeFileSync(path.join(tmpDir, '.gf', 'STATE.md'), content);

      state.updateStateField(tmpDir, 'Current Stage', 'system_design');

      const updated = fs.readFileSync(path.join(tmpDir, '.gf', 'STATE.md'), 'utf-8');
      assert.ok(updated.includes('system_design'));
    });
  });

  describe('patchState', () => {
    it('batch updates multiple fields', () => {
      const content = '---\nstatus: pending\n---\n\n# Project State\n\n**Current Stage:** concept\n**Status:** pending\n**Language:** en\n';
      fs.writeFileSync(path.join(tmpDir, '.gf', 'STATE.md'), content);

      state.patchState(tmpDir, {
        'Current Stage': 'system_design',
        'Status': 'in_progress',
      });

      const updated = fs.readFileSync(path.join(tmpDir, '.gf', 'STATE.md'), 'utf-8');
      assert.ok(updated.includes('system_design'));
      assert.ok(updated.includes('in_progress'));
    });
  });
});
