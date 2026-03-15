/**
 * Traceability -- ID registry initialization, add, lookup, and validation
 *
 * Manages the .gf/traceability/id-registry.json file for cross-stage
 * traceability. Supports two ID formats:
 *   - Stage 2+: {TYPE}-{SYSTEM}-{NNN} (e.g., SYS-COMBAT-001)
 *   - Concept stage: R_N_NN (e.g., R_3_01)
 *
 * CommonJS, zero external dependencies (except sibling concept module).
 */

const fs = require('node:fs');
const path = require('node:path');

// ---- Constants ---------------------------------------------------------------

const REGISTRY_TEMPLATE = {
  gf_registry_version: '1.0',
  id_convention: {
    format: '{TYPE}-{SYSTEM}-{NNN}',
    types: {
      SYS: 'System',
      RULE: 'Rule',
      TBL: 'Table',
      FLD: 'Field',
      AST: 'Asset',
    },
    example: 'SYS-COMBAT-001',
  },
  entries: [],
  concept_entries: [],
};

const ID_PATTERN = /^(SYS|RULE|TBL|FLD|AST)-[A-Z][A-Z0-9_]+-\d{3}$/;

/**
 * Concept-stage rule ID pattern: R_chapter_seq (e.g., R_3_01).
 */
const CONCEPT_ID_PATTERN = /^R_(\d{1,2})_(\d{2})$/;

// Lazy-load concept module to avoid circular dependency
let concept = null;
function getConcept() {
  if (!concept) {
    concept = require('./concept.cjs');
  }
  return concept;
}

// ---- Public API --------------------------------------------------------------

/**
 * Create .gf/traceability/id-registry.json with empty entries and ID conventions.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @returns {{success: boolean, path: string}}
 */
function initRegistry(projectDir) {
  const traceDir = path.join(projectDir, '.gf', 'traceability');
  fs.mkdirSync(traceDir, { recursive: true });

  const registryPath = path.join(traceDir, 'id-registry.json');
  fs.writeFileSync(registryPath, JSON.stringify(REGISTRY_TEMPLATE, null, 2), 'utf-8');

  return { success: true, path: registryPath };
}

/**
 * Add an ID entry to the registry (Stage 2+ format).
 *
 * @param {string} projectDir - Project root containing .gf/
 * @param {object} entry - {id, type, system, description, source_stage, source_id}
 * @returns {{success: boolean, error?: string}}
 */
function addId(projectDir, entry) {
  const registryPath = path.join(projectDir, '.gf', 'traceability', 'id-registry.json');

  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
  } catch {
    return { success: false, error: 'Registry not found. Run registry init first.' };
  }

  // Validate ID format
  if (!entry.id || !ID_PATTERN.test(entry.id)) {
    return { success: false, error: `Invalid ID format: ${entry.id}. Expected: {TYPE}-{SYSTEM}-{NNN}` };
  }

  // Check for duplicates
  if (registry.entries.some(e => e.id === entry.id)) {
    return { success: false, error: `Duplicate ID: ${entry.id}` };
  }

  // Validate required fields
  if (!entry.type || !entry.system || !entry.description) {
    return { success: false, error: 'Missing required fields: type, system, description' };
  }

  registry.entries.push({
    id: entry.id,
    type: entry.type,
    system: entry.system,
    description: entry.description,
    source_stage: entry.source_stage || null,
    source_id: entry.source_id || null,
    added_at: new Date().toISOString(),
  });

  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
  return { success: true };
}

/**
 * Look up an ID in the registry (Stage 2+ entries).
 *
 * @param {string} projectDir - Project root containing .gf/
 * @param {string} id - ID string to look up
 * @returns {object|null} Entry object or null if not found
 */
function lookupId(projectDir, id) {
  const registryPath = path.join(projectDir, '.gf', 'traceability', 'id-registry.json');

  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
  } catch {
    return null;
  }

  return registry.entries.find(e => e.id === id) || null;
}

// ---- Concept-stage ID operations --------------------------------------------

/**
 * Add a concept-stage rule ID to the registry.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @param {object} entry - {id, chapter, description, data_bearing_type}
 * @returns {{success: boolean, error?: string}}
 */
