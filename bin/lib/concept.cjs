/**
 * Concept -- Chapter mapping, rule ID validation, genre filtering, and
 * chapter status tracking for the concept stage (Stage 1).
 *
 * Provides the programmatic infrastructure all concept-stage operations
 * depend on. Skills and agents call these functions via CLI commands.
 *
 * CommonJS, zero external dependencies (except sibling modules).
 */

const fs = require('node:fs');
const path = require('node:path');
const { safeReadFile } = require('./core.cjs');

// ---- Constants ---------------------------------------------------------------

/**
 * Map of all 15 concept chapters with num, slug, and titleKey.
 * Slug format: chNN-kebab-name (used for filenames in .gf/stages/01-concept/).
 */
const CHAPTER_MAP = [
  { num: 1,  slug: 'ch01-target-users',       titleKey: 'target_users' },
  { num: 2,  slug: 'ch02-product-positioning', titleKey: 'product_positioning' },
  { num: 3,  slug: 'ch03-core-gameplay',       titleKey: 'core_gameplay' },
  { num: 4,  slug: 'ch04-game-loops',          titleKey: 'game_loops' },
  { num: 5,  slug: 'ch05-levels-content',      titleKey: 'levels_content' },
  { num: 6,  slug: 'ch06-difficulty-balance',  titleKey: 'difficulty_balance' },
  { num: 7,  slug: 'ch07-onboarding',          titleKey: 'onboarding' },
  { num: 8,  slug: 'ch08-retention',           titleKey: 'retention' },
  { num: 9,  slug: 'ch09-ad-monetization',     titleKey: 'ad_monetization' },
  { num: 10, slug: 'ch10-light-payments',      titleKey: 'light_payments' },
  { num: 11, slug: 'ch11-art-style',           titleKey: 'art_style' },
  { num: 12, slug: 'ch12-ui-ux',               titleKey: 'ui_ux' },
  { num: 13, slug: 'ch13-tech-requirements',   titleKey: 'tech_requirements' },
  { num: 14, slug: 'ch14-data-analytics',      titleKey: 'data_analytics' },
  { num: 15, slug: 'ch15-revenue-roi',         titleKey: 'revenue_roi' },
];

/**
 * Concept-stage rule ID pattern: R_chapter_seq (e.g., R_3_01).
 * Chapter is 1-2 digits, sequence is exactly 2 digits.
 */
const CONCEPT_RULE_PATTERN = /^R_(\d{1,2})_(\d{2})$/;

/**
 * The 8 data-bearing types from the source template.
 * Used to classify rules by what kind of data they produce downstream.
 */
const DATA_BEARING_TYPES = [
  'level_config',       // 关卡配置
  'object_config',      // 对象配置
  'constant_config',    // 常量配置
  'probability_config', // 概率配置
  'growth_config',      // 成长配置
  'task_config',        // 任务配置
  'settlement_config',  // 结算配置
  'logic_impl',         // 逻辑实现项
];

// Chapter title lookup for building status tables
const CHAPTER_TITLES = [
  '', // index 0 unused
  'Target Users',
  'Product Positioning',
  'Core Gameplay',
  'Game Loops',
  'Levels & Content',
  'Difficulty & Balance',
  'Onboarding',
  'Retention',
  'Ad Monetization',
  'Light Payments',
  'Art Style',
  'UI/UX',
  'Tech Requirements',
  'Data & Analytics',
  'Revenue & ROI',
];

// ---- Chapter mapping ---------------------------------------------------------

/**
 * Get the slug for a chapter number.
 *
 * @param {number} num - Chapter number (1-15)
 * @returns {string} Chapter slug (e.g., 'ch03-core-gameplay')
 * @throws {Error} If num is not a valid chapter number
 */
function getChapterSlug(num) {
  const n = Number(num);
  if (!Number.isInteger(n) || n < 1 || n > 15) {
    throw new Error(`Invalid chapter number: ${num}. Must be 1-15.`);
  }
  return CHAPTER_MAP[n - 1].slug;
}

// ---- Rule ID validation ------------------------------------------------------

/**
 * Validate a concept-stage rule ID (R_N_NN format).
 * Returns a result object (not throw) for validation functions.
 *
 * @param {string} id - Rule ID to validate
 * @returns {{valid: boolean, chapter?: number, seq?: number, error?: string}}
 */
function validateConceptRuleId(id) {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'Rule ID must be a non-empty string' };
  }

  const match = CONCEPT_RULE_PATTERN.exec(id);
  if (!match) {
    return { valid: false, error: `Invalid format: ${id}. Expected R_N_NN (e.g., R_3_01)` };
  }

  const chapter = parseInt(match[1], 10);
  const seq = parseInt(match[2], 10);

  if (chapter < 1 || chapter > 15) {
    return { valid: false, error: `chapter out of range: ${chapter}. Must be 1-15` };
  }

  return { valid: true, chapter, seq };
}

// ---- Data-bearing type validation --------------------------------------------

/**
 * Check if a type string is a valid data-bearing type.
 *
 * @param {string} type - Type to validate
 * @returns {boolean}
 */
function validateDataBearingType(type) {
  if (!type || typeof type !== 'string') return false;
  return DATA_BEARING_TYPES.includes(type);
}

// ---- Genre filtering ---------------------------------------------------------

/**
 * Filter CHAPTER_MAP by a genre profile's chapter inclusion list.
 * Returns an array of chapter numbers that are included.
 *
 * @param {object} genreProfile - Object with `chapters` array of {num, include}
 * @returns {number[]} Array of included chapter numbers
 */
