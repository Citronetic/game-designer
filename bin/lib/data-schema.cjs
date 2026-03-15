/**
 * Data Schema -- 7A anchor extraction, CSV generation, schema freeze,
 * and cross-table validation for the data schema stage (Stage 3A).
 *
 * Provides the programmatic foundation that the schema-generator agent
 * and SKILL.md orchestrator invoke to extract system anchors, generate
 * CSV exports, manage freeze state, and validate schema integrity.
 *
 * CommonJS, zero external dependencies (except sibling modules).
 */

const fs = require('node:fs');
const path = require('node:path');
const { safeReadFile } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');
const config = require('./config.cjs');

// ---- Constants ---------------------------------------------------------------

/**
 * Table layer classifications from the source spec (6 layers).
 * Every table in the schema must be assigned to exactly one layer.
 */
const TABLE_LAYERS = [
  'core_config',
  'constants',
  'probability',
  'i18n',
  'progress',
  'periodic_rewards',
];

/**
 * Structural field categories locked after schema freeze.
 * These cannot be modified during numerical balance (Stage 3B).
 */
const FREEZE_LOCKED_FIELDS = [
  'table names',
  'field names',
  'field types',
  'primary keys',
  'foreign keys',
  'relationship structure',
];

/**
 * Value-level field categories that remain adjustable after freeze.
 * Stage 3B (balance) can modify these without unfreezing.
 */
const FREEZE_ADJUSTABLE_FIELDS = [
  'default values',
  'validation ranges',
  'sample data values',
  'enum display names',
];

// ---- 7A Anchor Extraction ----------------------------------------------------

/**
 * Extract 7A data schema anchors from all system design files.
 * Reads .md files from .gf/stages/02-system-design/systems/, parses
 * frontmatter for system_id/system_name, then regex-matches the
 * "## 7A" section to extract table rows. Deduplicates by table_name,
 * merging related_rules from different systems.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @returns {{anchors: object[], systems: string[]}}
 *   anchors: [{system_id, system_name, table_name, purpose, related_rules}, ...]
 *   systems: [system_id, ...]
 */
function extract7AAnchors(projectDir) {
  const systemsDir = path.join(projectDir, '.gf', 'stages', '02-system-design', 'systems');
  const rawAnchors = [];
  const systems = [];

  let files;
  try {
    files = fs.readdirSync(systemsDir).filter(f => f.endsWith('.md'));
  } catch {
    return { anchors: [], systems: [] };
  }

  for (const file of files) {
    const content = safeReadFile(path.join(systemsDir, file));
    if (!content) continue;

    const { frontmatter, body } = extractFrontmatter(content);
    const systemId = frontmatter.system_id;
    const systemName = frontmatter.system_name;
    if (systemId) systems.push(systemId);

    // Extract the 7A section -- match from "## 7A" header until next "## " or end
    const section7A = body.match(/## 7A[.\s][\s\S]*?\n((?:\|[\s\S]*?)*?)(?=\n## |\n*$)/);
    if (!section7A) continue;

    // Parse pipe-delimited table rows
    const rows = section7A[1].split('\n').filter(r => r.trim().startsWith('|') && !r.includes('---'));
    for (const row of rows.slice(1)) { // skip header
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 2) {
        rawAnchors.push({
          system_id: systemId,
          system_name: systemName,
          table_name: cells[0],
          purpose: cells[1],
          related_rules: cells[2] || '',
        });
      }
    }
  }

  // Deduplicate by table_name, merging related_rules
  const deduped = new Map();
  for (const anchor of rawAnchors) {
    if (deduped.has(anchor.table_name)) {
      const existing = deduped.get(anchor.table_name);
      // Merge related_rules
      const existingRules = existing.related_rules ? existing.related_rules.split(',').map(r => r.trim()).filter(Boolean) : [];
      const newRules = anchor.related_rules ? anchor.related_rules.split(',').map(r => r.trim()).filter(Boolean) : [];
      const allRules = [...new Set([...existingRules, ...newRules])];
      existing.related_rules = allRules.join(', ');
    } else {
      deduped.set(anchor.table_name, { ...anchor });
    }
  }

  return { anchors: Array.from(deduped.values()), systems };
}

// ---- Name Conversion ---------------------------------------------------------

/**
 * Convert a display table name to a snake_case filename.
 * Lowercases, replaces spaces/hyphens with underscores,
 * collapses multiple underscores, trims leading/trailing underscores.
 *
 * @param {string} name - Display name (e.g., "Monster Config")
 * @returns {string} Snake-case filename (e.g., "monster_config")
 */
