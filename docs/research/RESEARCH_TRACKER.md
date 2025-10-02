# Research Question Tracker

**Project**: Designer  
**Last Updated**: October 2, 2025

---

## Active Research Questions

### Legend

**Status:**
- 🔴 Blocked - Cannot proceed
- 🟡 In Progress - Research ongoing
- 🟢 Resolved - Decision made, documented
- ⚪ Not Started - Queued for research

**Priority:**
- P0 (Blocking) - Must resolve before any implementation
- P1 (Critical) - Must resolve before feature completion
- P2 (Important) - Should resolve during implementation
- P3 (Nice-to-have) - Can defer to future iterations

---

## Priority Matrix

| ID | Title | Priority | Status | Owner | Target Week | Dependencies | Risk |
|----|-------|----------|--------|-------|-------------|--------------|------|
| RQ-001 | Clock injection pattern | P0 | 🟢 Resolved | @darianrosebrook | Week 1 | - | High |
| RQ-002 | Canonical string sorting | P0 | 🟢 Resolved | @darianrosebrook | Week 1 | - | High |
| RQ-003 | Floating point precision policy | P0 | 🟢 Resolved | @darianrosebrook | Week 1 | - | Medium |
| RQ-004 | Design file conflict taxonomy | P0 | ⚪ Not Started | - | Week 2 | - | High |
| RQ-005 | Semantic diff algorithm | P0 | ⚪ Not Started | - | Week 2 | RQ-004 | High |
| RQ-006 | CRDT vs custom merge | P1 | ⚪ Not Started | - | Week 3 | RQ-004, RQ-005 | Medium |
| RQ-007 | Secure message protocol | P1 | ⚪ Not Started | - | Week 3 | - | High |
| RQ-008 | Path validation | P1 | ⚪ Not Started | - | Week 3 | RQ-007 | High |
| RQ-009 | Resource limits | P1 | ⚪ Not Started | - | Week 3 | - | Medium |
| RQ-010 | Component discovery | P1 | ⚪ Not Started | - | Week 5 | - | Medium |
| RQ-011 | Prop extraction | P1 | ⚪ Not Started | - | Week 5 | RQ-010 | Medium |
| RQ-012 | Component index format | P1 | ⚪ Not Started | - | Week 5 | RQ-010, RQ-011 | Low |
| RQ-013 | Token transformation | P2 | ⚪ Not Started | - | Week 4 | - | Low |
| RQ-014 | Token reference resolution | P2 | ⚪ Not Started | - | Week 4 | RQ-013 | Medium |
| RQ-015 | Token versioning | P2 | ⚪ Not Started | - | Week 4 | RQ-013, RQ-014 | Low |
| RQ-016 | Canvas renderer design | P2 | ⚪ Not Started | - | Week 3 | - | Medium |
| RQ-017 | Hit testing | P2 | ⚪ Not Started | - | Week 3 | RQ-016 | Low |
| RQ-018 | Document size limits | P2 | ⚪ Not Started | - | Week 4 | RQ-016 | Low |
| RQ-019 | SVG feature support | P2 | ⚪ Not Started | - | Week 6 | - | Low |
| RQ-020 | SVG conversion | P2 | ⚪ Not Started | - | Week 6 | RQ-019 | Medium |
| RQ-021 | Token matching | P2 | ⚪ Not Started | - | Week 6 | RQ-019, RQ-020 | Low |
| RQ-022 | Property test strategy | P3 | ⚪ Not Started | - | Week 2 | - | Low |
| RQ-023 | Golden frame workflow | P3 | ⚪ Not Started | - | Week 2 | - | Low |
| RQ-024 | Visual regression tools | P3 | ⚪ Not Started | - | Week 7 | - | Low |
| RQ-025 | Cursor MCP protocol | P3 | ⚪ Not Started | - | Week 8 | - | Low |
| RQ-026 | MCP server architecture | P3 | ⚪ Not Started | - | Week 8 | RQ-025 | Low |
| RQ-027 | MCP security | P3 | ⚪ Not Started | - | Week 8 | RQ-025, RQ-026 | Medium |
| RQ-028 | Accessible canvas | P1 | ⚪ Not Started | - | Week 2 | - | High |
| RQ-029 | Contrast computation | P1 | ⚪ Not Started | - | Week 3 | RQ-028 | Medium |
| RQ-030 | Generated code a11y | P1 | ⚪ Not Started | - | Week 4 | RQ-028 | Medium |

