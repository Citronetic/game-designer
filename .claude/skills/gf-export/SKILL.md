---
name: gf-export
description: "Export your game design deliverables in various formats"
disable-model-invocation: true
allowed-tools: [Read, Bash]
---

# /gf:export -- Export Deliverables

## Prerequisites

Run:
```bash
node bin/gf-tools.cjs init progress
```

- If `project_exists` is `false`: Display "No Game Forge project found. Run `/gf:new-game` to start." **Stop.**
- Check if at least one stage is `complete`. If no stages are complete: Display "Export requires at least one completed stage. Start with `/gf:concept`." **Stop.**

## Available Exports

### Data Schema CSV Export

Check if data schema tables exist:
```bash
ls .gf/stages/03a-data-schema/tables.md 2>/dev/null && echo "EXISTS" || echo "NOT_FOUND"
```

**If tables.md exists** (data_schema stage is `in_progress` or `complete`):

Run CSV export:
```bash
node bin/gf-tools.cjs data-schema export-csv
```

Display: "Exported **{files_written}** CSV config files to `.gf/stages/03a-data-schema/configs/`."

The CSV files are RFC 4180 compliant with UTF-8 BOM prefix for Excel compatibility. Each CSV contains:
- Row 1: field names
- Row 2: field types
- Row 3+: sample data rows

**If tables.md does NOT exist:**

Display: "Data schema not yet generated. Run `/gf:data-schema` to generate schema and CSV exports."

### Other Export Formats

Additional export formats (PDF, markdown bundle, structured data packages) will be available in Phase 6 for sharing complete game design deliverables with development teams.

## Current Status

```bash
node bin/gf-tools.cjs progress full
```

Display the progress output to the user.
