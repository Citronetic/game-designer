/**
 * Init -- Project scaffolding and initialization commands
 *
 * Provides compound init commands for Game Forge workflows:
 * - cmdScaffoldProject: create .gf/ directory with all files
 * - cmdInitNewGame: check project existence and git availability
 * - cmdInitResume: load full project context for session restoration
 * - cmdInitProgress: load state for progress display
 *
 * CommonJS, zero external dependencies. Requires ./core.cjs, ./state.cjs,
 * ./config.cjs, ./traceability.cjs.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execGit } = require('./core.cjs');
const { loadState, writeStateMd } = require('./state.cjs');
const { loadConfig, saveConfig } = require('./config.cjs');
const { initRegistry } = require('./traceability.cjs');

// ---- Stage directory structure ------------------------------------------------

const STAGE_DIRS = [
  'stages/01-concept',
  'stages/02-system-design/systems',
  'stages/03a-data-schema',
  'stages/03b-balance/configs',
  'stages/04-production',
  'traceability',
];

// ---- STATE.md template -------------------------------------------------------

function buildInitialStateMd(options) {
  const now = new Date().toISOString();
  const name = options.name || 'Untitled';
  const language = options.language || 'en';
  const genre = options.genre || '';

  return `---
gf_state_version: "1.0"
project_name: "${name}"
current_stage: 0
current_stage_name: setup
status: initialized
language: ${language}
genre: ${genre}
last_updated: "${now}"
stages:
  concept: pending
  system_design: pending
  data_schema: pending
  balance: pending
  production: pending
---

# Game Forge - Project State

## Project Reference

See: .gf/PROJECT.md

**Project:** ${name}
**Genre:** ${genre}
**Language:** ${language}
**Current Stage:** Setup (Stage 0)
**Status:** Initialized

## Stage Progress

| Stage | Status | Started | Completed |
|-------|--------|---------|-----------|
| 1. Concept | Pending | - | - |
| 2. System Design | Pending | - | - |
| 3A. Data Schema | Pending | - | - |
| 3B. Balance | Pending | - | - |
| 4. Production | Pending | - | - |

## Session Continuity

Last session: ${now}
Stopped at: Project initialized
Resume file: None
`;
}

// ---- PROJECT.md templates ----------------------------------------------------

function buildProjectMdScratch(options) {
  const name = options.name || 'Untitled';
  return `# ${name} - Game Design Document

## Overview

**Project:** ${name}
**Genre:** ${options.genre || 'TBD'}
**Platform:** ${options.platform || 'TBD'}
**Monetization:** ${options.monetization || 'TBD'}
**Language:** ${options.language || 'en'}
**Entry Path:** From scratch -- original game vision

## Game Concept

_Describe your original game idea here. What makes it unique? What is the core experience?_

## Target Audience

_Who is this game for? Age range, gaming experience, play session length._

## Core Loop

_What does the player do repeatedly? What drives engagement?_

## Key Design Goals

1. _Goal 1_
2. _Goal 2_
3. _Goal 3_

## Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Project created | Starting from scratch | ${new Date().toISOString().slice(0, 10)} |

---
*Created by Game Forge*
`;
}

function buildProjectMdReference(options) {
  const name = options.name || 'Untitled';
  return `# ${name} - Game Design Document

## Overview

**Project:** ${name}
**Genre:** ${options.genre || 'TBD'}
**Platform:** ${options.platform || 'TBD'}
**Monetization:** ${options.monetization || 'TBD'}
**Language:** ${options.language || 'en'}
**Entry Path:** From reference -- based on existing game or material

## Reference Material

_Describe the existing game, ad, or competitor you are using as reference. What aspects do you want to adapt or improve?_

## Reference Analysis

_What works well in the reference? What would you change? What is the target audience overlap?_

## Differentiation

_How will your game differ from the reference? What is your unique angle?_

## Core Loop

_What does the player do repeatedly? How does it differ from the reference?_

## Key Design Goals

1. _Goal 1_
2. _Goal 2_
3. _Goal 3_

## Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Project created | Starting from reference material | ${new Date().toISOString().slice(0, 10)} |

---
*Created by Game Forge*
`;
}

// ---- Public API --------------------------------------------------------------

/**
 * Create a complete .gf/ project directory structure.
 *
 * @param {string} cwd - Directory to create .gf/ in
 * @param {object} options - {name, language, genre, platform, monetization, entry_path, git_tracking}
 * @returns {{success: boolean, project_dir: string, files_created: string[]}}
 */
