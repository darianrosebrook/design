# Research & Decision Documentation

**Status**: Active Research Phase  
**Last Updated**: October 2, 2025

---

## Overview

This directory contains research documentation, experiments, proofs-of-concept, and architectural decision records for the Designer project. Before implementing features, we conduct thorough research to validate approaches and minimize risks.

---

## Quick Navigation

### 📋 Core Documents

- **[GAPS_AND_UNKNOWNS.md](./GAPS_AND_UNKNOWNS.md)** - Comprehensive list of technical gaps and ambiguities that need resolution
- **[RESEARCH_TRACKER.md](./RESEARCH_TRACKER.md)** - Active tracking of research questions, status, and priorities

### 📁 Subdirectories

- **`experiments/`** - Experimental code and benchmarks
- **`../decisions/`** - Architectural Decision Records (ADRs)
- **`../../prototypes/`** - Proof-of-concept implementations

---

## Research Questions by Area

### 🔴 P0 Blockers (Week 1-2)

**Deterministic Code Generation**
- RQ-001: Clock injection pattern
- RQ-002: Canonical string sorting algorithm
- RQ-003: Floating point precision policy

**Merge Strategy**
- RQ-004: Design file conflict taxonomy
- RQ-005: Semantic diff algorithm for nodes

### 🟠 P1 Critical (Week 3-6)

**Security**
- RQ-007: Secure webview message protocol
- RQ-008: Path validation and sandboxing
- RQ-009: Resource limits and quotas

**Component System**
- RQ-010: Component discovery mechanism
- RQ-011: Prop extraction strategy
- RQ-012: Component index format and versioning

**Accessibility**
- RQ-028: Accessible canvas interaction model
- RQ-029: Contrast computation engine
- RQ-030: Generated code accessibility linting

### 🟡 P2 Important (Week 4-6)

**Token System**
- RQ-013: Token transformation algorithm
- RQ-014: Token reference resolution
- RQ-015: Token versioning and migration

**Performance**
- RQ-016: High-performance canvas renderer
- RQ-017: Efficient hit testing
- RQ-018: Document size limits

**SVG Import**
- RQ-019: SVG feature support matrix
- RQ-020: SVG to VectorNode conversion
- RQ-021: Smart token matching

### 🔵 P3 Nice-to-Have (Week 7+)

**Testing**
- RQ-022: Property-based test strategy
- RQ-023: Golden frame workflow
- RQ-024: Visual regression testing tools

**Cursor Integration**
- RQ-025: Cursor MCP protocol specification
- RQ-026: MCP server architecture
- RQ-027: MCP security model

---

## Research Process

### 1. Identify Gap

Document the gap in `GAPS_AND_UNKNOWNS.md` with:
- What we know vs don't know
- Why it matters (risk level)
- Specific research questions

### 2. Plan Research

Add to `RESEARCH_TRACKER.md` with:
- Priority (P0-P3)
- Owner assignment
- Target timeline
- Dependencies

### 3. Experiment

Create experiment in `experiments/` directory:
```bash
docs/research/experiments/
  RQ-001-clock-injection/
    README.md           # Experiment plan
    prototype.ts        # Code
    results.md          # Findings
```

### 4. Build POC

Create proof-of-concept in `prototypes/` directory:
```bash
prototypes/
  deterministic-codegen/
    package.json
    src/
    tests/
    README.md
```

### 5. Document Decision

Record architectural decision in `docs/decisions/`:
```bash
docs/decisions/
  ADR-001-clock-injection.md
  ADR-002-merge-strategy.md
```

### 6. Update Tracker

Mark research question as resolved in `RESEARCH_TRACKER.md` and document decision.

---

## Experiment Template

Use this template for new experiments:

```markdown
# Experiment: [Title]

**Research Question**: RQ-XXX  
**Date**: YYYY-MM-DD  
**Author**: @username

## Hypothesis

[What we think will happen]

## Method

[How we'll test it]

## Success Criteria

[How we'll know if it works]

## Setup

```typescript
// Experimental code
```

## Results

[What actually happened]

## Analysis

[What we learned]

## Recommendation

[What we should do]

## References

- [Related docs or discussions]
```

