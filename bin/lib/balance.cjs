/**
 * Balance -- 7B input extraction, CSV value update, economy flow
 * validation, difficulty monotonicity checks, tuning threshold
 * validation, and balance status tracking for Stage 3B.
 *
 * Provides the programmatic foundation that the balance-generator agent
 * and SKILL.md orchestrator invoke to extract 7B inputs, update CSV
 * values in place, and validate balance completeness and consistency.
 *
 * CommonJS, zero external dependencies (except sibling modules).
 */

const fs = require('node:fs');
const path = require('node:path');
const { safeReadFile } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');
const config = require('./config.cjs');
const { isSchemaFrozen, tableNameToFilename, escapeCSVField } = require('./data-schema.cjs');

// ---- Constants ---------------------------------------------------------------

/**
 * Table layers that have balance-relevant fields.
 * Skips constants, i18n, and progress layers (no numeric tuning).
 */
const BALANCE_LAYERS = ['core_config', 'probability', 'periodic_rewards'];

// ---- 7B Input Extraction -----------------------------------------------------

/**
 * Extract 7B numerical balance inputs from all system design files.
 * Reads .md files from .gf/stages/02-system-design/systems/, parses
 * frontmatter for system_id/system_name, then regex-matches the
 * "## 7B" section to extract raw content.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @returns {{inputs: object[], systems: string[]}}
 *   inputs: [{system_id, system_name, raw_7b: string}, ...]
 *   systems: [system_id, ...]
 */
