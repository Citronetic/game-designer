#!/usr/bin/env node

/**
 * Game Forge Tools -- CLI utility for Game Forge workflows
 *
 * Main entry point for all Game Forge CLI operations. Called via
 * `node bin/gf-tools.cjs <command> [args]` from within skills.
 *
 * Commands:
 *   scaffold project          Create .gf/ directory structure
 *   init new-game             Check project existence and git
 *   init resume               Load full project context
 *   init progress             Load state for progress display
 *   state json                Output STATE.md frontmatter as JSON
 *   state update <f> <v>      Update a STATE.md field
 *   state patch --f1 v1 ...   Batch update STATE.md fields
 *   state record-session      Update session timestamp
 *   config-get <key>          Get config value
 *   config-set <key> <val>    Set config value
 *   progress [pipeline|full]  Render pipeline visualization
 *   registry init             Create empty id-registry.json
 *   registry add <json>       Register an ID
 *   registry lookup <id>      Look up an ID
 *   registry validate         Validate registry consistency
 *   registry add-concept <j>  Register a concept-stage rule ID
 *   registry lookup-concept   Look up a concept-stage rule ID
 *   concept chapters          List chapter map as JSON
 *   concept rule-validate <id> Validate a concept rule ID
 *   concept chapter-status    Show per-chapter status
 *   system-design system-status        Show per-system completion status
 *   system-design propose-systems      Extract concept chapters for system proposal
 *   system-design confirm-systems      Save confirmed system list
 *   system-design trace-check          Validate concept->system traceability
 *   system-design consistency-check    Run 4 cross-system consistency checks
 *   system-design validate-system-id   Validate a system ID
 *   system-design validate-rule-id     Validate a system rule ID
 *   data-schema extract-anchors       Extract all 7A anchors from system files
 *   data-schema freeze-status         Check if schema is frozen
 *   data-schema freeze                Set schema frozen flag
 *   data-schema unfreeze              Unset schema frozen flag
 *   data-schema validate              Validate schema referential integrity
 *   data-schema export-csv            Re-export all CSV files from schema
 *   balance extract-7b               Extract all 7B inputs from system files
 *   balance status                   Get balance stage status
 *   balance validate-economy         Validate economy resource flows
 *   balance validate-freeze          Check schema freeze is intact
 *   balance update-csv               Update CSV data rows for a table
 *   production extract-art-anchors  Extract art anchors from system Section 8
 *   production extract-ui-anchors   Extract UI anchors from system Section 8
 *   production extract-7c           Extract 7C contracts from system Section 10
 *   production status               Get production stage status
 *   production set-status           Set production stage status
 *   production validate-traceability Validate spec IDs against registry
 *   video check-ffmpeg        Check ffmpeg/ffprobe availability
 *   video probe --file <p>    Get video metadata (duration, fps, resolution)
 *   video extract --file <p>  Extract frames at configured fps [--fps 0.5]
 *   video plan --duration <s> Plan frame extraction budget [--fps 0.5] [--max-frames 40]
 *   video cleanup --dir <p>   Remove extracted frame directory
 *   commit <msg> --files ...  Git commit helper
 *
 * Usage: node bin/gf-tools.cjs <command> [args] [--dir <path>]
 */

const fs = require('node:fs');
const path = require('node:path');
const { output, error, findProjectRoot, execGit } = require('./lib/core.cjs');
const state = require('./lib/state.cjs');
const config = require('./lib/config.cjs');
const init = require('./lib/init.cjs');
const traceability = require('./lib/traceability.cjs');

// Lazy-load progress to avoid circular dependency issues during scaffolding
let progress = null;
function getProgress() {
  if (!progress) {
    progress = require('./lib/progress.cjs');
  }
  return progress;
}

// Lazy-load concept module
let conceptMod = null;
function getConcept() {
  if (!conceptMod) {
    conceptMod = require('./lib/concept.cjs');
  }
  return conceptMod;
}

// Lazy-load system-design module
let systemDesignMod = null;
function getSystemDesign() {
  if (!systemDesignMod) {
    systemDesignMod = require('./lib/system-design.cjs');
  }
  return systemDesignMod;
}

// Lazy-load data-schema module
let dataSchemaMod = null;
function getDataSchema() {
  if (!dataSchemaMod) {
    dataSchemaMod = require('./lib/data-schema.cjs');
  }
  return dataSchemaMod;
}

