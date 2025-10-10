# Designer Project - Gaps, Ambiguities & Research Questions

**Author**: @darianrosebrook  
**Date**: October 2, 2025  
**Status**: Research Required  
**Risk**: High - These gaps must be resolved before implementation

---

## Executive Summary

This document identifies critical gaps, ambiguities, and unknowns in the Designer project specification that require detailed research, prototyping, or architectural decisions before implementation can proceed safely.

**Priority Levels:**
- 🔴 **P0 (Blocking)**: Must resolve before any implementation
- 🟠 **P1 (Critical)**: Must resolve before feature completion
- 🟡 **P2 (Important)**: Should resolve during implementation
- 🔵 **P3 (Nice-to-have)**: Can defer to future iterations

---

## 1. Deterministic Code Generation 🔴 P0

### Gap: Specific Implementation of Determinism Guarantees

**What We Know:**
- Code generation must be deterministic (same input → identical output)
- No `Date.now()`, `Math.random()`, unstable ordering allowed
- SHA-256 hash comparison for validation

**What We Don't Know:**
1. **Clock Injection Pattern**:
   - How exactly do we inject a deterministic clock into the codegen system?
   - What interface does the clock provide?
   - How do we test it's being used correctly?

2. **String Ordering Guarantees**:
   - JavaScript object iteration order is insertion-order, but what about:
     - Webpack/esbuild module ordering?
     - Import statement ordering?
     - CSS property ordering?
   - Do we need a canonical sorter for all output strings?

3. **Floating Point Precision**:
   - Design coordinates can be floats (x: 12.5, y: 34.7)
   - Different machines might handle float operations differently
   - What precision do we enforce? (e.g., `.toFixed(2)`)
   - How do we handle rounding at boundaries?

4. **Template Rendering**:
   - Are templates pure functions or do they have state?
   - How do we ensure template helpers are deterministic?
   - Can templates depend on filesystem state (e.g., checking if file exists)?

### Research Questions

```yaml
RQ-001:
  title: "Design deterministic clock injection pattern"
  priority: P0
  questions:
    - How do we pass clock to all codegen functions?
    - Should it be dependency injection or context parameter?
    - How do we enforce usage in tests?
  experiments:
    - Prototype 3 different injection patterns
    - Benchmark performance overhead
    - Test ergonomics with real codegen code

RQ-002:
  title: "Define canonical string sorting algorithm"
  priority: P0
  questions:
    - What sort algorithm guarantees cross-platform stability?
    - Do we need locale-independent sorting?
    - How do we handle special characters in CSS class names?
  experiments:
    - Test sorting on Node.js vs browser
    - Compare Intl.Collator vs simple string comparison
    - Validate on different OSes (macOS, Linux, Windows)

RQ-003:
  title: "Establish floating point precision policy"
  priority: P0
  questions:
    - What precision is sufficient for design coordinates?
    - Do we need different precision for different properties?
    - How do we handle sub-pixel rendering?
  experiments:
    - Analyze real design file precision requirements
    - Test rounding errors across 1000s of operations
    - Compare with industry-standard design tool precision handling
```

### Proposed Resolution Path

1. **Create proof-of-concept** for deterministic codegen with fixtures
2. **Document canonical algorithms** in `docs/determinism.md`
3. **Build testing framework** that validates determinism across machines
4. **Add CI job** that runs codegen on different OSes and compares hashes

**Owner**: TBD  
**Timeline**: Before any codegen implementation (Week 1-2)

---

## 2. Merge Conflict Resolution 🔴 P0

### Gap: Object-Level 3-Way Merge Algorithm

**What We Know:**
- Stable ULIDs prevent ID collisions
- Canonical JSON reduces diff noise
- Need "semantic diff" tool for PR comments

**What We Don't Know:**
1. **Conflict Detection**:
   - What constitutes a "conflict" in design files?
   - If two branches move the same node, how do we detect it?
   - How do we diff nested child arrays?

2. **Conflict Resolution Strategies**:
   - "Spatial average" mentioned but not defined—how exactly?
   - What if branches delete different children of same parent?
   - How do we handle conflicting style changes?

3. **Meta.conflicts Format**:
   - What structure for recording conflicts?
   - How does user resolve recorded conflicts?
   - Can conflicts be auto-resolved?

