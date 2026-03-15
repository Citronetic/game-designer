/**
 * System Design -- System mapping, ID generation, status tracking,
 * traceability validation, and cross-system consistency checks for
 * the system design stage (Stage 2).
 *
 * Provides the programmatic infrastructure all system-design-stage
 * operations depend on. Skills and agents call these functions via CLI.
 *
 * CommonJS, zero external dependencies (except sibling modules).
 */

const fs = require('node:fs');
const path = require('node:path');
const { safeReadFile } = require('./core.cjs');
const { extractFrontmatter, reconstructFrontmatter } = require('./frontmatter.cjs');

// ---- Constants ---------------------------------------------------------------

/**
 * System type classifications (from source spec section 4.1).
 */
const SYSTEM_TYPES = ['core', 'growth', 'commercial', 'support'];

/**
 * System priority levels.
 */
const SYSTEM_PRIORITIES = ['P0', 'P1', 'P2'];

/**
 * System ID pattern: SYS-UPPER_SNAKE-NNN.
 * Must start with SYS-, followed by uppercase letter, then uppercase
 * letters/digits/underscores, then a hyphen and exactly 3 digits.
 */
const SYSTEM_ID_PATTERN = /^SYS-[A-Z][A-Z0-9_]+-\d{3}$/;

/**
 * System rule ID pattern: RULE-UPPER_SNAKE-NNN.
 */
const SYSTEM_RULE_ID_PATTERN = /^RULE-[A-Z][A-Z0-9_]+-\d{3}$/;

// ---- Paths -------------------------------------------------------------------

const SYSTEMS_DIR = path.join('.gf', 'stages', '02-system-design', 'systems');
const SYSTEM_LIST_PATH = path.join('.gf', 'stages', '02-system-design', 'system-list.json');
const REGISTRY_PATH = path.join('.gf', 'traceability', 'id-registry.json');

// ---- ID functions ------------------------------------------------------------

/**
 * Convert a display name to a system ID.
 * Slugify: uppercase, replace spaces/hyphens with underscore,
 * strip non-alphanumeric-underscore, pad seq to 3 digits.
 *
 * @param {string} name - Display name (e.g., "Core Gameplay")
 * @param {number} [seq=1] - Sequence number (padded to 3 digits)
 * @returns {string} System ID (e.g., "SYS-CORE_GAMEPLAY-001")
 */
function systemNameToId(name, seq = 1) {
  const slug = name
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
  const paddedSeq = String(seq).padStart(3, '0');
  return `SYS-${slug}-${paddedSeq}`;
}

/**
 * Validate a system ID against the SYSTEM_ID_PATTERN.
 *
 * @param {string} id - System ID to validate
 * @returns {{valid: boolean, error?: string}}
 */
function validateSystemId(id) {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'System ID must be a non-empty string' };
  }
  if (!SYSTEM_ID_PATTERN.test(id)) {
    return { valid: false, error: `Invalid system ID format: ${id}. Expected SYS-UPPER_SNAKE-NNN (e.g., SYS-COMBAT-001)` };
  }
  return { valid: true };
}

/**
 * Validate a system rule ID against the SYSTEM_RULE_ID_PATTERN.
 *
 * @param {string} id - Rule ID to validate
 * @returns {{valid: boolean, error?: string}}
 */
function validateSystemRuleId(id) {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'Rule ID must be a non-empty string' };
  }
  if (!SYSTEM_RULE_ID_PATTERN.test(id)) {
    return { valid: false, error: `Invalid rule ID format: ${id}. Expected RULE-UPPER_SNAKE-NNN (e.g., RULE-COMBAT-001)` };
  }
  return { valid: true };
}

// ---- Status tracking ---------------------------------------------------------

/**
 * Read all system .md files in the systems directory and return a
 * map of {systemId: status} from their frontmatter.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @returns {object} { systemId: status, ... }
 */
