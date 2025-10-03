#!/bin/bash
# @fileoverview Validate JSON schemas and schema-adherent files
# @author @darianrosebrook

set -euo pipefail

# Read hook input from stdin
input=$(cat)

# Parse file path from input
file_path=$(echo "$input" | jq -r '.file_path // empty')

# Skip if no file path
if [[ -z "$file_path" ]]; then
  exit 0
fi

# Only validate specific schema-related files
if [[ "$file_path" != "packages/canvas-schema/schemas/"* && "$file_path" != *".canvas.json" ]]; then
  exit 0
fi

echo "Validating schemas for $file_path..." >&2

# Check if we're in the project root
if [[ ! -f "package.json" ]] || [[ ! -d "packages/canvas-schema" ]]; then
  echo "⚠️  Not in project root, skipping schema validation" >&2
  exit 0
fi

# Run schema validation if available
if [[ -f "packages/canvas-schema/package.json" ]]; then
  cd packages/canvas-schema

  # Check if validation script exists
  if jq -e '.scripts.validate' package.json >/dev/null 2>&1; then
    echo "Running schema validation..." >&2
    if ! npm run validate 2>/dev/null; then
      echo "❌ Schema validation failed for $file_path" >&2
      exit 1
    fi
    echo "✅ Schema validation passed" >&2
  else
    echo "⚠️  No validation script found in canvas-schema" >&2
  fi

  cd ../..
fi

exit 0