4. **CRDT Integration**:
   - Mention of "optional Yjs" but no details
   - Would CRDT replace custom merge logic or complement it?
   - What's the migration path?

### Research Questions

```yaml
RQ-004:
  title: "Define design file conflict taxonomy"
  priority: P0
  questions:
    - What types of conflicts can occur in canvas.json?
    - Which are auto-resolvable vs require human review?
    - How do we communicate conflicts to users?
  experiments:
    - Create 20 example conflict scenarios
    - Categorize by severity and resolution strategy
    - Test with Git's merge-driver API

RQ-005:
  title: "Design semantic diff algorithm for nodes"
  priority: P0
  questions:
    - How do we compare node trees efficiently?
    - What's the output format (text, JSON, visual)?
    - Can we integrate with GitHub diff UI?
  experiments:
    - Prototype diff algorithm on sample docs
    - Generate visual diffs as HTML
    - Test performance with 1000-node documents

RQ-006:
  title: "Evaluate CRDT vs custom merge logic"
  priority: P1
  questions:
    - What's the overhead of Yjs for design files?
    - Can Yjs handle our canvas schema?
    - What about offline edits and sync?
  experiments:
    - Build Yjs POC with canvas schema
    - Measure bundle size and performance
    - Test merge scenarios vs custom logic
```

### Proposed Resolution Path

1. **Research Git merge drivers** - Can we hook into Git's merge process?
2. **Prototype conflict detector** - Identify conflicts in test cases
3. **Design conflict UI** - How do users see/resolve conflicts?
4. **Document merge strategy** in `docs/merge-strategy.md`

**Owner**: TBD  
**Timeline**: Before multi-user features (Week 2-3)

---

## 3. VS Code Extension Security 🟠 P1

### Gap: Comprehensive Security Model

**What We Know:**
- Webview uses CSP to restrict access
- Only workspace files accessible
- No eval() or Function()

**What We Don't Know:**
1. **Path Validation**:
   - How do we validate paths from webview messages?
   - What prevents directory traversal attacks?
   - Can webview request files outside workspace?

2. **Message Validation**:
   - What schema for webview ↔ extension messages?
   - How do we validate message payloads?
   - What's the error handling for malformed messages?

3. **Resource Limits**:
   - What if user tries to load 100MB canvas file?
   - Memory limits for webview?
   - How do we handle infinite loops in rendering?

4. **Token Sanitization**:
   - Tokens become CSS variables—can they inject code?
   - What about special characters in token names?
   - How do we escape user content in generated code?

### Research Questions

```yaml
RQ-007:
  title: "Design secure message protocol for webview"
  priority: P1
  questions:
    - What Zod schemas for all message types?
    - How do we version the protocol?
    - What's the error handling strategy?
  experiments:
    - Define message contracts with Zod
    - Test malformed message handling
    - Prototype protocol versioning

RQ-008:
  title: "Implement path validation and sandboxing"
  priority: P1
  questions:
    - What allowlist of file patterns?
    - How do we validate relative vs absolute paths?
    - What errors to show users?
  experiments:
    - Test path normalization edge cases
    - Try directory traversal attacks
    - Document allowed/denied patterns

RQ-009:
  title: "Establish resource limits and quotas"
  priority: P1
  questions:
    - What's max canvas file size?
    - How many nodes before warning user?
    - Memory budget for extension?
  experiments:
    - Load test with large documents
    - Profile memory usage
    - Implement quota warnings
```

### Proposed Resolution Path

1. **Security audit** - Review VS Code extension security best practices
2. **Create threat model** - Document attack vectors
3. **Implement validation layer** - Zod schemas for all inputs
4. **Document security model** in `docs/security.md`

**Owner**: TBD  
**Timeline**: Before extension alpha release (Week 3-4)

---

## 4. React Component Discovery & Indexing 🟠 P1

### Gap: Component Library Implementation

**What We Know:**
- Need `design/components.index.json` with component metadata
- Extract prop schemas from TypeScript
- Support drag-and-drop onto canvas

**What We Don't Know:**
1. **Discovery Mechanism**:
   - How do we find all components in a project?
   - File naming convention vs explicit config?
   - Support for nested component directories?