function extract7BInputs(projectDir) {
  const systemsDir = path.join(projectDir, '.gf', 'stages', '02-system-design', 'systems');
  const inputs = [];
  const systems = [];

  let files;
  try {
    files = fs.readdirSync(systemsDir).filter(f => f.endsWith('.md'));
  } catch {
    return { inputs: [], systems: [] };
  }

  for (const file of files) {
    const content = safeReadFile(path.join(systemsDir, file));
    if (!content) continue;

    const { frontmatter, body } = extractFrontmatter(content);
    const systemId = frontmatter.system_id;
    const systemName = frontmatter.system_name;
    if (systemId) systems.push(systemId);

    // Extract the 7B section -- match from "## 7B" header until next "\n## " or end
    const match = body.match(/## 7B[^\n]*\n([\s\S]*?)(?=\n## |\s*$)/);
    if (!match) continue;

    const raw7b = match[1].trim();
    if (raw7b.length > 0) {
      inputs.push({
        system_id: systemId,
        system_name: systemName,
        raw_7b: raw7b,
      });
    }
  }

  return { inputs, systems };
}

// ---- CSV Value Update --------------------------------------------------------

/**
 * Update data rows in an existing CSV file while preserving frozen
 * structure (field names row and field types row).
 *
 * Requires schema to be frozen before any balance updates.
 * CSV format: BOM + field names row + field types row + data rows.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @param {string} tableName - Table name (display or snake_case)
 * @param {Array<Array<string>>} newDataRows - New data rows (each row is array of values)
 * @returns {{success: boolean, rows_updated?: number, error?: string}}
 */
function updateTableValues(projectDir, tableName, newDataRows) {
  // Check freeze state first
  if (!isSchemaFrozen(projectDir)) {
    return { success: false, error: 'Schema must be frozen before balance updates. Freeze schema first.' };
  }

  const filename = tableNameToFilename(tableName) + '.csv';
  const csvPath = path.join(projectDir, '.gf', 'stages', '03a-data-schema', 'configs', filename);

  // Read existing CSV
  const existing = safeReadFile(csvPath);
  if (!existing) {
    return { success: false, error: `CSV file not found: ${filename}` };
  }

  // Parse existing CSV: detect BOM, extract field names row and field types row
  let content = existing;
  let hasBOM = false;
  if (content.charCodeAt(0) === 0xFEFF) {
    hasBOM = true;
    content = content.slice(1);
  }

  const lines = content.split('\n').filter(l => l.length > 0);
  if (lines.length < 2) {
    return { success: false, error: `CSV file has insufficient header rows: ${filename}` };
  }

  const fieldNamesRow = lines[0]; // preserved
  const fieldTypesRow = lines[1]; // preserved

  // Build new CSV with preserved structure + new data rows
  const dataLines = newDataRows.map(row =>
    row.map(val => escapeCSVField(val)).join(',')
  );

  const allLines = [fieldNamesRow, fieldTypesRow, ...dataLines];
  const newContent = (hasBOM ? '\uFEFF' : '') + allLines.join('\n') + '\n';

  fs.writeFileSync(csvPath, newContent, 'utf-8');

  return { success: true, rows_updated: newDataRows.length };
}

// ---- Economy Flow Validation -------------------------------------------------

/**
 * Validate economy resource flows for impossible states.
 *
 * Checks:
 * 1. Every resource has at least one source (no guaranteed drought)
 * 2. Every resource has at least one sink (no infinite accumulation)
 * 3. Resources with choke points must have safety nets
 *
 * @param {Array<{resource: string, sources: string[], sinks: string[], choke_points: string[], safety_nets: string[]}>} flows
 * @returns {{valid: boolean, issues: string[]}}
 */
function validateEconomyFlow(flows) {
  const issues = [];

  for (const flow of flows) {
    // Check 1: no sources = guaranteed drought
    if (!flow.sources || flow.sources.length === 0) {
      issues.push(`${flow.resource}: guaranteed drought -- no sources defined`);
    }

    // Check 2: no sinks = infinite accumulation
    if (!flow.sinks || flow.sinks.length === 0) {
      issues.push(`${flow.resource}: infinite accumulation -- no sinks defined`);
    }

    // Check 3: choke points without safety nets
    if (flow.choke_points && flow.choke_points.length > 0) {
      if (!flow.safety_nets || flow.safety_nets.length === 0) {
        issues.push(`${flow.resource}: choke points defined but no safety nets to prevent player deadlock`);
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

// ---- Difficulty Monotonicity Validation --------------------------------------

/**
 * Validate that difficulty segments maintain monotonicity.
 * Pass rates should generally decrease across progression segments.
 * Small recovery dips (<=10 percentage points increase) are allowed,
 * but large reversals (>10pp) indicate a difficulty curve problem.
 *
 * @param {Array<{segment: string, expected_pass_rate: number}>} segments - Ordered by progression
 * @returns {{valid: boolean, issues: string[]}}
 */
function validateDifficultyMonotonicity(segments) {
  const issues = [];

  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1];
    const curr = segments[i];
    const increase = curr.expected_pass_rate - prev.expected_pass_rate;

    if (increase > 10) {
      issues.push(
        `Monotonicity violation: "${curr.segment}" pass rate (${curr.expected_pass_rate}%) is ${increase}pp higher than "${prev.segment}" (${prev.expected_pass_rate}%) -- exceeds 10pp tolerance`
      );
    }
  }

  return { valid: issues.length === 0, issues };
}

// ---- Tuning Threshold Validation ---------------------------------------------

/**
 * Validate that tuning entries have concrete numeric rollback thresholds.
 * Vague conditions like "if players complain" are flagged; conditions
 * with at least one number (e.g., "if completion drops below 40%") pass.
 *
 * @param {Array<{parameter: string, rollback_condition: string}>} entries
 * @returns {{valid: boolean, issues: string[]}}
 */
function validateTuningThresholds(entries) {
  const issues = [];

  for (const entry of entries) {
    if (!/\d/.test(entry.rollback_condition)) {
      issues.push(
        `${entry.parameter}: missing numeric threshold in rollback condition "${entry.rollback_condition}"`
      );
    }
  }

  return { valid: issues.length === 0, issues };
}

// ---- Balance Status ----------------------------------------------------------

/**
 * Get the current balance stage status.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @returns {string} Status string (e.g., "not_started", "in_progress", "complete")
 */
function getBalanceStatus(projectDir) {
  return config.getConfigValue(projectDir, 'balance_status') || 'not_started';
}

/**
 * Set the balance stage status.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @param {string} status - New status value
 */
function setBalanceStatus(projectDir, status) {
  config.setConfigValue(projectDir, 'balance_status', status);
}

// ---- Exports -----------------------------------------------------------------

module.exports = {
  BALANCE_LAYERS,
  extract7BInputs,
  updateTableValues,
  validateEconomyFlow,
  validateDifficultyMonotonicity,
  validateTuningThresholds,
  getBalanceStatus,
  setBalanceStatus,
};
