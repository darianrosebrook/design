# Designer Project - Cursor Hooks

**Author**: @darianrosebrook

This directory contains Cursor hooks that enforce the Designer project's strict invariants for deterministic, schema-adherent code generation.

## Installation

1. Copy `hooks.json` to `~/.cursor/hooks.json`
2. Copy the `hooks/` directory to `~/.cursor/hooks/`
3. Make scripts executable: `chmod +x ~/.cursor/hooks/*.sh`
4. Restart Cursor

## Hooks Overview

### `enforce-determinism.sh` (afterFileEdit)
- **Purpose**: Prevents non-deterministic code patterns
- **Blocks**: `Date.now()`, `Math.random()`, `new Date()`, etc.
- **Why**: Ensures identical inputs produce identical outputs

### `canonicalize-json.sh` (afterFileEdit)
- **Purpose**: Formats JSON files for git-friendly diffs
- **Action**: Sorts keys, standardizes indentation, adds trailing newline
- **Why**: Stable IDs and merge-aware diffs

### `validate-schemas.sh` (afterFileEdit)
- **Purpose**: Validates JSON schemas and canvas documents
- **Action**: Runs Zod validation on schema files
- **Why**: Schema adherence prevents loose JSON corruption

### `validate-token-safety.sh` (beforeReadFile)
- **Purpose**: Ensures CSS variables over hardcoded values
- **Blocks**: Hardcoded hex colors, pixel values in styles
- **Why**: Token consistency and maintainable design systems

### `enforce-development-workflow.sh` (beforeSubmitPrompt)
- **Purpose**: Guides proper development workflow
- **Warns**: Missing tests before code generation, schema changes
- **Why**: Catches common workflow violations early

### `block-nondeterministic-commands.sh` (beforeShellExecution)
- **Purpose**: Prevents shell commands that introduce randomness
- **Blocks**: `uuidgen`, `/dev/random`, etc.
- **Why**: Maintains deterministic build environment

## Testing Hooks

You can test hooks without restarting Cursor using the Hooks tab in Cursor Settings. Check the Hooks output channel for errors.

## Customization

Edit the patterns in each script to match your specific needs. The hooks are designed to fail-fast with clear error messages and suggestions.

## Integration with CAWS

These hooks complement the CAWS framework by enforcing invariants at the editor level, preventing violations before they reach the specification phase.
