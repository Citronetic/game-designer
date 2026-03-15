/**
 * Tests for progress module -- pipeline visualization and stage details
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('progress module', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-progress-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('module loads without error', () => {
    const progress = require('./progress.cjs');
    assert.ok(progress);
    assert.strictEqual(typeof progress.renderPipeline, 'function');
    assert.strictEqual(typeof progress.renderStageTable, 'function');
    assert.strictEqual(typeof progress.cmdProgress, 'function');
  });

  describe('renderPipeline', () => {
    it('renders pipeline with all-pending stages', () => {
      const progress = require('./progress.cjs');
      const result = progress.renderPipeline({
        project_name: 'Test Game',
        stages: {
          concept: 'pending',
          system_design: 'pending',
          data_schema: 'pending',
          balance: 'pending',
          production: 'pending',
        },
      });

      assert.ok(typeof result === 'string');
      assert.ok(result.includes('Test Game'));
      // All should show pending indicator 'o'
      const lines = result.split('\n');
      const statusLine = lines.find(l => l.trim().match(/^[o*+]\s+[o*+]\s+[o*+]\s+[o*+]\s+[o*+]$/));
      assert.ok(statusLine, 'Should have a line with 5 status indicators');
      // All should be 'o' for pending
      assert.ok(statusLine.trim() === 'o          o              o             o            o'
        || statusLine.trim().match(/^o\s+o\s+o\s+o\s+o$/));
    });

    it('renders pipeline with mixed statuses', () => {
      const progress = require('./progress.cjs');
      const result = progress.renderPipeline({
        project_name: 'Mixed Game',
        stages: {
          concept: 'complete',
          system_design: 'in_progress',
          data_schema: 'pending',
          balance: 'pending',
          production: 'pending',
        },
      });

      assert.ok(result.includes('Mixed Game'));
      // Should contain complete indicator '+' and in_progress indicator '*'
      assert.ok(result.includes('+'), 'Should show complete indicator');
      assert.ok(result.includes('*'), 'Should show in_progress indicator');
    });

    it('renders pipeline with all-complete stages', () => {
      const progress = require('./progress.cjs');
      const result = progress.renderPipeline({
        project_name: 'Done Game',
        stages: {
          concept: 'complete',
          system_design: 'complete',
          data_schema: 'complete',
          balance: 'complete',
          production: 'complete',
        },
      });

      assert.ok(result.includes('Done Game'));
      // Should not have any pending 'o' indicators
      const lines = result.split('\n');
      const statusLine = lines.find(l => {
        const t = l.trim();
        return t.length > 0 && /^[o*+](\s+[o*+]){4}$/.test(t);
      });
      if (statusLine) {
        assert.ok(!statusLine.includes('o'), 'No pending indicators in all-complete');
      }
    });

    it('includes legend with status indicators', () => {
      const progress = require('./progress.cjs');
      const result = progress.renderPipeline({
        project_name: 'Legend Test',
        stages: {
          concept: 'pending',
          system_design: 'pending',
          data_schema: 'pending',
          balance: 'pending',
          production: 'pending',
        },
      });

      assert.ok(result.includes('Pending'), 'Should show Pending label');
      assert.ok(result.includes('In Progress'), 'Should show In Progress label');
      assert.ok(result.includes('Complete'), 'Should show Complete label');
    });
  });

  describe('renderStageTable', () => {
    it('renders a table with all stages', () => {
      const progress = require('./progress.cjs');
      const result = progress.renderStageTable({
        concept: 'pending',
        system_design: 'in_progress',
        data_schema: 'pending',
        balance: 'pending',
        production: 'pending',
      });

      assert.ok(typeof result === 'string');
      assert.ok(result.includes('Concept'));
      assert.ok(result.includes('System Design'));
      assert.ok(result.includes('Data Schema'));
      assert.ok(result.includes('Balance'));
      assert.ok(result.includes('Production'));
      assert.ok(result.includes('Pending'));
      assert.ok(result.includes('In Progress'));
    });

    it('includes header row with correct columns', () => {
      const progress = require('./progress.cjs');
      const result = progress.renderStageTable({
        concept: 'pending',
        system_design: 'pending',
        data_schema: 'pending',
        balance: 'pending',
        production: 'pending',
      });

      assert.ok(result.includes('#'));
      assert.ok(result.includes('Stage'));
      assert.ok(result.includes('Status'));
    });
  });

  describe('cmdProgress', () => {
    it('returns pipeline for format=pipeline', () => {
      const progress = require('./progress.cjs');
      // Scaffold a project
      const init = require('./init.cjs');
      init.cmdScaffoldProject(tmpDir, {
        name: 'Pipeline Test',
        language: 'en',
        genre: 'casual',
        entry_path: 'scratch',
      });

      const result = progress.cmdProgress(tmpDir, 'pipeline');
      assert.ok(result.display);
      assert.ok(result.display.includes('Pipeline Test'));
      // Pipeline format should not include a table
      assert.ok(!result.display.includes('| # |'));
    });

    it('returns pipeline + table for format=full', () => {
      const progress = require('./progress.cjs');
      const init = require('./init.cjs');
      init.cmdScaffoldProject(tmpDir, {
        name: 'Full Test',
        language: 'en',
        genre: 'casual',
        entry_path: 'scratch',
      });

      const result = progress.cmdProgress(tmpDir, 'full');
      assert.ok(result.display);
      assert.ok(result.display.includes('Full Test'));
      // Full format should include the table
      assert.ok(result.display.includes('| # |'));
    });

    it('returns error when no project', () => {
      const progress = require('./progress.cjs');
      const result = progress.cmdProgress(tmpDir, 'pipeline');
      assert.strictEqual(result.project_exists, false);
    });
  });
});
