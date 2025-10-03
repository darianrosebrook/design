#!/bin/bash
# @fileoverview Validate token safety - ensure CSS variables, not literals
# @author @darianrosebrook

set -euo pipefail

# Read hook input from stdin
input=$(cat)

# Parse file path and content from input
file_path=$(echo "$input" | jq -r '.file_path // empty')
content=$(echo "$input" | jq -r '.content // empty')

# Skip if no file path
if [[ -z "$file_path" ]]; then
  exit 0
fi

# Only check CSS and style-related files
if [[ ! "$file_path" =~ \.(css|tsx|ts)$ ]]; then
  exit 0
fi

# Skip test files
if [[ "$file_path" =~ \.test\.|\.spec\.|tests/ ]]; then
  exit 0
fi

echo "Checking token safety in $file_path..." >&2

# Read file content if not provided in input
if [[ -z "$content" ]]; then
  content=$(cat "$file_path" 2>/dev/null || echo "")
fi

# Check for hardcoded CSS values that should be CSS variables
# This is a simplified check - look for common hardcoded values in style contexts

violations=()

# Look for hardcoded colors in CSS contexts
if echo "$content" | grep -E '#[0-9a-fA-F]{3,8}' >/dev/null 2>&1; then
  violations+=("hardcoded hex colors (should use CSS variables)")
fi

# Look for hardcoded pixel values in component styles (simplified check)
if echo "$content" | grep -E '[0-9]+px' >/dev/null 2>&1 && echo "$content" | grep -E '(width|height|margin|padding|font-size)' >/dev/null 2>&1; then
  violations+=("hardcoded pixel values in styles (consider design tokens)")
fi

# Look for hardcoded border-radius, spacing, etc.
hardcoded_patterns=(
  "border-radius:\s*[0-9]+px"
  "gap:\s*[0-9]+px"
  "margin:\s*[0-9]+px"
  "padding:\s*[0-9]+px"
)

for pattern in "${hardcoded_patterns[@]}"; do
  if echo "$content" | grep -E "$pattern" >/dev/null 2>&1; then
    violations+=("hardcoded spacing/border values (use design tokens)")
    break
  fi
done

if [[ ${#violations[@]} -gt 0 ]]; then
  echo "❌ TOKEN SAFETY VIOLATION in $file_path:" >&2
  printf '  %s\n' "${violations[@]}" >&2
  echo "💡 Use CSS variables from design tokens instead of hardcoded values" >&2
  echo "💡 Check packages/*/src/tokens/ for available design tokens" >&2
  exit 1
fi

echo "✅ Token safety check passed for $file_path" >&2
exit 0