function addConceptId(projectDir, entry) {
  const registryPath = path.join(projectDir, '.gf', 'traceability', 'id-registry.json');

  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
  } catch {
    return { success: false, error: 'Registry not found. Run registry init first.' };
  }

  // Ensure concept_entries array exists (graceful upgrade of old registries)
  if (!Array.isArray(registry.concept_entries)) {
    registry.concept_entries = [];
  }

  // Validate ID format
  if (!entry.id || !CONCEPT_ID_PATTERN.test(entry.id)) {
    return { success: false, error: `Invalid concept ID format: ${entry.id}. Expected: R_N_NN (e.g., R_3_01)` };
  }

  // Validate required fields
  if (entry.chapter === undefined || entry.chapter === null || !entry.description || !entry.data_bearing_type) {
    return { success: false, error: 'Missing required fields: chapter, description, data_bearing_type' };
  }

  // Validate data_bearing_type against concept module's list
  const conceptMod = getConcept();
  if (!conceptMod.validateDataBearingType(entry.data_bearing_type)) {
    return { success: false, error: `Invalid data_bearing_type: ${entry.data_bearing_type}` };
  }

  // Check for duplicates in concept_entries
  if (registry.concept_entries.some(e => e.id === entry.id)) {
    return { success: false, error: `Duplicate concept ID: ${entry.id}` };
  }

  registry.concept_entries.push({
    id: entry.id,
    chapter: entry.chapter,
    description: entry.description,
    data_bearing_type: entry.data_bearing_type,
    added_at: new Date().toISOString(),
  });

  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
  return { success: true };
}

/**
 * Look up a concept-stage rule ID in the registry.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @param {string} id - Concept ID to look up (R_N_NN format)
 * @returns {object|null} Entry object or null if not found
 */
function lookupConceptId(projectDir, id) {
  const registryPath = path.join(projectDir, '.gf', 'traceability', 'id-registry.json');

  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
  } catch {
    return null;
  }

  if (!Array.isArray(registry.concept_entries)) {
    return null;
  }

  return registry.concept_entries.find(e => e.id === id) || null;
}

// ---- Validation --------------------------------------------------------------

/**
 * Validate the registry for consistency issues.
 * Checks both entries (Stage 2+) and concept_entries (Stage 1).
 *
 * @param {string} projectDir - Project root containing .gf/
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateRegistry(projectDir) {
  const registryPath = path.join(projectDir, '.gf', 'traceability', 'id-registry.json');

  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
  } catch {
    return { valid: false, errors: ['Registry file not found or invalid JSON'] };
  }

  const errors = [];
  const seenIds = new Set();

  // Validate Stage 2+ entries
  for (const entry of registry.entries) {
    // Check for duplicate IDs
    if (seenIds.has(entry.id)) {
      errors.push(`Duplicate ID: ${entry.id}`);
    }
    seenIds.add(entry.id);

    // Check ID format
    if (!ID_PATTERN.test(entry.id)) {
      errors.push(`Invalid ID format: ${entry.id}`);
    }

    // Check required fields
    if (!entry.type) errors.push(`Missing type for ID: ${entry.id}`);
    if (!entry.system) errors.push(`Missing system for ID: ${entry.id}`);
    if (!entry.description) errors.push(`Missing description for ID: ${entry.id}`);
  }

  // Validate concept entries (graceful -- skip if array doesn't exist)
  if (Array.isArray(registry.concept_entries)) {
    const seenConceptIds = new Set();

    for (const entry of registry.concept_entries) {
      // Check for duplicate concept IDs
      if (seenConceptIds.has(entry.id)) {
        errors.push(`Duplicate concept ID: ${entry.id}`);
      }
      seenConceptIds.add(entry.id);

      // Check concept ID format
      if (!CONCEPT_ID_PATTERN.test(entry.id)) {
        errors.push(`Invalid concept ID format: ${entry.id}`);
      }

      // Check required fields
      if (!entry.description) errors.push(`Missing description for concept ID: ${entry.id}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---- Exports -----------------------------------------------------------------

module.exports = {
  initRegistry,
  addId,
  lookupId,
  addConceptId,
  lookupConceptId,
  validateRegistry,
  REGISTRY_TEMPLATE,
  ID_PATTERN,
  CONCEPT_ID_PATTERN,
};