function filterChaptersByGenre(genreProfile) {
  if (!genreProfile || !Array.isArray(genreProfile.chapters)) {
    return [];
  }

  return genreProfile.chapters
    .filter(ch => {
      if (typeof ch.include === 'boolean') return ch.include;
      if (typeof ch.include === 'string') return ch.include.toUpperCase() === 'YES';
      return false;
    })
    .map(ch => ch.num);
}

// ---- Chapter status tracking -------------------------------------------------

/**
 * Read STATE.md and return per-chapter status object.
 * Parses the "Concept Stage Progress" table if present.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @returns {object} { chapterNum: status, ... } e.g., { 1: 'complete', 2: 'pending' }
 */
function getChapterStatus(projectDir) {
  const statePath = path.join(projectDir, '.gf', 'STATE.md');
  const content = safeReadFile(statePath);
  if (!content) return {};

  const statuses = {};

  // Match table rows like: | 1. Target Users | complete | R_1_01 |
  // or: | 3. Core Gameplay | in-progress | - |
  const tableRowPattern = /\|\s*(\d{1,2})\.\s*[^|]+\|\s*(\S+)\s*\|/g;
  let match;
  while ((match = tableRowPattern.exec(content)) !== null) {
    const chapterNum = parseInt(match[1], 10);
    const status = match[2].trim();
    if (chapterNum >= 1 && chapterNum <= 15) {
      statuses[chapterNum] = status;
    }
  }

  return statuses;
}

/**
 * Update chapter tracking in STATE.md body content.
 * If the chapter table exists, updates the row. If not, creates the table.
 *
 * @param {string} projectDir - Project root containing .gf/
 * @param {number} chapterNum - Chapter number (1-15)
 * @param {string} status - New status (e.g., 'complete', 'pending', 'in-progress')
 * @returns {{success: boolean, error?: string}}
 */
function updateChapterStatus(projectDir, chapterNum, status) {
  const num = Number(chapterNum);
  if (!Number.isInteger(num) || num < 1 || num > 15) {
    return { success: false, error: `Invalid chapter number: ${chapterNum}. Must be 1-15.` };
  }

  const statePath = path.join(projectDir, '.gf', 'STATE.md');
  let content = safeReadFile(statePath);
  if (!content) {
    return { success: false, error: 'STATE.md not found' };
  }

  const title = CHAPTER_TITLES[num];

  // Check if chapter progress table exists
  if (content.includes('## Concept Stage Progress')) {
    // Try to find and replace the existing row
    const rowPattern = new RegExp(
      `(\\|\\s*${num}\\.\\s*[^|]+\\|\\s*)\\S+(\\s*\\|)`,
    );
    if (rowPattern.test(content)) {
      content = content.replace(rowPattern, `$1${status}$2`);
    } else {
      // Row for this chapter doesn't exist -- add it before the end of the table
      // Find the last table row and append after it
      const lines = content.split('\n');
      const tableEnd = findTableEnd(lines, 'Concept Stage Progress');
      if (tableEnd >= 0) {
        lines.splice(tableEnd, 0, `| ${num}. ${title} | ${status} | - |`);
        content = lines.join('\n');
      }
    }
  } else {
    // No chapter table -- create it
    const tableHeader = `\n## Concept Stage Progress\n\n| Chapter | Status | Rules |\n|---------|--------|-------|\n| ${num}. ${title} | ${status} | - |\n`;
    content = content.trimEnd() + '\n' + tableHeader;
  }

  fs.writeFileSync(statePath, content, 'utf-8');
  return { success: true };
}

/**
 * Find the line index where the chapter table ends (first non-table line after header).
 * @private
 */
function findTableEnd(lines, sectionHeading) {
  let inSection = false;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(sectionHeading)) {
      inSection = true;
      continue;
    }
    if (inSection && lines[i].startsWith('|')) {
      inTable = true;
      continue;
    }
    if (inSection && inTable && !lines[i].startsWith('|')) {
      return i;
    }
  }

  // If we're at the end and still in the table, return lines.length
  if (inTable) return lines.length;
  return -1;
}

// ---- Entry builder -----------------------------------------------------------

/**
 * Build a registry-ready entry object for concept-stage rule IDs.
 *
 * @param {string} ruleId - Rule ID in R_N_NN format
 * @param {string} dataBearingType - One of DATA_BEARING_TYPES
 * @param {string} description - Rule description
 * @param {number} chapterNum - Chapter number (1-15)
 * @returns {object} Entry object with id, data_bearing_type, description, chapter
 *                   or {valid: false, error: string} if inputs are invalid
 */
function buildConceptEntry(ruleId, dataBearingType, description, chapterNum) {
  const idResult = validateConceptRuleId(ruleId);
  if (!idResult.valid) {
    return { valid: false, error: `Invalid rule ID: ${idResult.error}` };
  }

  if (!validateDataBearingType(dataBearingType)) {
    return { valid: false, error: `Invalid data-bearing type: ${dataBearingType}` };
  }

  return {
    id: ruleId,
    data_bearing_type: dataBearingType,
    description: description || '',
    chapter: chapterNum,
  };
}

// ---- Exports -----------------------------------------------------------------

module.exports = {
  CHAPTER_MAP,
  CONCEPT_RULE_PATTERN,
  DATA_BEARING_TYPES,
  getChapterSlug,
  validateConceptRuleId,
  validateDataBearingType,
  filterChaptersByGenre,
  getChapterStatus,
  updateChapterStatus,
  buildConceptEntry,
};
