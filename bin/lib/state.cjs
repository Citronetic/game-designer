/**
 * State -- STATE.md read/write/update with frontmatter sync
 *
 * Manages the .gf/STATE.md file for Game Forge projects. Reads and writes
 * state with automatic YAML frontmatter synchronization -- the frontmatter
 * always reflects what the markdown body says.
 *
 * CommonJS, zero external dependencies. Requires ./core.cjs and ./frontmatter.cjs.
 */

const fs = require('node:fs');
const path = require('node:path');
const { safeReadFile } = require('./core.cjs');
const { extractFrontmatter, stripFrontmatter, reconstructFrontmatter } = require('./frontmatter.cjs');

// ─── Field extraction helper ──────────────────────────────────────────────

/**
 * Extract a field value from STATE.md body content.
 * Supports both **Field:** bold and plain Field: format.
 *
 * @param {string} bodyContent - Markdown body text
 * @param {string} label - Field label to search for
 * @returns {string|null} Extracted value or null
 */
function stateExtractField(bodyContent, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Try **Field:** bold format first
  const boldPattern = new RegExp(`\\*\\*${escaped}:\\*\\*\\s*(.+)`, 'i');
  const boldMatch = bodyContent.match(boldPattern);
  if (boldMatch) return boldMatch[1].trim();
  // Fall back to plain Field: format
  const plainPattern = new RegExp(`^${escaped}:\\s*(.+)`, 'im');
  const plainMatch = bodyContent.match(plainPattern);
  return plainMatch ? plainMatch[1].trim() : null;
}

/**
 * Replace a field value in STATE.md content (both bold and plain formats).
 *
 * @param {string} content - Full STATE.md content
 * @param {string} fieldName - Field label to replace
 * @param {string} newValue - New value to set
 * @returns {string|null} Updated content, or null if field not found
 */
function stateReplaceField(content, fieldName, newValue) {
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const boldPattern = new RegExp(`(\\*\\*${escaped}:\\*\\*\\s*)(.*)`, 'i');
  if (boldPattern.test(content)) {
    return content.replace(boldPattern, (_match, prefix) => `${prefix}${newValue}`);
  }
  const plainPattern = new RegExp(`(^${escaped}:\\s*)(.*)`, 'im');
  if (plainPattern.test(content)) {
    return content.replace(plainPattern, (_match, prefix) => `${prefix}${newValue}`);
  }
  return null;
}

// ─── Frontmatter sync ──────────────────────────────────────────────────────

/**
 * Build a frontmatter object from STATE.md body content.
 * Extracts key fields so the YAML frontmatter stays machine-readable.
 */
function buildStateFrontmatter(bodyContent) {
  const fm = {};

  const currentStage = stateExtractField(bodyContent, 'Current Stage');
  const currentStageName = stateExtractField(bodyContent, 'Current Stage Name');
  const status = stateExtractField(bodyContent, 'Status');
  const language = stateExtractField(bodyContent, 'Language');
  const projectName = stateExtractField(bodyContent, 'Project Name') || stateExtractField(bodyContent, 'Project');
  const lastUpdated = stateExtractField(bodyContent, 'Last Updated') || stateExtractField(bodyContent, 'Last Activity');
  const genre = stateExtractField(bodyContent, 'Genre');

  if (projectName) fm.project_name = projectName;
  if (currentStage) fm.current_stage = currentStage;
  if (currentStageName) fm.current_stage_name = currentStageName;
  if (status) fm.status = status;
  if (language) fm.language = language;
  if (genre) fm.genre = genre;
  if (lastUpdated) fm.last_updated = lastUpdated;

  // Extract stage statuses if present
  const stages = {};
  const stageNames = ['concept', 'system_design', 'data_schema', 'balance', 'production'];
  for (const stageName of stageNames) {
    const displayName = stageName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const val = stateExtractField(bodyContent, displayName);
    if (val) stages[stageName] = val.toLowerCase();
  }
  if (Object.keys(stages).length > 0) fm.stages = stages;

  return fm;
}

/**
 * Synchronize YAML frontmatter with the markdown body content.
 * Strips any existing frontmatter, builds new one from body, and reconstructs.
 */
function syncStateFrontmatter(content) {
  const body = stripFrontmatter(content);
  const fm = buildStateFrontmatter(body);
  if (Object.keys(fm).length === 0) {
    // No extractable fields -- return body as-is without frontmatter
    return body;
  }
  const yamlStr = reconstructFrontmatter(fm);
  return `---\n${yamlStr}\n---\n\n${body}`;
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Load STATE.md from a project directory.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @returns {{frontmatter: object, body: string}|null}
 */
function loadState(projectDir) {
  const statePath = path.join(projectDir, '.gf', 'STATE.md');
  const content = safeReadFile(statePath);
  if (!content) return null;

  return extractFrontmatter(content);
}

/**
 * Write STATE.md with synchronized YAML frontmatter.
 * The frontmatter is always rebuilt from the body content before writing.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @param {string} content - Full markdown content (with or without frontmatter)
 */
function writeStateMd(projectDir, content) {
  const statePath = path.join(projectDir, '.gf', 'STATE.md');
  const synced = syncStateFrontmatter(content);
  fs.writeFileSync(statePath, synced, 'utf-8');
}

/**
 * Update a single field in STATE.md.
 * Loads the file, replaces the field value in the body, syncs frontmatter, writes.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @param {string} field - Field label (e.g., "Current Stage")
 * @param {string} value - New value
 * @returns {boolean} true if field was found and updated
 */
function updateStateField(projectDir, field, value) {
  const statePath = path.join(projectDir, '.gf', 'STATE.md');
  const content = safeReadFile(statePath);
  if (!content) return false;

  const updated = stateReplaceField(content, field, value);
  if (!updated) return false;

  const synced = syncStateFrontmatter(updated);
  fs.writeFileSync(statePath, synced, 'utf-8');
  return true;
}

/**
 * Batch update multiple fields in STATE.md.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @param {object} patches - { "Field Name": "new value", ... }
 * @returns {{updated: string[], failed: string[]}}
 */
function patchState(projectDir, patches) {
  const statePath = path.join(projectDir, '.gf', 'STATE.md');
  let content = safeReadFile(statePath);
  if (!content) return { updated: [], failed: Object.keys(patches) };

  const results = { updated: [], failed: [] };

  for (const [field, value] of Object.entries(patches)) {
    const replaced = stateReplaceField(content, field, value);
    if (replaced) {
      content = replaced;
      results.updated.push(field);
    } else {
      results.failed.push(field);
    }
  }

  if (results.updated.length > 0) {
    const synced = syncStateFrontmatter(content);
    fs.writeFileSync(statePath, synced, 'utf-8');
  }

  return results;
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  loadState,
  writeStateMd,
  updateStateField,
  patchState,
  stateExtractField,
  stateReplaceField,
  buildStateFrontmatter,
  syncStateFrontmatter,
};
