#!/bin/bash
# @fileoverview Canonicalize JSON files for git-friendly diffs
# @author @darianrosebrook

set -euo pipefail

# Read hook input from stdin
input=$(cat)

# Parse file path and edits from input
file_path=$(echo "$input" | jq -r '.file_path // empty')

# Skip if no file path
if [[ -z "$file_path" ]]; then
  exit 0
fi

# Only process JSON files
if [[ ! "$file_path" =~ \.json$ ]]; then
  exit 0
fi

# Skip certain JSON files that shouldn't be canonicalized
skip_patterns=(
  "package-lock.json"
  "pnpm-lock.yaml"
  "tsconfig.tsbuildinfo"
  "coverage/"
)

for pattern in "${skip_patterns[@]}"; do
  if [[ "$file_path" == *"$pattern"* ]]; then
    exit 0
  fi
done

echo "Canonicalizing JSON: $file_path..." >&2

# Create canonical version: sorted keys, 2-space indent, trailing newline
if command -v jq >/dev/null 2>&1; then
  # Use jq for proper canonicalization
  tmp_file=$(mktemp)
  jq --sort-keys '.' "$file_path" > "$tmp_file" 2>/dev/null || {
    echo "⚠️  Failed to parse JSON in $file_path, skipping canonicalization" >&2
    rm -f "$tmp_file"
    exit 0
  }

  # Only replace if content actually changed
  if ! diff -q "$file_path" "$tmp_file" >/dev/null 2>&1; then
    mv "$tmp_file" "$file_path"
    echo "✅ Canonicalized $file_path" >&2
  else
    rm -f "$tmp_file"
  fi
else
  echo "⚠️  jq not found, skipping JSON canonicalization" >&2
fi

exit 0