function cmdScaffoldProject(cwd, options) {
  const gfDir = path.join(cwd, '.gf');
  const filesCreated = [];

  // Create .gf/ and all stage subdirectories
  for (const dir of STAGE_DIRS) {
    fs.mkdirSync(path.join(gfDir, dir), { recursive: true });
  }

  // Write config.json
  const configObj = {
    gf_version: '1.0',
    project_name: options.name || '',
    language: options.language || 'en',
    genre: options.genre || '',
    platform: options.platform || '',
    monetization: options.monetization || '',
    entry_path: options.entry_path || 'scratch',
    git_tracking: options.git_tracking !== undefined ? options.git_tracking : true,
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  };
  saveConfig(cwd, configObj);
  filesCreated.push('.gf/config.json');

  // Write STATE.md
  const statePath = path.join(gfDir, 'STATE.md');
  const stateContent = buildInitialStateMd(options);
  fs.writeFileSync(statePath, stateContent, 'utf-8');
  filesCreated.push('.gf/STATE.md');

  // Write PROJECT.md based on entry path
  const projectPath = path.join(gfDir, 'PROJECT.md');
  const projectContent = options.entry_path === 'reference'
    ? buildProjectMdReference(options)
    : buildProjectMdScratch(options);
  fs.writeFileSync(projectPath, projectContent, 'utf-8');
  filesCreated.push('.gf/PROJECT.md');

  // Write id-registry.json via traceability module
  initRegistry(cwd);
  filesCreated.push('.gf/traceability/id-registry.json');

  return {
    success: true,
    project_dir: gfDir,
    files_created: filesCreated,
  };
}

/**
 * Check if a Game Forge project exists and if git is available.
 *
 * @param {string} cwd - Directory to check
 * @returns {{project_exists: boolean, has_git: boolean}}
 */
function cmdInitNewGame(cwd) {
  const projectExists = fs.existsSync(path.join(cwd, '.gf'));
  const gitResult = execGit(['--version'], cwd);
  const hasGit = gitResult.exitCode === 0;

  return {
    project_exists: projectExists,
    has_git: hasGit,
  };
}

/**
 * Load full project context for session restoration.
 *
 * @param {string} cwd - Project directory
 * @returns {object} Full project context or {project_exists: false}
 */
function cmdInitResume(cwd) {
  if (!fs.existsSync(path.join(cwd, '.gf'))) {
    return { project_exists: false };
  }

  const state = loadState(cwd);
  const config = loadConfig(cwd);

  const result = {
    project_exists: true,
    project_name: config.project_name || '',
    current_stage: 0,
    current_stage_name: 'setup',
    status: 'initialized',
    language: config.language || 'en',
    genre: config.genre || '',
    platform: config.platform || '',
    monetization: config.monetization || '',
    entry_path: config.entry_path || 'scratch',
    stages: {
      concept: 'pending',
      system_design: 'pending',
      data_schema: 'pending',
      balance: 'pending',
      production: 'pending',
    },
  };

  // Override with state frontmatter if available
  if (state && state.frontmatter) {
    const fm = state.frontmatter;
    if (fm.project_name) result.project_name = fm.project_name;
    if (fm.current_stage !== undefined) result.current_stage = fm.current_stage;
    if (fm.current_stage_name) result.current_stage_name = fm.current_stage_name;
    if (fm.status) result.status = fm.status;
    if (fm.language) result.language = fm.language;
    if (fm.genre) result.genre = fm.genre;
    if (fm.stages) result.stages = fm.stages;
    if (fm.last_updated) result.last_updated = fm.last_updated;
  }

  return result;
}

/**
 * Load state for progress display.
 *
 * @param {string} cwd - Project directory
 * @returns {object} Stages and position, or {project_exists: false}
 */
function cmdInitProgress(cwd) {
  if (!fs.existsSync(path.join(cwd, '.gf'))) {
    return { project_exists: false };
  }

  const state = loadState(cwd);
  const config = loadConfig(cwd);

  const result = {
    project_exists: true,
    project_name: config.project_name || '',
    current_stage: 0,
    stages: {
      concept: 'pending',
      system_design: 'pending',
      data_schema: 'pending',
      balance: 'pending',
      production: 'pending',
    },
  };

  if (state && state.frontmatter) {
    const fm = state.frontmatter;
    if (fm.project_name) result.project_name = fm.project_name;
    if (fm.current_stage !== undefined) result.current_stage = fm.current_stage;
    if (fm.stages) result.stages = fm.stages;
  }

  return result;
}

// ---- Exports -----------------------------------------------------------------

module.exports = {
  cmdScaffoldProject,
  cmdInitNewGame,
  cmdInitResume,
  cmdInitProgress,
};