2. **Metadata Extraction**:
   - Use `react-docgen-typescript` or TSC API directly?
   - How do we handle complex prop types (unions, generics)?
   - What about runtime prop validation (Zod, PropTypes)?

3. **Build-time vs Runtime**:
   - Index at build time or runtime?
   - How do we keep index fresh during development?
   - Watch mode for component changes?

4. **Component Versioning**:
   - How do we handle component API changes?
   - Do we version component contracts?
   - Migration path for breaking changes?

### Research Questions

```yaml
RQ-010:
  title: "Design component discovery system"
  priority: P1
  questions:
    - What's the discovery convention?
    - How do we handle monorepo component libraries?
    - Support for third-party component libraries?
  experiments:
    - Prototype file scanner with glob patterns
    - Test with real component libraries (MUI, Chakra)
    - Benchmark discovery time for large projects

RQ-011:
  title: "Evaluate prop extraction strategies"
  priority: P1
  questions:
    - react-docgen-typescript vs TS Compiler API?
    - How accurate is extraction for complex types?
    - Performance impact on large codebases?
  experiments:
    - Compare extraction tools on real components
    - Test with generics, unions, intersections
    - Measure extraction time vs component count

RQ-012:
  title: "Define component index format and versioning"
  priority: P1
  questions:
    - What schema for component index?
    - How do we track component versions?
    - Backward compatibility strategy?
  experiments:
    - Design JSON schema for index
    - Prototype version migration system
    - Test with breaking component changes
```

### Proposed Resolution Path

1. **Evaluate existing tools** - Research react-docgen-typescript alternatives
2. **Prototype discovery** - Build scanner for test project
3. **Define index schema** - Document format in `docs/component-index.md`
4. **Implement watcher** - Auto-rebuild index on changes

**Owner**: TBD  
**Timeline**: Before component library feature (Week 5-6)

---

## 5. Token Reflection & CSS Variable Generation 🟡 P2

### Gap: Token System Implementation Details

**What We Know:**
- Tokens defined in `docs/examples/tokens.json`
- Reflect to CSS `:root` variables
- Token references in design resolve to `var(--token-name)`

**What We Don't Know:**
1. **Token Transformation Rules**:
   - How do we transform `tokens.color.primary` → `--color-primary`?
   - What about nested tokens? (e.g., `tokens.color.button.primary`)
   - Case sensitivity and special characters?

2. **Token Types**:
   - Only colors, spacing, typography?
   - What about shadows, borders, transitions?
   - Complex values like gradients?

3. **Token References**:
   - Can tokens reference other tokens?
   - How deep can reference chains go?
   - Circular reference detection?

4. **Token Updates**:
   - What if token value changes but variable name stays same?
   - Do we need token migration system?
   - How do we handle token deletions?

### Research Questions

```yaml
RQ-013:
  title: "Define token transformation algorithm"
  priority: P2
  questions:
    - What's the exact naming convention?
    - How do we handle naming collisions?
    - Support for vendor-prefixed vars?
  experiments:
    - Test various token structures
    - Validate CSS variable naming rules
    - Compare with design systems (Chakra, Tailwind)

RQ-014:
  title: "Design token reference resolution system"
  priority: P2
  questions:
    - What syntax for token references?
    - How do we resolve nested references?
    - Error handling for missing tokens?
  experiments:
    - Prototype reference resolver
    - Test circular reference detection
    - Define error messages for users

RQ-015:
  title: "Establish token versioning and migration"
  priority: P2
  questions:
    - How do we version token schemas?
    - What happens when tokens are removed?
    - Migration tooling for breaking changes?
  experiments:
    - Design token migration format
    - Prototype token rename tool
    - Test with real token evolution scenarios
```

### Proposed Resolution Path

1. **Study design system standards** - Research Design Tokens Community Group spec
2. **Define token schema** - Complete JSON schema for tokens
3. **Implement resolver** - Build token reference system
4. **Document token system** in `docs/tokens-detailed.md`

**Owner**: TBD  
**Timeline**: During token system implementation (Week 4-5)

---

## 6. Canvas Rendering Performance 🟡 P2

### Gap: Performance Optimization Strategy