function getSystemStatus(projectDir) {
  const systemsDir = path.join(projectDir, SYSTEMS_DIR);
  const statuses = {};

  let files;
  try {
    files = fs.readdirSync(systemsDir);
  } catch {
    return statuses;
  }

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const content = safeReadFile(path.join(systemsDir, file));
    if (!content) continue;

    const { frontmatter } = extractFrontmatter(content);
    if (frontmatter.system_id && frontmatter.status) {
      statuses[frontmatter.system_id] = frontmatter.status;
    }
  }

  return statuses;
}

/**
 * Update the status field in a system file's frontmatter.
 * Finds the file by matching system_id in frontmatter.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @param {string} systemId - System ID to update
 * @param {string} status - New status value
 * @returns {{success: boolean, error?: string}}
 */
function updateSystemStatus(projectDir, systemId, status) {
  const systemsDir = path.join(projectDir, SYSTEMS_DIR);

  let files;
  try {
    files = fs.readdirSync(systemsDir);
  } catch {
    return { success: false, error: 'Systems directory not found' };
  }

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(systemsDir, file);
    const content = safeReadFile(filePath);
    if (!content) continue;

    const { frontmatter, body } = extractFrontmatter(content);
    if (frontmatter.system_id === systemId) {
      frontmatter.status = status;
      const newFm = reconstructFrontmatter(frontmatter);
      const newContent = `---\n${newFm}\n---${body}`;
      fs.writeFileSync(filePath, newContent, 'utf-8');
      return { success: true };
    }
  }

  return { success: false, error: `System file not found for ID: ${systemId}` };
}

// ---- System list management --------------------------------------------------

/**
 * Read the confirmed system list from system-list.json.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @returns {object|null} Parsed JSON object or null if not found
 */
function getConfirmedSystems(projectDir) {
  const listPath = path.join(projectDir, SYSTEM_LIST_PATH);
  const content = safeReadFile(listPath);
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Save a confirmed system list to system-list.json.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @param {object[]} systems - Array of system objects
 * @returns {{success: boolean}}
 */
function saveConfirmedSystems(projectDir, systems) {
  const listDir = path.join(projectDir, '.gf', 'stages', '02-system-design');
  fs.mkdirSync(listDir, { recursive: true });

  const listPath = path.join(projectDir, SYSTEM_LIST_PATH);
  const data = {
    confirmed: true,
    systems,
    confirmed_at: new Date().toISOString(),
  };
  fs.writeFileSync(listPath, JSON.stringify(data, null, 2), 'utf-8');
  return { success: true };
}

// ---- Traceability ------------------------------------------------------------

/**
 * Check concept-to-system traceability.
 * Reads all concept_entries from the ID registry. Scans all system files'
 * concept_sources frontmatter arrays. Reports unmapped R_N_NN IDs.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @returns {{mapped: string[], unmapped: string[], coverage: number}}
 */
function checkConceptTraceability(projectDir) {
  // Read registry
  const registryPath = path.join(projectDir, REGISTRY_PATH);
  const registryContent = safeReadFile(registryPath);
  if (!registryContent) {
    return { mapped: [], unmapped: [], coverage: 0 };
  }

  let registry;
  try {
    registry = JSON.parse(registryContent);
  } catch {
    return { mapped: [], unmapped: [], coverage: 0 };
  }

  const conceptIds = (registry.concept_entries || []).map(e => e.id);
  if (conceptIds.length === 0) {
    return { mapped: [], unmapped: [], coverage: 1.0 };
  }

  // Collect all concept_sources from system files
  const systemsDir = path.join(projectDir, SYSTEMS_DIR);
  const mappedSet = new Set();

  let files;
  try {
    files = fs.readdirSync(systemsDir);
  } catch {
    files = [];
  }

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const content = safeReadFile(path.join(systemsDir, file));
    if (!content) continue;

    const { frontmatter } = extractFrontmatter(content);
    if (Array.isArray(frontmatter.concept_sources)) {
      for (const src of frontmatter.concept_sources) {
        mappedSet.add(src);
      }
    }
  }

  const mapped = conceptIds.filter(id => mappedSet.has(id));
  const unmapped = conceptIds.filter(id => !mappedSet.has(id));
  const coverage = conceptIds.length > 0 ? mapped.length / conceptIds.length : 1.0;

  return { mapped, unmapped, coverage };
}