---

## Research Sprints

### Sprint 1: Foundation (Week 1-2)

**Goal**: Resolve P0 blockers for deterministic codegen and merge strategy

**Research Questions:**
- RQ-001: Clock injection pattern
- RQ-002: Canonical string sorting
- RQ-003: Floating point precision
- RQ-004: Conflict taxonomy
- RQ-005: Semantic diff algorithm

**Deliverables:**
- [x] Deterministic codegen POC - ✅ `packages/codegen-react/src/determinism.ts`
- [ ] Merge conflict detector prototype - ⏳ In Progress
- [ ] Documentation: `docs/determinism.md` - ⏳ Pending
- [ ] Documentation: `docs/merge-strategy.md` - ⏳ Pending

**Exit Criteria:**
- [x] Can generate code with verified determinism - ✅ Implemented with tests
- [ ] Can detect and categorize merge conflicts - ⏳ Not Started
- [x] Team agrees on approaches - ✅ RQ-001, RQ-002, RQ-003 resolved

---

### Sprint 2: Security & Accessibility (Week 3-4)

**Goal**: Resolve P1 security and accessibility requirements

**Research Questions:**
- RQ-007: Secure message protocol
- RQ-008: Path validation
- RQ-009: Resource limits
- RQ-028: Accessible canvas
- RQ-029: Contrast computation

**Deliverables:**
- [ ] Extension security model documented
- [ ] Webview message protocol with Zod schemas
- [ ] Accessible canvas prototype
- [ ] Documentation: `docs/security.md`
- [ ] Documentation: `docs/accessibility.md`

**Exit Criteria:**
- Security audit passes
- Accessibility tested with screen readers
- Team agrees on security boundaries

---

### Sprint 3: Components & Tokens (Week 5-6)

**Goal**: Resolve component discovery and token system details

**Research Questions:**
- RQ-010: Component discovery
- RQ-011: Prop extraction
- RQ-012: Component index format
- RQ-013: Token transformation
- RQ-014: Token reference resolution
- RQ-015: Token versioning

**Deliverables:**
- [ ] Component discovery POC
- [ ] Token reflection system
- [ ] Documentation: `docs/component-discovery.md`
- [ ] Documentation: `docs/tokens-detailed.md`

**Exit Criteria:**
- Can discover and index real components
- Token system handles all design token types
- Team agrees on formats

---

### Sprint 4: Advanced Features (Week 7-8)

**Goal**: Resolve remaining P2 and P3 items

**Research Questions:**
- RQ-016: Canvas renderer design
- RQ-017: Hit testing
- RQ-019: SVG support
- RQ-020: SVG conversion

**Deliverables:**
- [ ] Renderer performance benchmarks
- [ ] SVG import POC
- [ ] Documentation: `docs/performance.md`
- [ ] Documentation: `docs/svg-import.md`

**Exit Criteria:**
- Renderer meets 60fps target
- SVG import handles common cases
- Team agrees on feature scope

---

## Decision Log

### Format

```markdown
## RQ-XXX: [Title]

**Date**: [YYYY-MM-DD]  
**Status**: Resolved  
**Decision**: [What was decided]  
**Rationale**: [Why this approach]  
**Alternatives Considered**: [What else was evaluated]  
**References**: [Links to prototypes, research, discussions]
```

---

## Resolved Research Questions

### RQ-001: Clock Injection Pattern

**Date**: 2025-10-02  
**Status**: 🟢 Resolved  
**Owner**: @darianrosebrook  
**Decision**: Use dependency injection with optional Clock parameter

**Implementation**:
```typescript
interface Clock {
  now(): number;
  uuid(): string;
  random?(): number;
}

function generateReactComponent(
  doc: CanvasDocument,
  options: CodeGenOptions = {}
): GeneratedFile {
  const clock = options.clock ?? defaultClock;
  // Use clock.now() for timestamps
  // Use clock.uuid() for IDs
}
```

**Rationale**: 
- Minimal API surface - clean and simple
- Easy to test with fixed clock
- No performance overhead in production
- Flexible for different time/ID sources

**Alternatives Considered**:
1. Context/ambient injection - Too magical, harder to test
2. Global clock singleton - Tightly couples code
3. Timestamp as parameter - Not flexible for UUIDs

