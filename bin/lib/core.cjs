/**
 * Core -- Shared utilities for Game Forge CLI tooling
 *
 * Provides output helpers, text utilities, git wrappers, and project
 * root discovery. All functions use Node.js builtins only (zero deps).
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execSync } = require('node:child_process');

// ─── Output helpers ────────────────────────────────────────────────────────

/**
 * Write structured result to stdout.
 * - raw mode: write rawValue as-is
 * - large payloads (>50KB): write to tmpfile, output @file: prefix
 * - default: JSON to stdout
 *
 * Calls process.exit(0) after writing.
 */
function output(result, raw, rawValue) {
  if (raw && rawValue !== undefined) {
    process.stdout.write(String(rawValue));
  } else {
    const json = JSON.stringify(result, null, 2);
    if (json.length > 50000) {
      const tmpPath = path.join(os.tmpdir(), `gf-${Date.now()}.json`);
      fs.writeFileSync(tmpPath, json, 'utf-8');
      process.stdout.write('@file:' + tmpPath);
    } else {
      process.stdout.write(json);
    }
  }
  process.exit(0);
}

/**
 * Write error message to stderr and exit with code 1.
 */
function error(message) {
  process.stderr.write('Error: ' + message + '\n');
  process.exit(1);
}

// ─── Text utilities ────────────────────────────────────────────────────────

/**
 * Convert text to a URL-friendly slug.
 * Lowercases, replaces non-alphanumeric chars with hyphens, trims hyphens.
 */
function slugify(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── File utilities ────────────────────────────────────────────────────────

/**
 * Safely read a file, returning null if it does not exist or cannot be read.
 */
function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

// ─── Git utilities ─────────────────────────────────────────────────────────

/**
 * Execute a git command and return {exitCode, stdout, stderr} without throwing.
 *
 * @param {string[]} args - git subcommand and arguments
 * @param {string} cwd - working directory
 * @returns {{exitCode: number, stdout: string, stderr: string}}
 */
function execGit(args, cwd) {
  try {
    const escaped = args.map(a => {
      if (/^[a-zA-Z0-9._\-/=:@]+$/.test(a)) return a;
      return "'" + a.replace(/'/g, "'\\''") + "'";
    });
    const stdout = execSync('git ' + escaped.join(' '), {
      cwd,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return { exitCode: 0, stdout: stdout.trim(), stderr: '' };
  } catch (err) {
    return {
      exitCode: err.status ?? 1,
      stdout: (err.stdout ?? '').toString().trim(),
      stderr: (err.stderr ?? '').toString().trim(),
    };
  }
}

// ─── Project root discovery ────────────────────────────────────────────────

/**
 * Walk up from startDir looking for a `.gf/` directory.
 * Returns the directory containing `.gf/`, or null if not found.
 */
function findProjectRoot(startDir) {
  let dir = path.resolve(startDir);
  const root = path.parse(dir).root;

  while (dir !== root) {
    if (fs.existsSync(path.join(dir, '.gf'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  // Check root itself
  if (fs.existsSync(path.join(dir, '.gf'))) {
    return dir;
  }
  return null;
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  output,
  error,
  slugify,
  safeReadFile,
  execGit,
  findProjectRoot,
};