// ---- Cross-system consistency ------------------------------------------------

/**
 * Check economy balance across system files.
 * Parses "7A. Data Schema Anchors" and "7B. Numerical Balance Inputs"
 * sections for resource names. Checks production/consumption pairing.
 *
 * @param {object[]} systemFiles - Array of {id, body} objects
 * @returns {{balanced: boolean, issues: string[]}}
 */
function checkEconomyBalance(systemFiles) {
  const produced = new Set();
  const consumed = new Set();
  const issues = [];

  for (const sf of systemFiles) {
    const body = sf.body || '';

    // Extract resources produced
    const prodMatch = body.match(/Resources produced:\s*(.+)/i);
    if (prodMatch) {
      const resources = prodMatch[1].split(',').map(r => r.trim().toLowerCase()).filter(Boolean);
      for (const r of resources) produced.add(r);
    }

    // Extract resources consumed
    const consMatch = body.match(/Resources consumed:\s*(.+)/i);
    if (consMatch) {
      const resources = consMatch[1].split(',').map(r => r.trim().toLowerCase()).filter(Boolean);
      for (const r of resources) consumed.add(r);
    }
  }

  // Check: every produced resource should be consumed somewhere
  for (const r of produced) {
    if (!consumed.has(r)) {
      issues.push(`Resource "${r}" is produced but never consumed`);
    }
  }

  // Check: every consumed resource should be produced somewhere
  for (const r of consumed) {
    if (!produced.has(r)) {
      issues.push(`Resource "${r}" is consumed but never produced`);
    }
  }

  return { balanced: issues.length === 0, issues };
}

/**
 * Check task references across system files.
 * Parses "3. Entry & Triggers" for unlock conditions referencing other
 * systems. Checks those systems exist in the known system list.
 *
 * @param {object[]} systemFiles - Array of {id, body} objects
 * @param {string[]} knownSystems - Array of known system IDs
 * @returns {{valid: boolean, issues: string[]}}
 */
