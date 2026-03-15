/**
 * Tests for config.cjs -- config.json CRUD with defaults merging
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('config.cjs', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gf-config-test-'));
    fs.mkdirSync(path.join(tmpDir, '.gf'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const config = require('./config.cjs');

  describe('loadConfig', () => {
    it('returns defaults when config.json is missing', () => {
      const result = config.loadConfig(tmpDir);
      assert.ok(result);
      assert.strictEqual(result.language, 'en');
      assert.strictEqual(result.git_tracking, true);
      assert.strictEqual(typeof result.gf_version, 'string');
    });

    it('merges file config with defaults', () => {
      const fileConfig = { language: 'zh', genre: 'RPG' };
      fs.writeFileSync(path.join(tmpDir, '.gf', 'config.json'), JSON.stringify(fileConfig));

      const result = config.loadConfig(tmpDir);
      assert.strictEqual(result.language, 'zh');
      assert.strictEqual(result.genre, 'RPG');
      // Defaults should fill in missing keys
      assert.strictEqual(result.git_tracking, true);
    });
  });

  describe('saveConfig', () => {
    it('writes config.json with 2-space indent', () => {
      const data = { language: 'ja', genre: 'puzzle' };
      config.saveConfig(tmpDir, data);

      const written = fs.readFileSync(path.join(tmpDir, '.gf', 'config.json'), 'utf-8');
      const parsed = JSON.parse(written);
      assert.strictEqual(parsed.language, 'ja');
      assert.strictEqual(parsed.genre, 'puzzle');
      // Verify 2-space indent
      assert.ok(written.includes('  "language"'));
    });
  });

  describe('getConfigValue', () => {
    it('returns stored value for a key', () => {
      const data = { language: 'ko', genre: 'idle' };
      fs.writeFileSync(path.join(tmpDir, '.gf', 'config.json'), JSON.stringify(data));

      const result = config.getConfigValue(tmpDir, 'language');
      assert.strictEqual(result, 'ko');
    });

    it('returns default value when key not in file', () => {
      fs.writeFileSync(path.join(tmpDir, '.gf', 'config.json'), JSON.stringify({}));

      const result = config.getConfigValue(tmpDir, 'language');
      assert.strictEqual(result, 'en');
    });
  });

  describe('setConfigValue', () => {
    it('updates single key and writes to file', () => {
      const data = { language: 'en', genre: '' };
      fs.writeFileSync(path.join(tmpDir, '.gf', 'config.json'), JSON.stringify(data));

      config.setConfigValue(tmpDir, 'language', 'zh');

      const written = JSON.parse(fs.readFileSync(path.join(tmpDir, '.gf', 'config.json'), 'utf-8'));
      assert.strictEqual(written.language, 'zh');
    });

    it('preserves other keys when updating one', () => {
      const data = { language: 'en', genre: 'casual' };
      fs.writeFileSync(path.join(tmpDir, '.gf', 'config.json'), JSON.stringify(data));

      config.setConfigValue(tmpDir, 'language', 'fr');

      const written = JSON.parse(fs.readFileSync(path.join(tmpDir, '.gf', 'config.json'), 'utf-8'));
      assert.strictEqual(written.language, 'fr');
      assert.strictEqual(written.genre, 'casual');
    });
  });

  describe('default config schema', () => {
    it('includes all expected default keys', () => {
      const result = config.loadConfig(tmpDir);
      assert.strictEqual(typeof result.gf_version, 'string');
      assert.strictEqual(typeof result.project_name, 'string');
      assert.strictEqual(result.language, 'en');
      assert.strictEqual(typeof result.genre, 'string');
      assert.strictEqual(typeof result.platform, 'string');
      assert.strictEqual(typeof result.monetization, 'string');
      assert.strictEqual(result.entry_path, 'scratch');
      assert.strictEqual(result.git_tracking, true);
    });
  });
});