**Implementation**: `packages/codegen-react/src/determinism.ts:14-38`  
**Tests**: `packages/codegen-react/tests/determinism.test.ts`  
**Experiment**: `docs/research/experiments/RQ-001-clock-injection/`

---

### RQ-002: Canonical String Sorting

**Date**: 2025-10-02  
**Status**: 🟢 Resolved  
**Owner**: @darianrosebrook  
**Decision**: Use Intl.Collator with en-US locale and numeric sorting

**Implementation**:
```typescript
class CanonicalSorter {
  private collator: Intl.Collator;

  constructor(locale: string = "en-US") {
    this.collator = new Intl.Collator(locale, {
      numeric: true,
      sensitivity: "base",
      ignorePunctuation: false,
    });
  }

  sort(items: string[]): string[] {
    return [...items].sort(this.collator.compare);
  }
}
```

**Rationale**:
- Handles Unicode correctly (accents, diacritics)
- Consistent across platforms (macOS, Linux, Windows)
- Numeric sorting (item1, item2, item10)
- Standard JavaScript API

**Alternatives Considered**:
1. Simple string comparison - Platform differences, Unicode issues
2. Custom Unicode sorter - Complex, maintenance burden
3. Decimal.js - Overkill for string sorting

**Implementation**: `packages/codegen-react/src/determinism.ts:42-79`  
**Tests**: `packages/codegen-react/tests/determinism.test.ts`  
**Experiment**: `docs/research/experiments/RQ-002-string-sorting/`

---

### RQ-003: Floating Point Precision Policy

**Date**: 2025-10-02  
**Status**: 🟢 Resolved  
**Owner**: @darianrosebrook  
**Decision**: Fixed precision with toFixed(2) for coordinates, Math.round() for dimensions

**Implementation**:
```typescript
class PrecisionNormalizer {
  private coordinatePrecision: number = 2;
  private dimensionPrecision: number = 0;

  normalizeCoordinate(value: number): string {
    return value.toFixed(this.coordinatePrecision);
  }

  normalizeDimension(value: number): number {
    return Math.round(value);
  }
}
```

**Rationale**:
- Simple and predictable - 2 decimal places for design coordinates
- Performance friendly - minimal overhead
- Design appropriate - 0.01px sufficient precision
- Cross-platform consistent - toFixed() well-defined in ES spec

**Alternatives Considered**:
1. Arbitrary precision with Decimal.js - Overkill, performance overhead
2. Full float preservation - Not deterministic across platforms
3. Integer-only coordinates - Too restrictive for design work

**Implementation**: `packages/codegen-react/src/determinism.ts:82-120`  
**Tests**: `packages/codegen-react/tests/determinism.test.ts`  
**Experiment**: `docs/research/experiments/RQ-003-float-precision/`

---

## Example Entry Template

---

## Research Templates

### Experiment Template

```markdown
## Experiment: [Title]

**Research Question**: RQ-XXX  
**Hypothesis**: [What we think will happen]  
**Method**: [How we'll test it]  
**Success Criteria**: [How we'll know if it works]

### Setup

[Code, configuration, or environment details]

### Results

[What actually happened]

### Analysis

[What we learned]

### Recommendation

[What we should do]
```

### POC Template

```markdown
## Proof of Concept: [Feature]

**Goal**: [What we're trying to prove]  
**Scope**: [What's included/excluded]  
**Duration**: [Time spent]

### Implementation

[Key code or architecture]

### Evaluation

**Pros:**
- [What worked well]

**Cons:**
- [What didn't work]

**Learnings:**
- [What we discovered]

### Next Steps

[What to do with these findings]
```

---

## Weekly Review Checklist

- [ ] Update research question statuses
- [ ] Document any decisions made
- [ ] Update risk assessments
- [ ] Adjust priorities based on learnings
- [ ] Communicate blockers to team
- [ ] Plan next week's experiments

---

## Resources

- **Research Documents**: `docs/research/GAPS_AND_UNKNOWNS.md`
- **POC Directory**: `prototypes/`
- **Experiment Results**: `docs/research/experiments/`
- **Decision Records**: `docs/decisions/`

---

**Maintainer**: @darianrosebrook  
**Review Frequency**: Weekly