**What We Know:**
- Target: 60fps (16ms per frame)
- Dirty tracking for incremental updates
- Batch patches to avoid thrashing

**What We Don't Know:**
1. **Rendering Architecture**:
   - Single canvas or layer per artboard?
   - Hardware acceleration support?
   - What about high-DPI displays?

2. **Hit Testing**:
   - Mention of "R-tree for hit testing" but no details
   - How do we handle overlapping nodes?
   - Touch target sizes for accessibility?

3. **Large Documents**:
   - What's the max node count we support?
   - Layer list virtualization at 500 nodes—why 500?
   - Memory management strategy?

4. **Paint Optimization**:
   - What triggers a repaint?
   - Can we paint only dirty regions?
   - Throttling vs debouncing for pointer events?

### Research Questions

```yaml
RQ-016:
  title: "Design high-performance canvas renderer"
  priority: P2
  questions:
    - Canvas 2D vs SVG vs WebGL?
    - Layer caching strategy?
    - How to handle transforms and effects?
  experiments:
    - Benchmark rendering approaches
    - Test with 1000+ node documents
    - Profile paint time by node type

RQ-017:
  title: "Implement efficient hit testing"
  priority: P2
  questions:
    - R-tree vs quad-tree vs simple iteration?
    - Library or custom implementation?
    - How do we handle z-index?
  experiments:
    - Compare spatial index libraries
    - Test with complex nested hierarchies
    - Benchmark hit test performance

RQ-018:
  title: "Establish document size limits and warnings"
  priority: P2
  questions:
    - What's the realistic node count limit?
    - When do we warn users?
    - Graceful degradation strategy?
  experiments:
    - Load test with progressively larger docs
    - Identify performance cliffs
    - Design user warnings
```

### Proposed Resolution Path

1. **Performance profiling** - Benchmark current approach
2. **Optimize hot paths** - Identify and fix bottlenecks
3. **Implement monitoring** - Track FPS and memory usage
4. **Document performance** in `docs/performance.md`

**Owner**: TBD  
**Timeline**: During renderer implementation (Week 3-4)

---

## 7. SVG Import & Conversion 🟡 P2

### Gap: SVG to Canvas Node Conversion

**What We Know:**
- Accept SVG string → parse to DOM → convert to VectorNode
- Map fill/stroke to Style
- Heuristic token matching

**What We Don't Know:**
1. **SVG Support Scope**:
   - What SVG features do we support?
   - Paths, shapes, text—what about filters, masks, clips?
   - What about embedded images or fonts?

2. **Conversion Fidelity**:
   - Can we round-trip SVG → Canvas → SVG?
   - What features are lossy?
   - How do we warn users about unsupported features?

3. **Token Matching Heuristic**:
   - How exact must color match be? (exact, close, fuzzy?)
   - What about transformed colors (opacity, blend modes)?
   - Can we suggest token assignments?

4. **Performance**:
   - What's the max SVG size we can import?
   - How many paths before performance degrades?
   - Should we simplify complex paths?

### Research Questions

```yaml
RQ-019:
  title: "Define SVG feature support matrix"
  priority: P2
  questions:
    - What SVG elements do we support?
    - What's the fallback for unsupported features?
    - How do we communicate limitations?
  experiments:
    - Catalog common SVG features
    - Test import of real SVG assets
    - Document supported/unsupported matrix

RQ-020:
  title: "Design SVG to VectorNode conversion"
  priority: P2
  questions:
    - How do we optimize path data?
    - Group vs separate nodes?
    - Preserve layer names?
  experiments:
    - Prototype converter with svgo
    - Test round-trip fidelity
    - Compare output size

RQ-021:
  title: "Implement smart token matching"
  priority: P2
  questions:
    - What algorithm for color matching?
    - Support for color spaces (RGB, HSL, etc.)?
    - Confidence scoring for matches?
  experiments:
    - Prototype color matcher
    - Test with real tokens and SVGs
    - Define match thresholds
```

### Proposed Resolution Path

1. **SVG feature analysis** - Catalog what we need to support
2. **Prototype converter** - Build SVG → Canvas converter
3. **Test with real assets** - Import from industry-standard design tools
4. **Document SVG support** in `docs/svg-import.md`

**Owner**: TBD  
**Timeline**: SVG import feature (Week 6-7)