function checkTaskReferences(systemFiles, knownSystems) {
  const knownSet = new Set(knownSystems || []);
  const issues = [];

  for (const sf of systemFiles) {
    const body = sf.body || '';

    // Find all SYS-*-NNN references in the body
    const sysRefs = body.match(/SYS-[A-Z][A-Z0-9_]+-\d{3}/g) || [];
    for (const ref of sysRefs) {
      if (ref !== sf.id && !knownSet.has(ref)) {
        issues.push(`System ${sf.id} references unknown system ${ref}`);
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Check tutorial coverage across system files.
 * Parses "7. One-Week Content Contribution" for Day entries.
 * Checks that rules introduced in early days are taught (mentioned
 * in introductions) before being tested (mentioned in test contexts).
 *
 * @param {object[]} systemFiles - Array of {id, body} objects
 * @returns {{complete: boolean, gaps: string[]}}
 */
function checkTutorialCoverage(systemFiles) {
  const gaps = [];

  for (const sf of systemFiles) {
    const body = sf.body || '';

    // Extract all RULE references with their day context
    const ruleIntroducedByDay = {};  // ruleId -> earliest day it's introduced
    const ruleTestedByDay = {};      // ruleId -> earliest day it's tested

    // Parse the Day table rows
    const dayRowPattern = /\|\s*Day(\d)\s*\|([^|]+)\|([^|]+)\|/g;
    let match;
    while ((match = dayRowPattern.exec(body)) !== null) {
      const day = parseInt(match[1], 10);
      const description = match[2];
      const type = match[3].trim().toLowerCase();

      // Find rule references in this row
      const ruleRefs = description.match(/RULE-[A-Z][A-Z0-9_]+-\d{3}/g) || [];

      for (const rule of ruleRefs) {
        if (type.includes('new_mechanic') || description.toLowerCase().includes('introduces')) {
          if (!ruleIntroducedByDay[rule] || day < ruleIntroducedByDay[rule]) {
            ruleIntroducedByDay[rule] = day;
          }
        }
        if (type.includes('reuse_variation') || description.toLowerCase().includes('test')) {
          if (!ruleTestedByDay[rule] || day < ruleTestedByDay[rule]) {
            ruleTestedByDay[rule] = day;
          }
        }
      }
    }

    // Also scan section 3 and 5 for rule IDs that appear in tutorial context
    const entrySection = body.match(/## 3\. Entry & Triggers([\s\S]*?)(?=## \d|$)/);
    if (entrySection) {
      const tutorialRefs = entrySection[1].match(/RULE-[A-Z][A-Z0-9_]+-\d{3}/g) || [];
      for (const rule of tutorialRefs) {
        // Rules found in entry/triggers but not in Day table introductions
        // are considered "tested" (referenced without introduction)
        if (!ruleIntroducedByDay[rule]) {
          // Check if the rule is mentioned in Day table at all
          if (ruleTestedByDay[rule]) {
            // It's tested in the Day table but never introduced
            gaps.push(`${sf.id}: ${rule} is tested (Day${ruleTestedByDay[rule]}) but never introduced as new_mechanic`);
          } else {
            // Referenced in section 3 but not in the Day table at all
            gaps.push(`${sf.id}: ${rule} referenced in entry triggers but not covered in one-week plan`);
          }
        }
      }
    }

    // Check: every tested rule should be introduced before being tested
    for (const [rule, testDay] of Object.entries(ruleTestedByDay)) {
      const introDay = ruleIntroducedByDay[rule];
      if (!introDay) {
        // Only add if not already flagged above
        if (!gaps.some(g => g.includes(rule))) {
          gaps.push(`${sf.id}: ${rule} is tested (Day${testDay}) but never introduced`);
        }
      } else if (introDay > testDay) {
        gaps.push(`${sf.id}: ${rule} is tested on Day${testDay} but introduced on Day${introDay}`);
      }
    }
  }

  return { complete: gaps.length === 0, gaps };
}

/**
 * Check for monetization conflicts across system files.
 * Looks for systems that both define ad placements and premium
 * purchase alternatives on the same content.
 *
 * @param {object[]} systemFiles - Array of {id, body} objects
 * @returns {{clean: boolean, conflicts: string[]}}
 */
function checkMonetizationConflicts(systemFiles) {
  const adPlacements = new Set();
  const premiumRemoves = new Set();
  const conflicts = [];

  for (const sf of systemFiles) {
    const body = sf.body || '';

    // Extract ad placements
    const adMatch = body.match(/Ad placements:\s*(.+)/i);
    if (adMatch) {
      const placements = adMatch[1].split(',').map(p => p.trim().toLowerCase()).filter(Boolean);
      for (const p of placements) adPlacements.add(p);
    }

    // Extract premium removes (what premium purchase removes/replaces)
    const premMatch = body.match(/Premium removes:\s*(.+)/i);
    if (premMatch) {
      const removes = premMatch[1].split(',').map(r => r.trim().toLowerCase()).filter(Boolean);
      for (const r of removes) premiumRemoves.add(r);
    }
  }

  // Conflict: an ad placement that premium also removes means potential contradiction
  for (const placement of adPlacements) {
    if (premiumRemoves.has(placement)) {
      conflicts.push(`Ad placement "${placement}" conflicts with premium removal of same placement`);
    }
  }

  return { clean: conflicts.length === 0, conflicts };
}

// ---- Exports -----------------------------------------------------------------

module.exports = {
  SYSTEM_TYPES,
  SYSTEM_PRIORITIES,
  SYSTEM_ID_PATTERN,
  SYSTEM_RULE_ID_PATTERN,
  systemNameToId,
  validateSystemId,
  validateSystemRuleId,
  getSystemStatus,
  updateSystemStatus,
  getConfirmedSystems,
  saveConfirmedSystems,
  checkConceptTraceability,
  checkEconomyBalance,
  checkTaskReferences,
  checkTutorialCoverage,
  checkMonetizationConflicts,
};
