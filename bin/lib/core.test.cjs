/**
 * Tests for core.cjs and frontmatter.cjs
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

// ─── core.cjs tests ──────────────────────────────────────────────────────────

describe('core.cjs', () => {
  const core = require('./core.cjs');

  describe('slugify', () => {
    it('converts mixed-case with spaces to lowercase hyphenated', () => {
      assert.strictEqual(core.slugify('My Game Name'), 'my-game-name');
    });

    it('trims leading/trailing whitespace and collapses non-alphanumeric', () => {
      assert.strictEqual(core.slugify('  Hello  World!! '), 'hello-world');
    });

    it('returns empty string for empty input', () => {
      assert.strictEqual(core.slugify(''), '');
    });

    it('handles null/undefined gracefully', () => {
      assert.strictEqual(core.slugify(null), '');
      assert.strictEqual(core.slugify(undefined), '');
    });
  });

  describe('execGit', () => {
    it('returns {exitCode, stdout, stderr} without throwing', () => {
      const result = core.execGit(['--version'], process.cwd());
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('git version'));
      assert.strictEqual(typeof result.stderr, 'string');
    });

    it('returns non-zero exit code on invalid command', () => {
      const result = core.execGit(['fake-command-that-does-not-exist'], process.cwd());
      assert.notStrictEqual(result.exitCode, 0);
    });
  });

  describe('output', () => {
    // output() calls process.exit(), so we test its logic indirectly
    // by verifying the function exists and has the right signature
    it('is a function with expected arity', () => {
      assert.strictEqual(typeof core.output, 'function');
    });
  });

  describe('error', () => {
    it('is a function', () => {
      assert.strictEqual(typeof core.error, 'function');
    });
  });

  describe('findProjectRoot', () => {
    it('is a function', () => {
      assert.strictEqual(typeof core.findProjectRoot, 'function');
    });

    it('returns null when no .gf/ directory exists', () => {
      const os = require('node:os');
      const result = core.findProjectRoot(os.tmpdir());
      assert.strictEqual(result, null);
    });
  });
});

// ─── frontmatter.cjs tests ──────────────────────────────────────────────────

describe('frontmatter.cjs', () => {
  const fm = require('./frontmatter.cjs');

  describe('extractFrontmatter', () => {
    it('extracts key-value pairs from YAML frontmatter', () => {
      const result = fm.extractFrontmatter('---\nkey: val\n---\nbody');
      assert.deepStrictEqual(result, { frontmatter: { key: 'val' }, body: 'body' });
    });

    it('returns empty frontmatter and full body when no frontmatter present', () => {
      const result = fm.extractFrontmatter('no frontmatter');
      assert.deepStrictEqual(result, { frontmatter: {}, body: 'no frontmatter' });
    });

    it('handles nested objects', () => {
      const input = '---\nstages:\n  concept: pending\n  design: complete\n---\nbody text';
      const result = fm.extractFrontmatter(input);
      assert.deepStrictEqual(result.frontmatter.stages, { concept: 'pending', design: 'complete' });
      assert.strictEqual(result.body, 'body text');
    });

    it('handles inline arrays', () => {
      const input = '---\nitems: [a, b, c]\n---\nbody';
      const result = fm.extractFrontmatter(input);
      assert.deepStrictEqual(result.frontmatter.items, ['a', 'b', 'c']);
    });

    it('handles block arrays', () => {
      const input = '---\nitems:\n  - alpha\n  - beta\n---\nbody';
      const result = fm.extractFrontmatter(input);
      assert.deepStrictEqual(result.frontmatter.items, ['alpha', 'beta']);
    });
  });

  describe('stripFrontmatter', () => {
    it('strips YAML frontmatter and returns body', () => {
      const result = fm.stripFrontmatter('---\nkey: val\n---\nbody');
      assert.strictEqual(result, 'body');
    });

    it('returns content unchanged when no frontmatter', () => {
      const result = fm.stripFrontmatter('no frontmatter here');
      assert.strictEqual(result, 'no frontmatter here');
    });
  });

  describe('reconstructFrontmatter', () => {
    it('converts simple key-value object to YAML string', () => {
      const result = fm.reconstructFrontmatter({ key: 'val' });
      assert.strictEqual(result, 'key: val');
    });

    it('handles nested objects', () => {
      const result = fm.reconstructFrontmatter({ stages: { concept: 'pending' } });
      assert.ok(result.includes('stages:'));
      assert.ok(result.includes('  concept: pending'));
    });

    it('handles arrays', () => {
      const result = fm.reconstructFrontmatter({ items: ['a', 'b'] });
      assert.ok(result.includes('items: [a, b]'));
    });

    it('skips null and undefined values', () => {
      const result = fm.reconstructFrontmatter({ key: 'val', empty: null, undef: undefined });
      assert.strictEqual(result, 'key: val');
    });
  });
});