---

## 8. Testing Infrastructure 🔵 P3

### Gap: Comprehensive Testing Strategy

**What We Know:**
- Property-based testing with fast-check
- Golden frame tests for codegen
- Mutation testing with tier thresholds

**What We Don't Know:**
1. **Test Data Generation**:
   - How do we generate realistic canvas documents?
   - What's the arbitrary generator strategy?
   - How do we ensure valid but edge-case data?

2. **Golden Frame Management**:
   - How do we update golden frames?
   - Version control for expected outputs?
   - What if platform differences affect output?

3. **Visual Regression Testing**:
   - Do we need screenshot comparison?
   - What tool for visual diffs?
   - How do we handle anti-aliasing differences?

4. **Extension Testing**:
   - How do we test VS Code extension code?
   - Mock VS Code API or use real API?
   - Integration vs unit tests for extension?

### Research Questions

```yaml
RQ-022:
  title: "Design property-based test strategy"
  priority: P3
  questions:
    - What properties are most valuable to test?
    - How do we generate valid canvas docs?
    - What's the shrinking strategy for failures?
  experiments:
    - Write example property tests
    - Test shrinking with complex docs
    - Measure test coverage

RQ-023:
  title: "Establish golden frame workflow"
  priority: P3
  questions:
    - How do we approve golden frame updates?
    - Where do we store large binaries?
    - How do we handle platform differences?
  experiments:
    - Prototype golden frame update tool
    - Test on multiple platforms
    - Design review workflow

RQ-024:
  title: "Evaluate visual regression testing tools"
  priority: P3
  questions:
    - Percy vs Chromatic vs custom solution?
    - What's the cost/benefit?
    - How do we integrate with CI?
  experiments:
    - Trial visual testing tools
    - Compare accuracy and cost
    - Prototype CI integration
```

### Proposed Resolution Path

1. **Define test strategy** - Document in `docs/testing-strategy.md`
2. **Set up test infrastructure** - CI, fixtures, utilities
3. **Create test templates** - Reusable test patterns
4. **Document testing guide** for contributors

**Owner**: TBD  
**Timeline**: Alongside feature development (Ongoing)

---

## 9. Cursor MCP Integration 🔵 P3

### Gap: MCP Protocol Implementation

**What We Know:**
- Cursor MCP for bidirectional sync
- JSON-RPC over stdio
- Methods: getDoc, applyPatch, generate

**What We Don't Know:**
1. **MCP Protocol Details**:
   - What's the exact message format?
   - Error handling and retries?
   - How do we version the protocol?

2. **Cursor Integration**:
   - How does Cursor discover the MCP server?
   - What permissions does MCP server need?
   - Can MCP server access workspace files?

3. **Sync Strategy**:
   - Is MCP real-time or on-demand?
   - How do we handle conflicts with extension?
   - Can both MCP and extension run simultaneously?

4. **Security**:
   - How do we validate MCP requests?
   - Is MCP scoped to workspace?
   - What about running arbitrary code?

### Research Questions

```yaml
RQ-025:
  title: "Research Cursor MCP protocol specification"
  priority: P3
  questions:
    - What's the official MCP spec?
    - What existing MCP servers can we learn from?
    - What are the limitations?
  experiments:
    - Study Cursor documentation
    - Analyze example MCP servers
    - Document protocol expectations

RQ-026:
  title: "Design MCP server architecture"
  priority: P3
  questions:
    - Same codebase as extension or separate?
    - How do we share logic between MCP and extension?
    - What's the packaging strategy?
  experiments:
    - Prototype minimal MCP server
    - Test with Cursor
    - Design shared module structure

RQ-027:
  title: "Establish MCP security model"
  priority: P3
  questions:
    - What file access does MCP need?
    - How do we sandbox MCP operations?
    - What's the error handling strategy?
  experiments:
    - Review MCP security best practices
    - Implement request validation
    - Test malicious request handling
```

### Proposed Resolution Path

1. **Research Cursor MCP** - Study documentation and examples
2. **Prototype MCP server** - Minimal working implementation
3. **Test integration** - Validate with Cursor
4. **Document MCP integration** in `docs/cursor-mcp.md`

**Owner**: TBD  
**Timeline**: After extension v0.1 (Week 8+)

