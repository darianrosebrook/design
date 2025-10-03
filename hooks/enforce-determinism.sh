#!/bin/bash
# @fileoverview Enforce deterministic generation invariants
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

# Only check TypeScript/JavaScript files
if [[ ! "$file_path" =~ \.(ts|tsx|js|jsx)$ ]]; then
  exit 0
fi

# Skip test files
if [[ "$file_path" =~ \.test\.|\.spec\.|tests/ ]]; then
  exit 0
fi

echo "Checking determinism invariants in $file_path..." >&2

# Check for forbidden non-deterministic patterns
forbidden_patterns=(
  "Date\.now\(\)"
  "Math\.random\(\)"
  "new Date\(\)"
  "process\.hrtime\(\)"
  "crypto\.randomUUID\(\)"
  "crypto\.getRandomValues"
  "performance\.now\(\)"
)

violations=()

for pattern in "${forbidden_patterns[@]}"; do
  if grep -n "$pattern" "$file_path" 2>/dev/null; then
    violations+=("$pattern")
  fi
done

if [[ ${#violations[@]} -gt 0 ]]; then
  echo "❌ DETERMINISM VIOLATION in $file_path:" >&2
  printf '  Forbidden pattern: %s\n' "${violations[@]}" >&2
  echo "💡 Use injected clock/time providers or deterministic alternatives" >&2
  exit 1
fi

echo "✅ Determinism check passed for $file_path" >&2
exit 0
