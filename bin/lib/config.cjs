/**
 * Config -- config.json CRUD with defaults merging
 *
 * Manages the .gf/config.json file for Game Forge projects. Provides
 * load/save with automatic defaults merging, and single-key get/set.
 *
 * CommonJS, zero external dependencies. Requires ./core.cjs.
 */

const fs = require('node:fs');
const path = require('node:path');
const { safeReadFile } = require('./core.cjs');

// ─── Default config schema ────────────────────────────────────────────────

const CONFIG_DEFAULTS = {
  gf_version: '1.0',
  project_name: '',
  language: 'en',
  genre: '',
  platform: '',
  monetization: '',
  entry_path: 'scratch',
  git_tracking: true,
  created_at: '',
  last_updated: '',
};

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Load config.json from a project directory, merged with defaults.
 * Missing keys in the file are filled from CONFIG_DEFAULTS.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @returns {object} Merged config object
 */
function loadConfig(projectDir) {
  const configPath = path.join(projectDir, '.gf', 'config.json');
  const raw = safeReadFile(configPath);

  if (!raw) {
    return { ...CONFIG_DEFAULTS };
  }

  try {
    const parsed = JSON.parse(raw);
    return Object.assign({}, CONFIG_DEFAULTS, parsed);
  } catch {
    return { ...CONFIG_DEFAULTS };
  }
}

/**
 * Save config object to .gf/config.json with 2-space indent.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @param {object} configObj - Config object to write
 */
function saveConfig(projectDir, configObj) {
  const configPath = path.join(projectDir, '.gf', 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(configObj, null, 2), 'utf-8');
}

/**
 * Get a single config value by key. Loads config (with defaults) first.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @param {string} key - Config key to retrieve
 * @returns {*} The config value
 */
function getConfigValue(projectDir, key) {
  const config = loadConfig(projectDir);
  return config[key];
}

/**
 * Set a single config key and save. Loads existing config first to
 * preserve other keys.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @param {string} key - Config key to set
 * @param {*} value - Value to set
 */
function setConfigValue(projectDir, key, value) {
  const config = loadConfig(projectDir);
  config[key] = value;
  saveConfig(projectDir, config);
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  loadConfig,
  saveConfig,
  getConfigValue,
  setConfigValue,
  CONFIG_DEFAULTS,
};
