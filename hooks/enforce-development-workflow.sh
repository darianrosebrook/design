#!/bin/bash
# @fileoverview Enforce development workflow - verify script before prompt submission
# @author @darianrosebrook

set -euo pipefail

# Read hook input from stdin
input=$(cat)

# Parse prompt from input
prompt=$(echo "$input" | jq -r '.prompt // empty')

# Skip if no prompt
if [[ -z "$prompt" ]]; then
  exit 0
fi

echo "Checking development workflow compliance..." >&2

# Check if prompt contains code generation requests without proper context
if echo "$prompt" | grep -i "generate.*code\|create.*component\|build.*ui" >/dev/null; then
  # This is a code generation request - check if it follows proper workflow

  # Check if recent tests have been run (look for recent test output in terminal)
  # This is a simplified check - in practice you'd want to check test results
  if ! echo "$prompt" | grep -i "test\|verify\|golden" >/dev/null; then
    echo "⚠️  Code generation request detected" >&2
    echo "💡 Consider running 'npm run verify' first to ensure tests pass" >&2
    echo "💡 Use 'npm run test:golden' for UI generation to validate output" >&2
    # Don't block, just warn
  fi
fi

# Check for schema modification requests
if echo "$prompt" | grep -i "schema\|zod\|validation" >/dev/null; then
  echo "⚠️  Schema modification detected" >&2
  echo "💡 Remember to update both schema files AND validation tests" >&2
  echo "💡 Run 'npm run verify' after schema changes" >&2
fi

# Check for token system modifications
if echo "$prompt" | grep -i "token\|css.*variable\|design.*system" >/dev/null; then
  echo "⚠️  Token system modification detected" >&2
  echo "💡 Ensure all token references resolve to CSS variables" >&2
  echo "💡 Run 'npm run validate:tokens' to check token consistency" >&2
fi

echo "✅ Workflow check completed" >&2
exit 0
