/**
 * Frontmatter -- YAML frontmatter parsing, extraction, and serialization
 *
 * Simple key-value YAML parser (not full YAML spec). Handles nested objects,
 * arrays (inline and block), and quoted strings. CommonJS, zero dependencies.
 */

// ─── Parsing ───────────────────────────────────────────────────────────────

/**
 * Extract YAML frontmatter and body from markdown content.
 *
 * @param {string} content - Full markdown content with optional ---\n...\n--- frontmatter
 * @returns {{frontmatter: object, body: string}}
 */
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]+?)\n---(?:\n|$)/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const yaml = match[1];
  const body = content.slice(match[0].length);
  const frontmatter = {};

  const lines = yaml.split('\n');

  // Stack tracks nested objects: [{obj, indent}]
  let stack = [{ obj: frontmatter, indent: -1 }];

  for (const line of lines) {
    if (line.trim() === '') continue;

    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;

    // Pop stack back to appropriate level
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const current = stack[stack.length - 1];

    // Check for key: value pattern
    const keyMatch = line.match(/^(\s*)([a-zA-Z0-9_-]+):\s*(.*)/);
    if (keyMatch) {
      const key = keyMatch[2];
      const value = keyMatch[3].trim();

      if (value === '' || value === '[') {
        // Key with no value -- could be nested object or block array
        current.obj[key] = value === '[' ? [] : {};
        stack.push({ obj: current.obj[key], indent });
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Inline array: key: [a, b, c]
        current.obj[key] = value
          .slice(1, -1)
          .split(',')
          .map(s => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      } else {
        // Simple key: value -- strip surrounding quotes
        current.obj[key] = value.replace(/^["']|["']$/g, '');
      }
    } else if (line.trim().startsWith('- ')) {
      // Array item
      const itemValue = line.trim().slice(2).replace(/^["']|["']$/g, '');

      // If current context is an empty object, convert to array
      if (typeof current.obj === 'object' && !Array.isArray(current.obj) && Object.keys(current.obj).length === 0) {
        const parent = stack.length > 1 ? stack[stack.length - 2] : null;
        if (parent) {
          for (const k of Object.keys(parent.obj)) {
            if (parent.obj[k] === current.obj) {
              parent.obj[k] = [itemValue];
              current.obj = parent.obj[k];
              break;
            }
          }
        }
      } else if (Array.isArray(current.obj)) {
        current.obj.push(itemValue);
      }
    }
  }

  return { frontmatter, body };
}

/**
 * Strip YAML frontmatter from content, returning only the body.
 */
function stripFrontmatter(content) {
  return content.replace(/^---\n[\s\S]*?\n---\n?/, '');
}

// ─── Serialization ─────────────────────────────────────────────────────────

/**
 * Convert an object to a YAML-formatted string (simple key-value pairs).
 * Handles nested objects (1-2 levels), arrays (inline and block), and
 * quoting of special characters.
 *
 * @param {object} obj
 * @returns {string} YAML lines joined by \n
 */
function reconstructFrontmatter(obj) {
  const lines = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;

    if (Array.isArray(value)) {
      _serializeArray(lines, key, value, 0);
    } else if (typeof value === 'object') {
      lines.push(`${key}:`);
      for (const [subkey, subval] of Object.entries(value)) {
        if (subval === null || subval === undefined) continue;
        if (Array.isArray(subval)) {
          _serializeArray(lines, subkey, subval, 2);
        } else if (typeof subval === 'object') {
          lines.push(`  ${subkey}:`);
          for (const [subsubkey, subsubval] of Object.entries(subval)) {
            if (subsubval === null || subsubval === undefined) continue;
            if (Array.isArray(subsubval)) {
              _serializeArray(lines, subsubkey, subsubval, 4);
            } else {
              lines.push(`    ${subsubkey}: ${_quoteIfNeeded(subsubval)}`);
            }
          }
        } else {
          lines.push(`  ${subkey}: ${_quoteIfNeeded(subval)}`);
        }
      }
    } else {
      const sv = String(value);
      if (sv.includes(':') || sv.includes('#') || sv.startsWith('[') || sv.startsWith('{')) {
        lines.push(`${key}: "${sv}"`);
      } else {
        lines.push(`${key}: ${sv}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Serialize an array at a given indentation level.
 * Short string arrays go inline; longer ones use block style.
 */
function _serializeArray(lines, key, arr, indent) {
  const pad = ' '.repeat(indent);
  if (arr.length === 0) {
    lines.push(`${pad}${key}: []`);
  } else if (arr.every(v => typeof v === 'string') && arr.length <= 3 && arr.join(', ').length < 60) {
    lines.push(`${pad}${key}: [${arr.join(', ')}]`);
  } else {
    lines.push(`${pad}${key}:`);
    for (const item of arr) {
      const itemStr = typeof item === 'string' && (item.includes(':') || item.includes('#'))
        ? `"${item}"`
        : item;
      lines.push(`${pad}  - ${itemStr}`);
    }
  }
}

/**
 * Quote a value string if it contains special YAML characters.
 */
function _quoteIfNeeded(val) {
  const sv = String(val);
  if (sv.includes(':') || sv.includes('#')) {
    return `"${sv}"`;
  }
  return sv;
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  extractFrontmatter,
  stripFrontmatter,
  reconstructFrontmatter,
};