---

## 10. Accessibility Implementation 🟠 P1

### Gap: Concrete Accessibility Strategy

**What We Know:**
- WCAG 2.1 AA compliance required
- Contrast ≥ 4.5:1
- Keyboard navigation mandatory

**What We Don't Know:**
1. **Canvas Accessibility**:
   - How do we make canvas accessible to screen readers?
   - ARIA labels for canvas nodes?
   - What's the keyboard navigation model?

2. **Generated Component Accessibility**:
   - How do we ensure generated JSX is accessible?
   - What ARIA attributes do we emit?
   - How do we test generated component a11y?

3. **Design-Time Accessibility**:
   - Can designers preview accessibility?
   - Do we show a11y warnings in the UI?
   - How do we audit designs before codegen?

4. **Contrast Checking**:
   - How do we compute contrast in the engine?
   - Support for gradient backgrounds?
   - What about transparency and layering?

### Research Questions

```yaml
RQ-028:
  title: "Design accessible canvas interaction model"
  priority: P1
  questions:
    - How do screen readers interact with canvas?
    - What's the DOM structure for accessibility tree?
    - How do we announce changes?
  experiments:
    - Test with NVDA, JAWS, VoiceOver
    - Prototype keyboard navigation
    - Study industry-standard accessibility patterns

RQ-029:
  title: "Implement contrast computation engine"
  priority: P1
  questions:
    - What algorithm for contrast calculation?
    - How do we handle overlapping elements?
    - Support for gradients and images?
  experiments:
    - Implement WCAG contrast algorithm
    - Test with real designs
    - Handle edge cases

RQ-030:
  title: "Design accessibility linting for generated code"
  priority: P1
  questions:
    - What rules to check?
    - Integration with eslint-plugin-jsx-a11y?
    - How do we present errors to designers?
  experiments:
    - Analyze common a11y issues in generated code
    - Prototype linting integration
    - Design error UI
```

### Proposed Resolution Path

1. **A11y audit** - Review WCAG requirements for our use case
2. **Prototype accessible canvas** - Test with screen readers
3. **Implement contrast checker** - Build into renderer
4. **Document a11y** in `docs/accessibility.md`

**Owner**: TBD  
**Timeline**: Throughout development (Ongoing)

---

## Summary of Critical Gaps

### 🔴 P0 Blockers (Must Resolve Before Implementation)

1. **Deterministic code generation implementation** (RQ-001, RQ-002, RQ-003)
2. **Merge conflict resolution algorithm** (RQ-004, RQ-005)

### 🟠 P1 Critical (Must Resolve Before Feature Completion)

3. **VS Code extension security model** (RQ-007, RQ-008, RQ-009)
4. **React component discovery** (RQ-010, RQ-011, RQ-012)
5. **Accessibility implementation** (RQ-028, RQ-029, RQ-030)

### 🟡 P2 Important (Resolve During Implementation)

6. **Token reflection system** (RQ-013, RQ-014, RQ-015)
7. **Canvas rendering performance** (RQ-016, RQ-017, RQ-018)
8. **SVG import conversion** (RQ-019, RQ-020, RQ-021)

### 🔵 P3 Nice-to-Have (Can Defer)

9. **Testing infrastructure** (RQ-022, RQ-023, RQ-024)
10. **Cursor MCP integration** (RQ-025, RQ-026, RQ-027)

---

## Recommended Action Plan

### Immediate (Week 1)

1. Create research sprints for P0 items
2. Build proof-of-concepts for deterministic codegen
3. Document merge conflict taxonomy

### Near-term (Week 2-4)

4. Resolve P1 security and component discovery gaps
5. Prototype accessibility features
6. Establish testing infrastructure

### Medium-term (Week 5-8)

7. Implement token system with research findings
8. Optimize renderer performance
9. Build SVG import with defined scope

### Future (Week 8+)

10. Enhance testing with visual regression
11. Implement Cursor MCP integration

---

## Next Steps

1. **Create working specs** for each research question
2. **Assign owners** to research tracks
3. **Schedule prototyping** time before implementation
4. **Document findings** as they emerge

---

**Last Updated**: October 2, 2025  
**Review Frequency**: Weekly during research phase