---

## ADR Template

Use this template for architectural decisions:

```markdown
# ADR-XXX: [Title]

**Date**: YYYY-MM-DD  
**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-YYY  
**Context**: RQ-XXX

## Context

[What's the situation requiring a decision?]

## Decision

[What did we decide?]

## Rationale

[Why this approach?]

## Consequences

**Positive:**
- [Good outcomes]

**Negative:**
- [Trade-offs or limitations]

**Neutral:**
- [Other changes]

## Alternatives Considered

### Option 1: [Name]
- Pros: [...]
- Cons: [...]
- Rejected because: [...]

### Option 2: [Name]
- Pros: [...]
- Cons: [...]
- Rejected because: [...]

## References

- [Links to experiments, discussions, external research]
```

---

## Current Research Status

### Week 1 Focus

**🔴 P0 Blockers - Must Resolve Immediately**

1. **Deterministic Code Generation** (RQ-001, RQ-002, RQ-003)
   - Status: ⚪ Not Started
   - Impact: Blocks all codegen work
   - Plan: Build POC this week

2. **Merge Conflict Resolution** (RQ-004, RQ-005)
   - Status: ⚪ Not Started
   - Impact: Blocks multi-user features
   - Plan: Document conflict taxonomy

### Next Steps

- [ ] Assign owners to P0 research questions
- [ ] Schedule research sprint planning
- [ ] Create experiment plans for RQ-001, RQ-002, RQ-003
- [ ] Begin POC development for deterministic codegen

---

## Research Sprint Schedule

### Sprint 1: Foundation (Week 1-2)
- **Focus**: Deterministic codegen + merge strategy
- **RQs**: RQ-001 through RQ-005
- **Goal**: Resolve all P0 blockers

### Sprint 2: Security & A11y (Week 3-4)
- **Focus**: Extension security + accessibility
- **RQs**: RQ-007 through RQ-009, RQ-028, RQ-029
- **Goal**: Resolve security and accessibility critical items

### Sprint 3: Components & Tokens (Week 5-6)
- **Focus**: Component discovery + token system
- **RQs**: RQ-010 through RQ-015
- **Goal**: Enable component library and design tokens

### Sprint 4: Advanced Features (Week 7-8)
- **Focus**: Performance + SVG import
- **RQs**: RQ-016 through RQ-021
- **Goal**: Optimize and add advanced capabilities

---

## Contributing to Research

### Adding a New Research Question

1. **Document the gap** in `GAPS_AND_UNKNOWNS.md`
2. **Add to tracker** in `RESEARCH_TRACKER.md`
3. **Assign priority** (P0-P3) and owner
4. **Link dependencies** to other research questions

### Running an Experiment

1. **Create experiment directory**: `experiments/RQ-XXX-name/`
2. **Write experiment plan**: Follow template above
3. **Implement and test**: Document as you go
4. **Publish results**: Update `results.md`
5. **Share findings**: Update `RESEARCH_TRACKER.md`

### Recording a Decision

1. **Create ADR**: `docs/decisions/ADR-XXX-title.md`
2. **Link to research**: Reference RQ-XXX
3. **Document rationale**: Why this decision?
4. **Update tracker**: Mark RQ as resolved

---

## Resources

### Internal

- [Working Spec](../../.caws/working-spec.yaml) - Project requirements
- [AGENTS.md](../../AGENTS.md) - Agent workflow guide
- [Goal Document](../../goal.md) - Complete project vision

### External

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Design Tokens Community Group](https://www.w3.org/community/design-tokens/)
- [React Server Components](https://react.dev/reference/rsc/server-components)

---

## Questions or Issues?

- **Research questions**: Add to `GAPS_AND_UNKNOWNS.md`
- **Process feedback**: Update this README
- **Urgent blockers**: Flag in RESEARCH_TRACKER.md with 🔴

---

**Maintainer**: @darianrosebrook  
**Review Frequency**: Weekly during research phase