// Lazy-load balance module
let balanceMod = null;
function getBalance() {
  if (!balanceMod) {
    balanceMod = require('./lib/balance.cjs');
  }
  return balanceMod;
}

// Lazy-load production module
let productionMod = null;
function getProduction() {
  if (!productionMod) {
    productionMod = require('./lib/production.cjs');
  }
  return productionMod;
}

// Lazy-load video module
let videoMod = null;
function getVideo() {
  if (!videoMod) {
    videoMod = require('./lib/video.cjs');
  }
  return videoMod;
}

// ---- Arg parsing helpers ------------------------------------------------------

function parseArgs(args) {
  const parsed = { _: [], flags: {} };
  let i = 0;
  while (i < args.length) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      // Check if next arg is a value (not another flag)
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        parsed.flags[key] = args[i + 1];
        i += 2;
      } else {
        parsed.flags[key] = true;
        i += 1;
      }
    } else {
      parsed._.push(args[i]);
      i += 1;
    }
  }
  return parsed;
}

function getCwd(flags) {
  if (flags.dir) {
    return path.resolve(flags.dir);
  }
  return process.cwd();
}

function getProjectDir(flags) {
  const cwd = getCwd(flags);
  const projectRoot = findProjectRoot(cwd);
  return projectRoot || cwd;
}

// ---- Usage --------------------------------------------------------------------

const USAGE = `Usage: node bin/gf-tools.cjs <command> [args] [--dir <path>]

Commands:
  scaffold project         Create .gf/ directory structure
  init new-game            Check project existence and git
  init resume              Load full project context
  init progress            Load state for progress display
  state json               STATE.md frontmatter as JSON
  state update <f> <v>     Update STATE.md field
  state patch --f1 v1      Batch update STATE.md fields
  state record-session     Update session timestamp
  config-get <key>         Get config value
  config-set <key> <val>   Set config value
  progress [pipeline|full] Render pipeline visualization
  registry init            Create empty id-registry.json
  registry add <json>      Register an ID
  registry lookup <id>     Look up an ID
  registry validate        Validate registry consistency
  registry add-concept <j> Register concept-stage rule ID
  registry lookup-concept  Look up concept-stage rule ID
  concept chapters         List chapter map as JSON
  concept rule-validate    Validate a concept rule ID
  concept chapter-status   Show per-chapter status
  system-design system-status        Per-system completion status
  system-design propose-systems      Extract concept chapters for proposal
  system-design confirm-systems      Save confirmed system list
  system-design trace-check          Concept->system traceability
  system-design consistency-check    Cross-system consistency checks
  system-design validate-system-id   Validate a system ID
  system-design validate-rule-id     Validate a system rule ID
  data-schema extract-anchors       Extract all 7A anchors from system files
  data-schema freeze-status         Check if schema is frozen
  data-schema freeze                Set schema frozen flag
  data-schema unfreeze              Unset schema frozen flag
  data-schema validate              Validate schema referential integrity
  data-schema export-csv            Re-export all CSV files from schema
  balance extract-7b               Extract all 7B inputs from system files
  balance status                   Get balance stage status
  balance validate-economy         Validate economy resource flows
  balance validate-freeze          Check schema freeze is intact
  balance update-csv               Update CSV data rows for a table
  production extract-art-anchors  Extract art anchors from Section 8
  production extract-ui-anchors   Extract UI anchors from Section 8
  production extract-7c           Extract 7C contracts from Section 10
  production status               Get production stage status
  production set-status           Set production stage status
  production validate-traceability Validate spec IDs against registry
  video check-ffmpeg       Check ffmpeg/ffprobe availability
  video probe --file <p>   Get video metadata (duration, fps, resolution)
  video extract --file <p> Extract frames at configured fps [--fps 0.5]
  video plan --duration <s> Plan frame extraction budget [--fps 0.5] [--max-frames 40]
  video cleanup --dir <p>  Remove extracted frame directory
  commit <msg> --files ... Git commit helper`;

