/**
 * Progress -- ASCII pipeline visualization and stage detail rendering
 *
 * Provides pipeline visualization for Game Forge progress display.
 * Shows 5 stages with status indicators and a detail table.
 *
 * CommonJS, zero external dependencies. Requires ./state.cjs, ./core.cjs.
 */

const { loadState } = require('./state.cjs');
const { loadConfig } = require('./config.cjs');

// ---- Status indicators -------------------------------------------------------

const STATUS_INDICATOR = {
  pending: 'o',
  in_progress: '*',
  complete: '+',
};

const STATUS_DISPLAY = {
  pending: 'Pending',
  in_progress: 'In Progress',
  complete: 'Complete',
};

// ---- Stage definitions -------------------------------------------------------

const STAGES = [
  { key: 'concept', num: '1', name: 'Concept' },
  { key: 'system_design', num: '2', name: 'System Design' },
  { key: 'data_schema', num: '3A', name: 'Data Schema' },
  { key: 'balance', num: '3B', name: 'Balance' },
  { key: 'production', num: '4', name: 'Production' },
];

// ---- Pipeline rendering -------------------------------------------------------

/**
 * Render an ASCII pipeline visualization with status indicators.
 *
 * @param {object} stateData - {project_name, stages: {concept, system_design, ...}}
 * @returns {string} Multi-line ASCII pipeline string
 */
function renderPipeline(stateData) {
  const name = stateData.project_name || 'Game Forge';
  const stages = stateData.stages || {};

  const divider = '='.repeat(name.length + 14);

  // Get status indicators for each stage
  const indicators = STAGES.map(s => STATUS_INDICATOR[stages[s.key]] || 'o');

  const lines = [
    `Game Forge - ${name}`,
    divider,
    '',
    '  [1]         [2]            [3A]          [3B]         [4]',
    'Concept -> System      -> Data       -> Balance  -> Production',
    '           Design         Schema',
    '',
    `  ${indicators[0]}          ${indicators[1]}              ${indicators[2]}             ${indicators[3]}            ${indicators[4]}`,
    '',
    '  o = Pending   * = In Progress   + = Complete',
  ];

  return lines.join('\n');
}

// ---- Stage table rendering ----------------------------------------------------

/**
 * Render a markdown-style table with stage details.
 *
 * @param {object} stages - {concept, system_design, data_schema, balance, production}
 * @returns {string} Multi-line table string
 */
function renderStageTable(stages) {
  const lines = [
    '| # | Stage           | Status      |',
    '|---|-----------------|-------------|',
  ];

  for (const stage of STAGES) {
    const status = STATUS_DISPLAY[stages[stage.key]] || 'Pending';
    const name = stage.name.padEnd(15);
    const statusStr = status.padEnd(11);
    lines.push(`| ${stage.num} | ${name} | ${statusStr} |`);
  }

  return lines.join('\n');
}

// ---- Command handler ----------------------------------------------------------

/**
 * Load state and render progress visualization.
 *
 * @param {string} cwd - Project directory
 * @param {string} format - "pipeline" | "full" (default)
 * @returns {object} {display: string, project_exists: boolean, ...}
 */
function cmdProgress(cwd, format) {
  const state = loadState(cwd);
  const config = loadConfig(cwd);

  if (!state) {
    return {
      project_exists: false,
      display: 'No Game Forge project found. Run /gf:new-game to start.',
    };
  }

  const fm = state.frontmatter || {};
  const stateData = {
    project_name: fm.project_name || config.project_name || 'Untitled',
    stages: fm.stages || {
      concept: 'pending',
      system_design: 'pending',
      data_schema: 'pending',
      balance: 'pending',
      production: 'pending',
    },
  };

  const pipeline = renderPipeline(stateData);

  if (format === 'pipeline') {
    return {
      project_exists: true,
      project_name: stateData.project_name,
      display: pipeline,
    };
  }

  // Full format: pipeline + table
  const table = renderStageTable(stateData.stages);
  const display = `${pipeline}\n\nStage Details:\n${table}`;

  return {
    project_exists: true,
    project_name: stateData.project_name,
    stages: stateData.stages,
    display,
  };
}

// ---- Exports -----------------------------------------------------------------

module.exports = {
  renderPipeline,
  renderStageTable,
  cmdProgress,
  STATUS_INDICATOR,
  STATUS_DISPLAY,
  STAGES,
};
