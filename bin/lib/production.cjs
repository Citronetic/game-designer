/**
 * Production -- art anchor extraction, UI anchor extraction, 7C contract
 * extraction, traceability validation, and production status tracking
 * for Stage 4 (Production Specs).
 *
 * Provides the programmatic foundation that the production spec generator
 * agents and SKILL.md orchestrator invoke to extract structured input from
 * system designs, validate spec references, and track production stage
 * progress.
 *
 * CommonJS, zero external dependencies (except sibling modules).
 */

const fs = require('node:fs');
const path = require('node:path');
const { safeReadFile } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');
const config = require('./config.cjs');
const { lookupId } = require('./traceability.cjs');

// ---- Helper: Read System Files -----------------------------------------------

/**
 * Read all system design .md files, parse frontmatter, and return
 * an array of {systemId, systemName, body, file} objects plus a
 * systems ID list.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @returns {{entries: object[], systems: string[]}}
 */
function readSystemFiles(projectDir) {
  const systemsDir = path.join(projectDir, '.gf', 'stages', '02-system-design', 'systems');
  const entries = [];
  const systems = [];

  let files;
  try {
    files = fs.readdirSync(systemsDir).filter(f => f.endsWith('.md'));
  } catch {
    return { entries: [], systems: [] };
  }

  for (const file of files) {
    const content = safeReadFile(path.join(systemsDir, file));
    if (!content) continue;

    const { frontmatter, body } = extractFrontmatter(content);
    const systemId = frontmatter.system_id;
    const systemName = frontmatter.system_name;
    if (systemId) systems.push(systemId);

    entries.push({ systemId, systemName, body, file });
  }

  return { entries, systems };
}

// ---- Art Anchor Extraction ---------------------------------------------------

/**
 * Extract art anchor content from Section 8 of all system design files.
 * Reads .md files from .gf/stages/02-system-design/systems/, parses
 * frontmatter for system_id/system_name, then extracts the art anchor
 * subsection (8.2) from Section 8.
 *
 * Returns raw content string per system for the agent to interpret.
 * Does NOT attempt to parse individual asset rows -- format may vary.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @returns {{anchors: object[], systems: string[]}}
 *   anchors: [{system_id, system_name, raw_art: string}, ...]
 *   systems: [system_id, ...]
 */
function extractArtAnchors(projectDir) {
  const { entries, systems } = readSystemFiles(projectDir);
  const anchors = [];

  for (const { systemId, systemName, body } of entries) {
    // Match Section 8 first
    const section8Match = body.match(/## 8[.\s][^\n]*\n([\s\S]*?)(?=\n## (?!\d*\.\d)|\s*$)/);
    if (!section8Match) continue;

    const section8Content = section8Match[1];

    // Extract the art anchor subsection (### 8.2 or "Art Anchor" heading)
    const artMatch = section8Content.match(/###\s*8\.2[^\n]*\n([\s\S]*?)(?=\n### |\s*$)/);
    if (!artMatch) continue;

    const rawArt = artMatch[1].trim();
    if (rawArt.length > 0) {
      anchors.push({
        system_id: systemId,
        system_name: systemName,
        raw_art: rawArt,
      });
    }
  }

  return { anchors, systems };
}

// ---- UI Anchor Extraction ----------------------------------------------------

/**
 * Extract UI anchor content from Section 8 of all system design files.
 * Same pattern as extractArtAnchors but extracts UI anchor subsection (8.3).
 *
 * @param {string} projectDir - Project root containing .gf/
 * @returns {{anchors: object[], systems: string[]}}
 *   anchors: [{system_id, system_name, raw_ui: string}, ...]
 *   systems: [system_id, ...]
 */
function extractUIAnchors(projectDir) {
  const { entries, systems } = readSystemFiles(projectDir);
  const anchors = [];

  for (const { systemId, systemName, body } of entries) {
    // Match Section 8 first
    const section8Match = body.match(/## 8[.\s][^\n]*\n([\s\S]*?)(?=\n## (?!\d*\.\d)|\s*$)/);
    if (!section8Match) continue;

    const section8Content = section8Match[1];

    // Extract the UI anchor subsection (### 8.3 or "UI Anchor" heading)
    const uiMatch = section8Content.match(/###\s*8\.3[^\n]*\n([\s\S]*?)(?=\n### |\s*$)/);
    if (!uiMatch) continue;

    const rawUI = uiMatch[1].trim();
    if (rawUI.length > 0) {
      anchors.push({
        system_id: systemId,
        system_name: systemName,
        raw_ui: rawUI,
      });
    }
  }

  return { anchors, systems };
}

// ---- 7C Contract Extraction --------------------------------------------------

/**
 * Extract Section 10 (the 7C handoff package) from all system design files.
 * CRITICAL: Match "## 10" NOT "## 7C" -- per Phase 3 locked decision,
 * Section 10 IS the 7C handoff package.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @returns {{contracts: object[], systems: string[]}}
 *   contracts: [{system_id, system_name, raw_7c: string}, ...]
 *   systems: [system_id, ...]
 */
function extract7CContracts(projectDir) {
  const { entries, systems } = readSystemFiles(projectDir);
  const contracts = [];

  for (const { systemId, systemName, body } of entries) {
    // Extract Section 10 -- match from "## 10" header until next "\n## " or end
    const match = body.match(/## 10[.\s][^\n]*\n([\s\S]*?)(?=\n## |\s*$)/);
    if (!match) continue;

    const raw7c = match[1].trim();
    if (raw7c.length > 0) {
      contracts.push({
        system_id: systemId,
        system_name: systemName,
        raw_7c: raw7c,
      });
    }
  }

  return { contracts, systems };
}

// ---- Spec Traceability Validation -------------------------------------------

/**
 * Validate that all system/rule IDs referenced in production specs
 * are registered in the ID registry.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @param {string[]} specIds - Array of IDs found in spec files
 * @returns {{valid: boolean, issues: string[]}}
 */
function validateSpecTraceability(projectDir, specIds) {
  if (!specIds || specIds.length === 0) {
    return { valid: true, issues: [] };
  }

  const issues = [];

  for (const id of specIds) {
    const entry = lookupId(projectDir, id);
    if (!entry) {
      issues.push(`Unregistered ID: ${id} -- not found in id-registry.json`);
    }
  }

  return { valid: issues.length === 0, issues };
}

// ---- Production Status -------------------------------------------------------

/**
 * Get the current production stage status.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @returns {string} Status string (e.g., "not_started", "in_progress", "complete")
 */
function getProductionStatus(projectDir) {
  return config.getConfigValue(projectDir, 'production_status') || 'not_started';
}

/**
 * Set the production stage status.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @param {string} status - New status value
 */
function setProductionStatus(projectDir, status) {
  config.setConfigValue(projectDir, 'production_status', status);
}

// ---- Exports -----------------------------------------------------------------

module.exports = {
  extractArtAnchors,
  extractUIAnchors,
  extract7CContracts,
  validateSpecTraceability,
  getProductionStatus,
  setProductionStatus,
};
