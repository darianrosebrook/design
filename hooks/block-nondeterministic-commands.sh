#!/bin/bash
# @fileoverview Block shell commands that could introduce non-determinism
# @author @darianrosebrook

set -euo pipefail

# Read hook input from stdin
input=$(cat)

# Parse command from input
command=$(echo "$input" | jq -r '.command // empty')

# Skip if no command
if [[ -z "$command" ]]; then
  exit 0
fi

echo "Checking command for determinism: $command" >&2

# Commands that could introduce non-determinism
blocked_patterns=(
  "date"
  "uuidgen"
  "openssl rand"
  "head /dev/urandom"
  "/dev/random"
  "/dev/urandom"
)

# Allow certain safe uses
allowed_patterns=(
  "date --iso"  # ISO format dates are deterministic for testing
  "date +%s"    # Unix timestamps can be injected
)

# Check for blocked patterns
for pattern in "${blocked_patterns[@]}"; do
  if echo "$command" | grep -F "$pattern" >/dev/null 2>&1; then
    # Check if it's in allowed patterns
    allowed=false
    for allowed_pattern in "${allowed_patterns[@]}"; do
      if echo "$command" | grep -F "$allowed_pattern" >/dev/null 2>&1; then
        allowed=true
        break
      fi
    done

    if [[ "$allowed" == "false" ]]; then
      echo "❌ BLOCKED: Command contains non-deterministic operation" >&2
      echo "  Pattern: $pattern" >&2
      echo "💡 Use deterministic alternatives or injected dependencies" >&2
      exit 1
    fi
  fi
done

# Check for git commands that might be problematic
if echo "$command" | grep -E "^git (commit|push|merge)" >/dev/null; then
  echo "⚠️  Git operation detected - ensure workspace is clean and tested" >&2
  # Don't block, just warn
fi

echo "✅ Command approved for determinism" >&2
exit 0