// ---- Main router --------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);
  const command = parsed._[0];

  if (!command) {
    error(USAGE);
  }

  const cwd = getCwd(parsed.flags);

  switch (command) {
    // ---- scaffold ----
    case 'scaffold': {
      const subcommand = parsed._[1];
      if (subcommand === 'project') {
        const options = {
          name: parsed.flags.name || 'Untitled',
          language: parsed.flags.language || 'en',
          genre: parsed.flags.genre || '',
          platform: parsed.flags.platform || '',
          monetization: parsed.flags.monetization || '',
          entry_path: parsed.flags['entry-path'] || parsed.flags.entry_path || 'scratch',
          git_tracking: parsed.flags['git-tracking'] !== 'false',
        };
        const result = init.cmdScaffoldProject(cwd, options);
        output(result);
      } else {
        error('Unknown scaffold subcommand. Use: scaffold project');
      }
      break;
    }

    // ---- init ----
    case 'init': {
      const workflow = parsed._[1];
      switch (workflow) {
        case 'new-game': {
          const result = init.cmdInitNewGame(cwd);
          output(result);
          break;
        }
        case 'resume': {
          const result = init.cmdInitResume(cwd);
          output(result);
          break;
        }
        case 'progress': {
          const result = init.cmdInitProgress(cwd);
          output(result);
          break;
        }
        default:
          error('Unknown init workflow. Use: init new-game|resume|progress');
      }
      break;
    }

    // ---- state ----
    case 'state': {
      const subcommand = parsed._[1];
      const projectDir = getProjectDir(parsed.flags);

      switch (subcommand) {
        case 'json': {
          const stateData = state.loadState(projectDir);
          if (!stateData) {
            error('No STATE.md found in project');
          }
          output(stateData.frontmatter);
          break;
        }
        case 'update': {
          const field = parsed._[2];
          const value = parsed._[3];
          if (!field || value === undefined) {
            error('Usage: state update <field> <value>');
          }
          const updated = state.updateStateField(projectDir, field, value);
          output({ success: updated, field, value });
          break;
        }
        case 'patch': {
          // Parse --field value pairs from flags
          const patches = {};
          for (const [key, val] of Object.entries(parsed.flags)) {
            if (key !== 'dir') {
              patches[key] = val;
            }
          }
          const result = state.patchState(projectDir, patches);
          output(result);
          break;
        }
        case 'record-session': {
          const now = new Date().toISOString();
          const updated = state.updateStateField(projectDir, 'Last session', now);
          output({ success: updated, timestamp: now });
          break;
        }
        default:
          error('Unknown state subcommand. Use: state json|update|patch|record-session');
      }
      break;
    }

    // ---- config-get / config-set ----
    case 'config-get': {
      const key = parsed._[1];
      if (!key) {
        error('Usage: config-get <key>');
      }
      const projectDir = getProjectDir(parsed.flags);
      const value = config.getConfigValue(projectDir, key);
      output({ key, value });
      break;
    }
    case 'config-set': {
      const key = parsed._[1];
      const value = parsed._[2];
      if (!key || value === undefined) {
        error('Usage: config-set <key> <value>');
      }
      const projectDir = getProjectDir(parsed.flags);
      config.setConfigValue(projectDir, key, value);
      output({ success: true, key, value });
      break;
    }

    // ---- progress ----
    case 'progress': {
      const format = parsed._[1] || 'full';
      const projectDir = getProjectDir(parsed.flags);
      const prog = getProgress();
      const result = prog.cmdProgress(projectDir, format);
      output(result, true, result.display);
      break;
    }

    // ---- registry ----
    case 'registry': {
      const subcommand = parsed._[1];

      switch (subcommand) {
        case 'init': {
          const result = traceability.initRegistry(cwd);
          output(result);
          break;
        }
        case 'add': {
          const jsonStr = parsed._[2];
          if (!jsonStr) {
            error('Usage: registry add <json>');
          }
          let entry;
          try {
            entry = JSON.parse(jsonStr);
          } catch {
            error('Invalid JSON for registry add');
          }
          const projectDir = getProjectDir(parsed.flags);
          const result = traceability.addId(projectDir, entry);
          output(result);
          break;
        }
        case 'lookup': {
          const id = parsed._[2];
          if (!id) {
            error('Usage: registry lookup <id>');
          }
          const projectDir = getProjectDir(parsed.flags);
          const entry = traceability.lookupId(projectDir, id);
          output({ found: !!entry, entry });
          break;
        }
        case 'validate': {
          const projectDir = getProjectDir(parsed.flags);
          const result = traceability.validateRegistry(projectDir);
          output(result);
          break;
        }
        case 'add-concept': {
          const jsonStr = parsed._[2];
          if (!jsonStr) {
            error('Usage: registry add-concept <json>');
          }
          let entry;
          try {
            entry = JSON.parse(jsonStr);
          } catch {
            error('Invalid JSON for registry add-concept');
          }
          const projectDir = getProjectDir(parsed.flags);
          const result = traceability.addConceptId(projectDir, entry);
          output(result);
          break;
        }
        case 'lookup-concept': {
          const id = parsed._[2];
          if (!id) {
            error('Usage: registry lookup-concept <id>');
          }
          const projectDir = getProjectDir(parsed.flags);
          const entry = traceability.lookupConceptId(projectDir, id);
          output({ found: !!entry, entry });
          break;
        }
        default:
          error('Unknown registry subcommand. Use: registry init|add|lookup|validate|add-concept|lookup-concept');
      }
      break;
    }

    // ---- concept ----
    case 'concept': {
      const subcommand = parsed._[1];
      const concept = getConcept();

      switch (subcommand) {
        case 'chapters': {
          output(concept.CHAPTER_MAP);
          break;
        }
        case 'rule-validate': {
          const id = parsed._[2];
          if (!id) {
            error('Usage: concept rule-validate <id>');
          }
          const result = concept.validateConceptRuleId(id);
          output(result);
          break;
        }
        case 'chapter-status': {
          const projectDir = getProjectDir(parsed.flags);
          const statuses = concept.getChapterStatus(projectDir);
          output(statuses);
          break;
        }
        default:
          error('Unknown concept subcommand. Use: concept chapters|rule-validate|chapter-status');
      }
      break;
    }

    // ---- system-design ----
    case 'system-design': {
      const subcommand = parsed._[1];
      const sd = getSystemDesign();
      const projectDir = getProjectDir(parsed.flags);

      switch (subcommand) {
        case 'system-status': {
          const statuses = sd.getSystemStatus(projectDir);
          output(statuses);
          break;
        }
        case 'propose-systems': {
          // Read concept chapters from .gf/stages/01-concept/ch*.md
          const conceptDir = path.join(projectDir, '.gf', 'stages', '01-concept');
          let chapterFiles;
          try {
            chapterFiles = fs.readdirSync(conceptDir).filter(f => f.startsWith('ch') && f.endsWith('.md'));
          } catch {
            error('Concept stage directory not found. Complete Stage 1 first.');
            break;
          }
          const chapters = [];
          const { extractFrontmatter } = require('./lib/frontmatter.cjs');
          for (const file of chapterFiles.sort()) {
            const content = fs.readFileSync(path.join(conceptDir, file), 'utf-8');
            const { frontmatter } = extractFrontmatter(content);
            chapters.push({
              file,
              title: frontmatter.title || file,
              summary: frontmatter.summary || '',
              status: frontmatter.status || 'unknown',
            });
          }
          output(chapters);
          break;
        }
        case 'confirm-systems': {
          const dataStr = parsed.flags.data;
          if (!dataStr) {
            error('Usage: system-design confirm-systems --data <json>');
            break;
          }
          let systems;
          try {
            systems = JSON.parse(dataStr);
          } catch {
            error('Invalid JSON for confirm-systems --data');
            break;
          }
          const result = sd.saveConfirmedSystems(projectDir, systems);
          output(result);
          break;
        }
        case 'trace-check': {
          const result = sd.checkConceptTraceability(projectDir);
          output(result);
          break;
        }
        case 'consistency-check': {
          // Read all system files and run all 4 consistency checks
          const systemsDir = path.join(projectDir, '.gf', 'stages', '02-system-design', 'systems');
          let sysFiles;
          try {
            sysFiles = fs.readdirSync(systemsDir).filter(f => f.endsWith('.md'));
          } catch {
            error('Systems directory not found. No system designs yet.');
            break;
          }
          const { extractFrontmatter: extractFm } = require('./lib/frontmatter.cjs');
          const systemFileData = [];
          const knownSystemIds = [];
          for (const file of sysFiles) {
            const content = fs.readFileSync(path.join(systemsDir, file), 'utf-8');
            const { frontmatter, body } = extractFm(content);
            const id = frontmatter.system_id || file;
            systemFileData.push({ id, body });
            knownSystemIds.push(id);
          }
          const economyResult = sd.checkEconomyBalance(systemFileData);
          const taskResult = sd.checkTaskReferences(systemFileData, knownSystemIds);
          const tutorialResult = sd.checkTutorialCoverage(systemFileData);
          const monetizationResult = sd.checkMonetizationConflicts(systemFileData);
          output({
            economy: economyResult,
            tasks: taskResult,
            tutorial: tutorialResult,
            monetization: monetizationResult,
          });
          break;
        }
        case 'validate-system-id': {
          const id = parsed.flags.id;
          if (!id) {
            error('Usage: system-design validate-system-id --id <id>');
            break;
          }
          const result = sd.validateSystemId(id);
          output(result);
          break;
        }
        case 'validate-rule-id': {
          const id = parsed.flags.id;
          if (!id) {
            error('Usage: system-design validate-rule-id --id <id>');
            break;
          }
          const result = sd.validateSystemRuleId(id);
          output(result);
          break;
        }
        default:
          error('Unknown system-design subcommand. Use: system-design system-status|propose-systems|confirm-systems|trace-check|consistency-check|validate-system-id|validate-rule-id');
      }
      break;
    }

    // ---- data-schema ----
    case 'data-schema': {
      const subcommand = parsed._[1];
      const dataSchema = getDataSchema();
      const projectDir = getProjectDir(parsed.flags);

      switch (subcommand) {
        case 'extract-anchors': {
          try {
            const result = dataSchema.extract7AAnchors(projectDir);
            output(result);
          } catch (e) {
            error(`extract-anchors failed: ${e.message}`);
          }
          break;
        }
        case 'freeze-status': {
          try {
            const frozen = dataSchema.isSchemaFrozen(projectDir);
            const frozenAt = config.getConfigValue(projectDir, 'schema_frozen_at') || null;
            output({ frozen, frozen_at: frozenAt });
          } catch (e) {
            error(`freeze-status failed: ${e.message}`);
          }
          break;
        }
        case 'freeze': {
          try {
            const alreadyFrozen = dataSchema.isSchemaFrozen(projectDir);
            if (alreadyFrozen) {
              output({ ok: true, already_frozen: true });
            } else {
              dataSchema.setSchemaFrozen(projectDir, true);
              const frozenAt = config.getConfigValue(projectDir, 'schema_frozen_at');
              output({ ok: true, frozen_at: frozenAt });
            }
          } catch (e) {
            error(`freeze failed: ${e.message}`);
          }
          break;
        }
        case 'unfreeze': {
          try {
            dataSchema.setSchemaFrozen(projectDir, false);
            output({ ok: true, unfrozen: true, warning: 'Unfreezing schema will invalidate all balance work' });
          } catch (e) {
            error(`unfreeze failed: ${e.message}`);
          }
          break;
        }
        case 'validate': {
          try {
            const schemaDir = path.join(projectDir, '.gf', 'stages', '03a-data-schema');
            const tablesPath = path.join(schemaDir, 'tables.md');
            const tablesContent = fs.readFileSync(tablesPath, 'utf-8');

            // Parse tables from tables.md -- look for JSON block in frontmatter or structured content
            const { extractFrontmatter: extractFm } = require('./lib/frontmatter.cjs');
            const { frontmatter } = extractFm(tablesContent);
            const tables = frontmatter.tables || [];

            const result = dataSchema.validateReferentialIntegrity(tables);
            output(result);
          } catch (e) {
            if (e.code === 'ENOENT') {
              error('Schema directory or tables.md not found. Generate schema first.');
            } else {
              error(`validate failed: ${e.message}`);
            }
          }
          break;
        }
        case 'export-csv': {
          try {
            const schemaDir = path.join(projectDir, '.gf', 'stages', '03a-data-schema');
            if (!fs.existsSync(schemaDir)) {
              error('Schema directory does not exist. Generate schema first.');
              break;
            }
            const tablesPath = path.join(schemaDir, 'tables.md');
            const tablesContent = fs.readFileSync(tablesPath, 'utf-8');

            const { extractFrontmatter: extractFm } = require('./lib/frontmatter.cjs');
            const { frontmatter } = extractFm(tablesContent);
            const tables = frontmatter.tables || [];

            dataSchema.syncCSVExports(schemaDir, tables);
            output({ ok: true, files_written: tables.length });
          } catch (e) {
            if (e.code === 'ENOENT') {
              error('Schema directory or tables.md not found. Generate schema first.');
            } else {
              error(`export-csv failed: ${e.message}`);
            }
          }
          break;
        }
        default:
          error('Unknown data-schema subcommand. Use: data-schema extract-anchors|freeze-status|freeze|unfreeze|validate|export-csv');
      }
      break;
    }

    // ---- balance ----
    case 'balance': {
      const subcommand = parsed._[1];
      const balance = getBalance();
      const projectDir = getProjectDir(parsed.flags);

      switch (subcommand) {
        case 'extract-7b': {
          try {
            const result = balance.extract7BInputs(projectDir);
            output(result);
          } catch (e) {
            error(`extract-7b failed: ${e.message}`);
          }
          break;
        }
        case 'status': {
          try {
            const status = balance.getBalanceStatus(projectDir);
            output({ status });
          } catch (e) {
            error(`status failed: ${e.message}`);
          }
          break;
        }
        case 'validate-economy': {
          const flowsStr = parsed.flags.flows;
          if (!flowsStr) {
            error('Usage: balance validate-economy --flows <json>');
            break;
          }
          let flows;
          try {
            flows = JSON.parse(flowsStr);
          } catch {
            error('Invalid JSON for validate-economy --flows');
            break;
          }
          try {
            const result = balance.validateEconomyFlow(flows);
            output(result);
          } catch (e) {
            error(`validate-economy failed: ${e.message}`);
          }
          break;
        }
        case 'validate-freeze': {
          try {
            const dataSchema = getDataSchema();
            const intact = dataSchema.isSchemaFrozen(projectDir);
            // Also check CSV file count
            const configsDir = path.join(projectDir, '.gf', 'stages', '03a-data-schema', 'configs');
            let csvCount = 0;
            try {
              csvCount = fs.readdirSync(configsDir).filter(f => f.endsWith('.csv')).length;
            } catch {
              // configs dir may not exist yet
            }
            output({ intact, csv_files: csvCount });
          } catch (e) {
            error(`validate-freeze failed: ${e.message}`);
          }
          break;
        }
        case 'update-csv': {
          const table = parsed.flags.table;
          const dataStr = parsed.flags.data;
          if (!table) {
            error('Usage: balance update-csv --table <name> --data <json>');
            break;
          }
          if (!dataStr) {
            error('Usage: balance update-csv --table <name> --data <json>');
            break;
          }
          let data;
          try {
            data = JSON.parse(dataStr);
          } catch {
            error('Invalid JSON for update-csv --data');
            break;
          }
          try {
            const result = balance.updateTableValues(projectDir, table, data);
            output(result);
          } catch (e) {
            error(`update-csv failed: ${e.message}`);
          }
          break;
        }
        default:
          error('Unknown balance subcommand. Use: balance extract-7b|status|validate-economy|validate-freeze|update-csv');
      }
      break;
    }

    // ---- production ----
    case 'production': {
      const subcommand = parsed._[1];
      const production = getProduction();
      const projectDir = getProjectDir(parsed.flags);

      switch (subcommand) {
        case 'extract-art-anchors': {
          try {
            const result = production.extractArtAnchors(projectDir);
            output(result);
          } catch (e) {
            error(`extract-art-anchors failed: ${e.message}`);
          }
          break;
        }
        case 'extract-ui-anchors': {
          try {
            const result = production.extractUIAnchors(projectDir);
            output(result);
          } catch (e) {
            error(`extract-ui-anchors failed: ${e.message}`);
          }
          break;
        }
        case 'extract-7c': {
          try {
            const result = production.extract7CContracts(projectDir);
            output(result);
          } catch (e) {
            error(`extract-7c failed: ${e.message}`);
          }
          break;
        }
        case 'status': {
          try {
            const status = production.getProductionStatus(projectDir);
            output({ status });
          } catch (e) {
            error(`status failed: ${e.message}`);
          }
          break;
        }
        case 'set-status': {
          const value = parsed.flags.value;
          if (!value) {
            error('Usage: production set-status --value <status>');
            break;
          }
          try {
            production.setProductionStatus(projectDir, value);
            output({ success: true, status: value });
          } catch (e) {
            error(`set-status failed: ${e.message}`);
          }
          break;
        }
        case 'validate-traceability': {
          const idsStr = parsed.flags.ids;
          if (!idsStr) {
            error('Usage: production validate-traceability --ids <json-array>');
            break;
          }
          let ids;
          try {
            ids = JSON.parse(idsStr);
          } catch {
            error('Invalid JSON for validate-traceability --ids');
            break;
          }
          try {
            const result = production.validateSpecTraceability(projectDir, ids);
            output(result);
          } catch (e) {
            error(`validate-traceability failed: ${e.message}`);
          }
          break;
        }
        default:
          error('Unknown production subcommand. Use: production extract-art-anchors|extract-ui-anchors|extract-7c|status|set-status|validate-traceability');
      }
      break;
    }

    // ---- video ----
    case 'video': {
      const subcommand = parsed._[1];
      const video = getVideo();

      switch (subcommand) {
        case 'check-ffmpeg': {
          try {
            const available = video.checkFfmpeg();
            output({ available });
          } catch (e) {
            error(`check-ffmpeg failed: ${e.message}`);
          }
          break;
        }
        case 'probe': {
          const filePath = parsed.flags.file;
          if (!filePath) {
            error('Usage: video probe --file <path>');
            break;
          }
          const ext = path.extname(filePath).toLowerCase();
          if (!video.SUPPORTED_EXTENSIONS.has(ext)) {
            error('Unsupported video format. Supported: .mp4, .mov, .avi, .webm, .mkv');
            break;
          }
          try {
            const result = video.probeVideo(path.resolve(filePath));
            output(result);
          } catch (e) {
            error(`probe failed: ${e.message}`);
          }
          break;
        }
        case 'extract': {
          const filePath = parsed.flags.file;
          if (!filePath) {
            error('Usage: video extract --file <path> [--fps 0.5] [--output-dir <path>]');
            break;
          }
          const fps = parsed.flags.fps ? parseFloat(parsed.flags.fps) : undefined;
          let outputDir = parsed.flags['output-dir'];
          if (!outputDir) {
            try {
              const projectDir = getProjectDir(parsed.flags);
              outputDir = path.join(projectDir, '.gf', '.tmp', 'video-frames');
            } catch {
              outputDir = path.join(path.dirname(path.resolve(filePath)), '.tmp', 'video-frames');
            }
          }
          try {
            const opts = {};
            if (fps !== undefined) { opts.fps = fps; }
            const result = video.extractFrames(path.resolve(filePath), outputDir, opts);
            output(result);
          } catch (e) {
            error(`extract failed: ${e.message}`);
          }
          break;
        }
        case 'plan': {
          const durationStr = parsed.flags.duration;
          if (!durationStr) {
            error('Usage: video plan --duration <seconds> [--fps 0.5] [--max-frames 40]');
            break;
          }
          const duration = parseFloat(durationStr);
          const opts = {};
          if (parsed.flags.fps) { opts.fps = parseFloat(parsed.flags.fps); }
          if (parsed.flags['max-frames']) { opts.maxFrames = parseInt(parsed.flags['max-frames'], 10); }
          try {
            const result = video.planFrameExtraction(duration, opts);
            output(result);
          } catch (e) {
            error(`plan failed: ${e.message}`);
          }
          break;
        }
        case 'cleanup': {
          const dirPath = parsed.flags.dir;
          if (!dirPath) {
            error('Usage: video cleanup --dir <path>');
            break;
          }
          try {
            const result = video.cleanupFrames(path.resolve(dirPath));
            output(result);
          } catch (e) {
            error(`cleanup failed: ${e.message}`);
          }
          break;
        }
        default:
          error('Unknown video subcommand. Use: video check-ffmpeg|probe|extract|plan|cleanup');
      }
      break;
    }

    // ---- commit ----
    case 'commit': {
      const message = parsed._[1];
      if (!message) {
        error('Usage: commit <message> --files f1 f2 ...');
      }
      const projectDir = getProjectDir(parsed.flags);
      const files = parsed.flags.files;
      if (files) {
        const fileList = typeof files === 'string' ? files.split(' ') : [files];
        for (const f of fileList) {
          execGit(['add', f], projectDir);
        }
      }
      const commitResult = execGit(['commit', '-m', message], projectDir);
      output({
        success: commitResult.exitCode === 0,
        stdout: commitResult.stdout,
        stderr: commitResult.stderr,
      });
      break;
    }

    default:
      error(`Unknown command: ${command}\n\n${USAGE}`);
  }
}

main();
