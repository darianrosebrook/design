# Delta Analysis: Goals vs Working Specs vs Documentation

**Author**: @darianrosebrook  
**Date**: October 2, 2025  
**Purpose**: Cross-reference goal.md, working specs, and documentation to identify gaps and inconsistencies

---

## Executive Summary

### Status Overview

- **CAWS Foundation**: ✅ Complete and aligned
- **Core Specification**: ✅ Well-defined with minor gaps
- **Documentation**: ⚠️ Partially aligned, needs updates
- **Implementation**: ❌ Not started (packages/ doesn't exist)

### Critical Deltas

1. **MCP Server Package Missing**: goal.md specifies MCP server extensively, but it's not in tier policy or DESIGNER-002 scope
2. **Monorepo Layout Mismatch**: goal.md uses `tools/` for CLI, working spec and docs use `apps/cli/`
3. **Documentation Not Updated**: docs/ files are simplified versions, missing MCP details and React preview features
4. **Missing Specs**: No working spec for canvas-engine, tokens, renderer, or vscode-ext packages

---

## 1. Repository Structure Deltas

### Delta 1.1: CLI Tools Location

> **Source: goal.md §1**
> ```
> └─ tools/
>    ├─ designer-generate.ts      # codegen CLI
>    └─ designer-watch.ts         # file watcher + reflect tokens
> ```

> **Source: goal.md §24.7 (Monorepo Layout)**
> ```
> ├─ apps/
> │  ├─ vscode-ext/            # the webview host; packs renderer + engine
> │  └─ cli/                   # designer-generate, designer-watch, designer-diff
> ```

**Inconsistency**: goal.md uses BOTH `tools/` (early sections) and `apps/cli/` (later sections). Working spec consistently uses `apps/cli/`.

**Resolution**: Use `apps/cli/` throughout. Update goal.md §1, §6, §7, §9 references.

---

### Delta 1.2: MCP Server Location

> **Source: goal.md §19 (Monorepo Layout)**
> ```
> │  └─ mcp-adapter/           # optional MCP stdio bridge for Cursor
> ```

> **Source: .caws/working-spec.yaml (DESIGNER-001)**
> ```yaml
> blast_radius:
>   modules:
>     - packages/canvas-mcp-server
> ```

**Mismatch**: goal.md calls it `mcp-adapter/`, working spec calls it `canvas-mcp-server/`.

**Gap**: MCP server not defined in DESIGNER-002 scope or tier policy packages list.

**Resolution**: Standardize on `packages/canvas-mcp-server` and create DESIGNER-003 working spec for it.

---

### Delta 1.3: Missing Packages

> **Source: .caws/policy/tier-policy.json**
> ```json
> "packages": [
>   "packages/canvas-schema",
>   "packages/canvas-engine",
>   "packages/codegen-react"
> ]
> ```

**Gap**: Tier policy only defines 3 Tier 1 packages. goal.md §19 includes 7 packages total:

- ✅ canvas-schema (Tier 1)
- ✅ canvas-engine (Tier 1)
- ✅ codegen-react (Tier 1)
- ⚠️ canvas-renderer-dom (Tier 2, but not in policy)
- ⚠️ tokens (Tier 2, but not in policy)
- ⚠️ canvas-mcp-server (not in policy at all)
- ⚠️ diff-visualizer (mentioned in goal.md §19 but nowhere else)

**Resolution**: Update tier-policy.json to include all packages with appropriate tier assignments.

---

## 2. MCP Integration Deltas

### Delta 2.1: MCP Methods Coverage

> **Source: .caws/working-spec.yaml (DESIGNER-001)**
> ```yaml
> contracts:
>   - type: mcp
>     path: .cursor/mcp.json
>     methods:
>       - '@paths.design/designer.getDoc'
>       - '@paths.design/designer.applyPatch'
>       - '@paths.design/designer.generate'
> ```

> **Source: goal.md §9**
> ```js
> if (msg.method==='@paths.design/designer.getDoc'){...}
> if (msg.method==='@paths.design/designer.applyPatch'){...}
> if (msg.method==='@paths.design/designer.generate'){...}
> ```

**Alignment**: ✅ MCP methods are consistent between working spec and goal.md

**Gap**: No dedicated working spec (DESIGNER-003) for MCP server implementation.

---

### Delta 2.2: MCP in Documentation

> **Source: docs/getting-started/vscode-extension.md**
> Includes full MCP server code example

> **Source: docs/getting-started/overview.md**
> No mention of MCP integration

**Gap**: MCP is documented in getting-started/vscode-extension.md but not mentioned in overview.md or as a separate feature.

**Resolution**: Add MCP section to overview.md; create docs/mcp-integration.md

---

## 3. Schema & Data Model Deltas

### Delta 3.1: Schema Package Scope

> **Source: DESIGNER-002 (canvas-schema spec)**
> ```yaml
> scope:
>   in:
>     - packages/canvas-schema/
>     - packages/canvas-schema/schemas/
>     - packages/canvas-schema/src/
>     - packages/canvas-schema/tests/
>   out:
>     - packages/canvas-engine/
>     - packages/codegen-react/
>     - apps/
> ```

> **Source: goal.md §24.2**
> ```json
> "files": ["dist", "schemas"]
> ```

**Alignment**: ✅ DESIGNER-002 correctly scopes canvas-schema package

**Delta**: DESIGNER-002 explicitly excludes engine/codegen/apps, which is correct for isolation

---

### Delta 3.2: Schema URL Difference

> **Source: goal.md §2**
> ```json
> "$id": "https://paths.design.dev/schemas/canvas-0.1.json"
> ```

> **Source: docs/reference/data-model.md**
> ```json
> "$id": "https://paths.design.dev/schemas/canvas-0.1.json"
> ```

**Alignment**: ✅ Schema URL is consistent

**Note**: Domain `paths.design.dev` is used consistently. Need to decide if this is final or placeholder.

---

### Delta 3.3: Schema Definition Format

> **Source: goal.md §2**
> Full JSON Schema (273 lines) with all node types

> **Source: docs/reference/data-model.md**
> Same full JSON Schema (227 lines, identical structure)

> **Source: goal.md §24.2 (Monorepo)**
> Zod-based TypeScript implementation instead of JSON Schema

**Inconsistency**: goal.md shows JSON Schema in §2, but §24 shows Zod implementation for the actual package.

**Resolution**: Both are valid. JSON Schema is the source of truth; Zod types are derived. Clarify this relationship in docs.

---

## 4. Token System Deltas

### Delta 4.1: Token Schema Location

> **Source: goal.md §4**
> ```json
> "$schema": "https://paths.design.dev/schemas/tokens-0.1.json"
> ```

> **Source: DESIGNER-001**
> ```yaml
> contracts:
>   - type: openapi
>     path: packages/canvas-schema/schemas/tokens-0.1.json
> ```

**Mismatch**: Working spec says `openapi` but tokens aren't OpenAPI format; they're JSON Schema.

**Resolution**: Change contract type to `graphql` (JSON Schema) or create new type `json-schema`.

---

### Delta 4.2: Token Reflection Performance

> **Source: .caws/working-spec.yaml**
> ```yaml
> perf:
>   additional:
>     - 'Token reflection updates CSS in <16ms'
> ```

> **Source: .caws/policy/tier-policy.json**
> ```json
> "token_reflection_ms": {
>   "p50": 8,
>   "p95": 16,
>   "p99": 32
> }
> ```

**Alignment**: ✅ Performance budgets are consistent

---

### Delta 4.3: Token Watcher Implementation

> **Source: goal.md §7**
> ```ts
> const flat = (obj: any, prefix = 'color'): string[] => {
> ```

**Bug**: Token watcher hardcodes `prefix = 'color'` but should handle all token types (color, space, type).

**Resolution**: Make token flattening generic across all token categories.

---

## 5. Code Generation Deltas

### Delta 5.1: Mappings File

> **Source: goal.md §5**
> ```json
> "componentLibrary": "vanilla"
> ```

> **Source: docs/getting-started/codegen.md**
> Same mappings.react.json structure

**Alignment**: ✅ Mappings spec is consistent

**Gap**: No working spec for codegen-react package yet (covered by DESIGNER-001 but not isolated).

---

### Delta 5.2: CLI Arguments

> **Source: goal.md §6**
> ```bash
> designer-generate design/home.canvas.json src/ui
> ```

> **Source: goal.md §24.7**
> ```ts
> const [,, docPath='design/home.canvas.json', outDir='src/ui'] = process.argv;
> ```

**Alignment**: ✅ CLI arguments are consistent with defaults

---

### Delta 5.3: Determinism Guarantees

> **Source: DESIGNER-001**
> ```yaml
> invariants:
>   - 'Code generation is deterministic - same input produces identical bytes'
>   - 'All timestamps use injected clock - no Date.now() in core logic'
> ```

> **Source: goal.md §6 (Determinism rules)**
> ```
> * Sort children by array index; stable ULIDs; stringify with fixed spacing; no Date.now().
> ```

**Alignment**: ✅ Determinism requirements are consistent

**Gap**: No test specification for SHA-256 hash verification in DESIGNER-001 acceptance criteria.

---

## 6. VS Code Extension Deltas

### Delta 6.1: Extension Package Name

> **Source: goal.md §8**
> ```json
> "name": "paths-design/designer"
> ```

> **Source: goal.md §24.8**
> ```json
> "name": "@paths-design/designer/vscode-ext"
> ```

**Inconsistency**: §8 uses `paths-design/designer`, §24 uses scoped `@paths-design/designer/vscode-ext`

**Resolution**: Use `@paths-design/designer-vscode` (standard VS Code extension naming) for marketplace, internal monorepo name can be `@paths-design/designer/vscode-ext`.

---

### Delta 6.2: Webview Security

> **Source: DESIGNER-001**
> ```yaml
> security:
>   - 'Webview CSP restricts to workspace files only - no remote content'
>   - 'All file operations use VS Code workspace API with path validation'
> ```

> **Source: goal.md §8**
> ```html
> <meta http-equiv="Content-Security-Policy" content="default-src 'none'; ...">
> ```

**Alignment**: ✅ CSP policy is correctly implemented

---

### Delta 6.3: Activation Events

> **Source: goal.md §8**
> ```json
> "activationEvents": ["onCommand:@paths.design/designer.open"]
> ```

**Note**: Modern VS Code uses `activationEvents: []` with `onCommand` auto-inferred from `contributes.commands`.

**Resolution**: Update to modern activation pattern in implementation.

---

## 7. React Preview Feature Deltas

### Delta 7.1: Feature Existence

> **Source: goal.md §23**
> Entire section (23.1-23.7) dedicated to React-in-Canvas preview system

> **Source: DESIGNER-001, DESIGNER-002**
> No mention of React preview feature

> **Source: docs/getting-started/codegen.md**
> No mention of React preview feature

**Gap**: React preview is a major feature in goal.md but completely absent from working specs and docs.

**Resolution**: Create DESIGNER-004 working spec for React preview system OR mark as v0.2+ roadmap item.

---

### Delta 7.2: Component Discovery

> **Source: goal.md §23.3**
> ```json
> {
>   "Button": {
>     "file": "src/ui/Button.tsx",
>     "props": {...}
>   }
> }
> ```

**Gap**: Component discovery via `design/components.index.json` is not in any working spec or acceptance criteria.

**Resolution**: If implementing React preview, add to working spec. Otherwise, defer to v0.2+.

---

## 8. Testing & Quality Gates Deltas

### Delta 8.1: Test Types Coverage

> **Source: DESIGNER-001**
> ```yaml
> non_functional:
>   a11y:
>     - 'Webview canvas has keyboard navigation for focus management'
>     - 'Generated components include semantic HTML and ARIA labels'
>     - 'Color contrast validation warns when tokens fail WCAG 4.5:1'
>     - 'Extension respects prefers-reduced-motion for animations'
> ```

> **Source: goal.md §13**
> ```
> * **Schema validation** with `ajv` on every save.
> * **Determinism**: snapshot tests on codegen outputs; same input → identical bytes.
> * **Token reflection** test: tokens → CSS vars mapping round-trips literal values.
> * **Accessibility quick-checks**: text color vs background contrast ≥ 4.5:1 if both resolve to hex.
> ```

**Gap**: DESIGNER-001 has comprehensive A11y requirements, but goal.md §13 only mentions contrast checks.

**Resolution**: Update goal.md to reference full A11y requirements from working spec.

---

### Delta 8.2: Property-Based Testing

> **Source: agents.md**
> ```typescript
> fc.assert(
>   fc.property(arbitraryCanvasDoc(), (doc) => {
>     const output1 = generate(doc);
>     const output2 = generate(doc);
>     return hash(output1) === hash(output2);
>   })
> );
> ```

> **Source: goal.md §13**
> No mention of property-based testing

> **Source: DESIGNER-002**
> No mention of property-based testing

**Gap**: Property-based testing is in agents.md framework but not in acceptance criteria.

**Resolution**: Add property-based test requirement to DESIGNER-001 and DESIGNER-002 acceptance criteria.

---

### Delta 8.3: Golden Frame Tests

> **Source: agents.md**
> ```
> ### Golden Frame Testing
> Maintain reference designs with expected output in `tests/golden/`.
> ```

> **Source: .caws/policy/tier-policy.json**
> ```json
> "additional_gates": {
>   "golden_frame_tests": true
> }
> ```

> **Source: DESIGNER-001**
> No specific acceptance criteria for golden frame tests

**Gap**: Golden frame tests are required by tier policy but not defined in acceptance criteria.

**Resolution**: Add A10 acceptance criterion for golden frame test verification.

---

## 9. Performance Budget Deltas

### Delta 9.1: Canvas Rendering

> **Source: DESIGNER-001**
> ```yaml
> perf:
>   additional:
>     - 'Canvas rendering maintains 60fps for documents up to 1000 nodes'
> ```

> **Source: .caws/policy/tier-policy.json**
> ```json
> "canvas_render_ms": {
>   "p50": 8,
>   "p95": 16,
>   "p99": 32
> }
> ```

> **Source: goal.md §12**
> ```
> * Avoid re-layout on every pointermove; throttle to 60Hz; batch patches.
> ```

**Alignment**: ✅ Performance budgets are consistent across all sources

---

### Delta 9.2: Codegen Performance

> **Source: DESIGNER-001**
> ```yaml
> perf:
>   additional:
>     - 'Code generation completes in <500ms for typical components'
> ```

> **Source: .caws/policy/tier-policy.json**
> ```json
> "codegen_duration_ms": {
>   "p50": 250,
>   "p95": 500,
>   "p99": 1000
> }
> ```

**Alignment**: ✅ Codegen performance budgets match

---

### Delta 9.3: API Performance

> **Source: DESIGNER-001**
> ```yaml
> perf:
>   api_p95_ms: 50
> ```

**Ambiguity**: "API" is not clearly defined. Is this MCP server RPC? VS Code API calls? Extension activation?

**Resolution**: Clarify which API operations this refers to. Likely MCP server methods.

---

## 10. Observability Deltas

### Delta 10.1: Log Coverage

> **Source: DESIGNER-001**
> 10 specific log events defined for canvas, codegen, tokens, extension, and MCP

> **Source: goal.md**
> No observability section

**Gap**: goal.md doesn't include observability strategy, but working spec does.

**Resolution**: goal.md is comprehensive enough; observability is correctly in working spec only.

---

### Delta 10.2: MCP Observability

> **Source: DESIGNER-001**
> ```yaml
> logs:
>   - 'mcp.request.received with method name and request ID'
>   - 'mcp.getDoc.success with document path and size'
>   - 'mcp.applyPatch.success with file path and write duration'
>   - 'mcp.generate.complete with generated file count and paths'
>   - 'mcp.error with method name and error details'
> metrics:
>   - 'mcp_requests_total counter by method'
>   - 'mcp_request_duration_ms histogram by method'
>   - 'mcp_errors_total counter by method and error_type'
> ```

**Good**: MCP observability is well-defined even though MCP implementation isn't yet specified.

---

## 11. Migration & Rollback Deltas

### Delta 11.1: Schema Migrations

> **Source: DESIGNER-001**
> ```yaml
> migrations:
>   - 'Initial release - no migrations required'
>   - 'Schema versioning strategy: schemaVersion field with migration scripts'
>   - 'Breaking changes require new schema version and migration guide'
> ```

> **Source: DESIGNER-002**
> ```yaml
> migrations:
>   - 'Initial release - no migrations required'
>   - 'Future schema versions will provide migration utilities'
> ```

**Alignment**: ✅ Migration strategy is consistent

---

### Delta 11.2: Rollback Strategy

> **Source: DESIGNER-001**
> ```yaml
> rollback:
>   - 'Extension can be disabled in VS Code settings'
>   - 'Generated code can be manually edited if codegen fails'
>   - 'Token watcher can be stopped if CSS output is incorrect'
>   - 'Documents validate backward compatible to allow downgrades'
>   - 'MCP server can be removed from .cursor/mcp.json to disable Cursor integration'
>   - 'Canvas documents are Git-tracked enabling revert of any MCP-applied changes'
> ```

> **Source: goal.md**
> No rollback section

**Good**: Working spec includes comprehensive rollback strategy not in goal.md.

---

## 12. Documentation Structure Deltas

### Delta 12.1: Missing Documentation

> **Source: goal.md §19**
> Comprehensive package list including:
> - canvas-engine
> - tokens
> - diff-visualizer
> - mcp-adapter

> **Source: docs/ directory**
> Only has:
> - getting-started/overview.md
> - reference/data-model.md
> - getting-started/tokens.md
> - getting-started/codegen.md
> - getting-started/vscode-extension.md

**Gaps**: Missing documentation for:
- ❌ canvas-engine.md (scene graph operations)
- ❌ mcp-integration.md (MCP server details)
- ❌ diff-visualizer.md (PR visual diffs)
- ❌ react-preview.md (React-in-Canvas feature)

**Resolution**: Create missing docs OR mark as v0.2+ features.

---

### Delta 12.2: Documentation Depth

> **Source: goal.md**
> 1302 lines, comprehensive specification with examples

> **Source: docs/getting-started/overview.md**
> 53 lines, high-level overview only

> **Source: docs/reference/data-model.md**
> 285 lines, detailed schema specification

**Observation**: docs/ are intentionally simplified reference docs, not full specification. This is correct.

---

## 13. Roadmap & Version Deltas

### Delta 13.1: Version Scope

> **Source: goal.md §0 (Non-Goals v0)**
> ```
> * Real-time multi-user CRDT sync (pave path via Y.js but not required).
> * Full Figma parity; start with **SVG import** and **basic shapes/text**.
> * Arbitrary framework generation; begin with **React + CSS Modules** (clear, readable output).
> ```

> **Source: DESIGNER-001**
> ```yaml
> title: 'Design-in-IDE Tool v0.1 - Foundation & Core Architecture'
> ```

**Alignment**: ✅ v0.1 scope is consistently defined as foundation

---

### Delta 13.2: Roadmap Features

> **Source: goal.md §16**
> ```
> * v0.2: Cursor MCP parity; JSON Patch over webview; SVG paste-in.
> * v0.3: Y.js CRDT opt-in; visual diff in PR; component instance → prop mapping UI.
> * v0.4: Figma plugin (export subset → canvas.json); React Native adapter.
> * v1.0: Plugin SDK for custom emitters; a11y & i18n linters; perf profiles.
> ```

**Question**: Is MCP part of v0.1 or v0.2?

- goal.md §9 shows MCP as part of main spec (suggests v0.1)
- goal.md §16 says "v0.2: Cursor MCP parity" (suggests v0.2)
- DESIGNER-001 includes MCP contracts and acceptance criteria (suggests v0.1)

**Inconsistency**: MCP is treated as both v0.1 and v0.2 feature.

**Resolution**: Clarify that v0.1 includes basic MCP server, v0.2 adds "parity" with additional features.

---

## 14. Critical Gaps Summary

### Must Address Before Implementation

1. **Create DESIGNER-003**: MCP server working spec
2. **Update tier-policy.json**: Add missing packages (canvas-renderer-dom, tokens, canvas-mcp-server)
3. **Standardize naming**: Resolve `tools/` vs `apps/cli/` and `mcp-adapter` vs `canvas-mcp-server`
4. **Clarify token contract type**: Change from `openapi` to `json-schema` or `graphql`
5. **Fix token watcher bug**: Make it handle all token types, not just `color`

### Should Address Soon

6. **Create working specs**: For canvas-engine, tokens, canvas-renderer-dom packages
7. **Add golden frame tests**: To DESIGNER-001/002 acceptance criteria
8. **Add property-based tests**: To acceptance criteria
9. **Clarify MCP versioning**: Is it v0.1 or v0.2?
10. **Document React preview**: Either create spec or mark as v0.2+

### Nice to Have

11. **Update docs/**: Create missing documentation files
12. **Clarify API performance**: Define which APIs the 50ms p95 applies to
13. **Extension naming**: Standardize marketplace vs monorepo naming
14. **Schema domain**: Decide if `paths.design.dev` is final or placeholder

---

## 15. Recommended Next Steps

### Immediate (Before Coding)

1. **Create DESIGNER-003-mcp-server.yaml**
   - Scope: packages/canvas-mcp-server
   - Acceptance criteria for all 3 MCP methods
   - Security requirements for path validation

2. **Update .caws/policy/tier-policy.json**
   ```json
   "2": {
     "packages": [
       "packages/canvas-renderer-dom",
       "packages/tokens",
       "apps/vscode-ext",
       "packages/canvas-mcp-server"
     ]
   }
   ```

3. **Fix token watcher in goal.md §7**
   ```ts
   function walk(o: any, p: string[]) {
     for (const k in o) {
       const v = o[k];
       const np = [...p, k];
       if (typeof v === 'object' && v !== null) {
         walk(v, np);
       } else {
         res.push(`--${np.join('-')}: ${v}`);
       }
     }
   }
   // Initial call
   for (const category in tokens) {
     walk(tokens[category], [category]);
   }
   ```

4. **Update DESIGNER-001 contract type**
   ```yaml
   contracts:
     - type: json-schema  # was: openapi
       path: packages/canvas-schema/schemas/tokens-0.1.json
   ```

### Short Term (During Implementation)

5. **Create package working specs**
   - DESIGNER-004: canvas-engine
   - DESIGNER-005: canvas-renderer-dom
   - DESIGNER-006: tokens
   - DESIGNER-007: vscode-ext

6. **Update goal.md consistency**
   - Replace all `tools/` references with `apps/cli/`
   - Replace `mcp-adapter` with `canvas-mcp-server`
   - Add observability section reference to working spec

7. **Add missing acceptance criteria**
   - A10: Golden frame tests pass for reference designs
   - A11: Property-based tests generate 1000 valid documents and all validate
   - A12: SHA-256 hashes verify deterministic codegen

### Medium Term (Post-v0.1)

8. **Create missing documentation**
   - docs/canvas-engine.md
   - docs/mcp-integration.md
   - docs/testing-strategy.md

9. **Decide on React preview**
   - If v0.1: Create DESIGNER-008-react-preview.yaml
   - If v0.2+: Move goal.md §23 to roadmap document

10. **Refine performance budgets**
    - Clarify "API p95" definition
    - Add MCP-specific budgets

---

## 16. Alignment Score

| Category | Score | Status |
|----------|-------|--------|
| **Core Specification** | 95% | ✅ Excellent |
| **Package Structure** | 80% | ⚠️ Needs tier policy update |
| **Documentation** | 70% | ⚠️ Simplified intentionally |
| **MCP Integration** | 85% | ⚠️ Needs dedicated spec |
| **Testing Strategy** | 90% | ✅ Well-defined |
| **Performance** | 95% | ✅ Clear budgets |
| **Security** | 95% | ✅ Well-specified |
| **Observability** | 100% | ✅ Comprehensive |
| **Naming Consistency** | 75% | ⚠️ Some conflicts |

**Overall**: 87% alignment — Strong foundation with minor cleanup needed

---

## Conclusion

Your Designer project has **excellent specification coverage** with the CAWS framework properly configured. The deltas identified are mostly:

1. **Naming inconsistencies** (tools/ vs apps/cli/)
2. **Missing working specs** for individual packages
3. **Tier policy incomplete** (doesn't list all packages)
4. **Documentation intentionally simplified** (not a problem)
5. **React preview unclear** (v0.1 or later?)

**Critical path**: Create DESIGNER-003 for MCP server, update tier policy, and resolve naming before starting implementation.

The working specs (DESIGNER-001, DESIGNER-002) are high quality and ready for development once the 5 critical gaps are addressed.

---

**Author**: @darianrosebrook  
**Review Status**: Ready for team review  
**Action Required**: Address 5 critical gaps before implementing packages/

