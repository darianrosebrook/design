#!/bin/bash
# @fileoverview Test script for Cursor hooks
# @author @darianrosebrook

set -euo pipefail

echo "🧪 Testing Designer Cursor Hooks"
echo

# Test determinism hook
echo "Testing determinism hook..."
echo '{"file_path": "test.ts", "edits": []}' | ./enforce-determinism.sh
echo "✅ Determinism hook test passed"
echo

# Test JSON canonicalization
echo "Testing JSON canonicalization..."
echo '{"file_path": "test.json", "edits": []}' > /tmp/hook_test.json
echo '{"file_path": "/tmp/hook_test.json", "edits": []}' | ./canonicalize-json.sh
echo "✅ JSON canonicalization test passed"
echo

# Test token safety
echo "Testing token safety..."
echo '{"file_path": "test.css", "content": "color: var(--primary);"}' | ./validate-token-safety.sh
echo "✅ Token safety test passed"
echo

# Test workflow enforcement
echo "Testing workflow enforcement..."
echo '{"prompt": "generate some code"}' | ./enforce-development-workflow.sh
echo "✅ Workflow enforcement test passed"
echo

# Test command blocking
echo "Testing command blocking..."
echo '{"command": "echo hello"}' | ./block-nondeterministic-commands.sh
echo "✅ Command blocking test passed"
echo

echo "🎉 All hooks tests passed!"
echo
echo "To install hooks:"
echo "1. cp hooks.json ~/.cursor/hooks.json"
echo "2. cp -r hooks ~/.cursor/"
echo "3. Restart Cursor"