function tableNameToFilename(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// ---- CSV Generation ----------------------------------------------------------

/**
 * Escape a CSV field value per RFC 4180.
 * Wraps in quotes if the value contains commas, quotes, or newlines.
 * Doubles internal quotes. Null/undefined become empty string.
 *
 * @param {*} value - Field value to escape
 * @returns {string} Escaped CSV field
 */
function escapeCSVField(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Convert a table definition with sample data to CSV string.
 * Format: BOM + field names row + field types row + sample data rows.
 * Each field is escaped per RFC 4180.
 *
 * @param {object} tableDef - {name, fields: [{name, type}], sampleData: [[val, ...]]}
 * @returns {string} CSV content (UTF-8 with BOM)
 */
function tableToCSV(tableDef) {
  const BOM = '\uFEFF';
  const fieldNames = tableDef.fields.map(f => f.name);
  const fieldTypes = tableDef.fields.map(f => f.type);

  const rows = [fieldNames, fieldTypes];
  if (tableDef.sampleData && tableDef.sampleData.length > 0) {
    rows.push(...tableDef.sampleData);
  }

  const csvRows = rows.map(row => row.map(escapeCSVField).join(','));
  return BOM + csvRows.join('\n') + '\n';
}

/**
 * Generate one CSV file per table in the configs/ subdirectory.
 * Creates the configs/ directory if it does not exist.
 *
 * @param {string} schemaDir - Path to .gf/stages/03a-data-schema/
 * @param {object[]} tables - Array of table definitions {name, fields, sampleData}
 */
function syncCSVExports(schemaDir, tables) {
  const configsDir = path.join(schemaDir, 'configs');
  fs.mkdirSync(configsDir, { recursive: true });

  for (const table of tables) {
    const csv = tableToCSV(table);
    const filename = tableNameToFilename(table.name) + '.csv';
    fs.writeFileSync(path.join(configsDir, filename), csv, 'utf-8');
  }
}

// ---- Schema Freeze -----------------------------------------------------------

/**
 * Check if the data schema is frozen.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @returns {boolean} true if schema is frozen
 */
function isSchemaFrozen(projectDir) {
  const val = config.getConfigValue(projectDir, 'schema_frozen');
  return val === true || val === 'true';
}

/**
 * Set the schema freeze flag.
 * When freezing (true), also records the timestamp.
 * When unfreezing (false), sets the flag to false.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @param {boolean} frozen - Whether to freeze
 */
function setSchemaFrozen(projectDir, frozen) {
  config.setConfigValue(projectDir, 'schema_frozen', frozen);
  if (frozen) {
    config.setConfigValue(projectDir, 'schema_frozen_at', new Date().toISOString());
  }
}

// ---- Validation --------------------------------------------------------------

/**
 * Validate referential integrity of sample data across tables.
 * For each field with a foreignKey definition, checks that every
 * sample data value exists in the referenced table's primary key
 * sample data values.
 *
 * @param {object[]} tables - Array of {name, fields: [{name, type, primaryKey?, foreignKey?: {table, field}}], sampleData: [[...]]}
 * @returns {{valid: boolean, issues: object[]}}
 *   issues: [{table, field, value, referenced_table, reason}]
 */
function validateReferentialIntegrity(tables) {
  const issues = [];

  // Build a map of table name -> primary key values from sample data
  const pkValues = new Map();
  for (const table of tables) {
    for (let fi = 0; fi < table.fields.length; fi++) {
      const field = table.fields[fi];
      if (field.primaryKey) {
        const values = new Set();
        if (table.sampleData) {
          for (const row of table.sampleData) {
            values.add(row[fi]);
          }
        }
        pkValues.set(`${table.name}.${field.name}`, values);
      }
    }
  }

  // Check each FK field's sample data against referenced PK values
  for (const table of tables) {
    for (let fi = 0; fi < table.fields.length; fi++) {
      const field = table.fields[fi];
      if (!field.foreignKey) continue;

      const refKey = `${field.foreignKey.table}.${field.foreignKey.field}`;
      const refValues = pkValues.get(refKey);

      if (!refValues) {
        // Referenced table/field not found -- skip (validateRelationships handles this)
        continue;
      }

      if (table.sampleData) {
        for (const row of table.sampleData) {
          const value = row[fi];
          if (!refValues.has(value)) {
            issues.push({
              table: table.name,
              field: field.name,
              value,
              referenced_table: field.foreignKey.table,
              reason: `Value ${value} not found in ${field.foreignKey.table}.${field.foreignKey.field}`,
            });
          }
        }
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Validate that all relationship entries reference existing tables.
 * Checks both main_table and related_table exist in the known table names.
 *
 * @param {object[]} relationships - [{main_table, related_table, type, key}]
 * @param {string[]} tableNames - Array of known table names
 * @returns {{valid: boolean, issues: string[]}}
 */
function validateRelationships(relationships, tableNames) {
  const issues = [];
  const nameSet = new Set(tableNames);

  for (const rel of relationships) {
    if (!nameSet.has(rel.main_table)) {
      issues.push(`Relationship references missing main_table: ${rel.main_table}`);
    }
    if (!nameSet.has(rel.related_table)) {
      issues.push(`Relationship references missing related_table: ${rel.related_table}`);
    }
  }

  return { valid: issues.length === 0, issues };
}

// ---- Exports -----------------------------------------------------------------

module.exports = {
  TABLE_LAYERS,
  FREEZE_LOCKED_FIELDS,
  FREEZE_ADJUSTABLE_FIELDS,
  extract7AAnchors,
  tableNameToFilename,
  escapeCSVField,
  tableToCSV,
  syncCSVExports,
  isSchemaFrozen,
  setSchemaFrozen,
  validateReferentialIntegrity,
  validateRelationships,
};
