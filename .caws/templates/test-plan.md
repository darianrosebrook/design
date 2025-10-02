# Test Plan: [Feature Name]

**Feature**: [DESIGNER-XXX]  
**Author**: @darianrosebrook  
**Date**: [YYYY-MM-DD]

---

## 1. Test Strategy

### Scope

**In Scope:**
- [What will be tested]

**Out of Scope:**
- [What will not be tested]

### Risk Assessment

| Risk | Impact | Test Priority |
|------|--------|---------------|
| [Risk description] | High/Medium/Low | High/Medium/Low |

---

## 2. Unit Tests

### Test Cases

| ID | Description | Input | Expected Output | Status |
|----|-------------|-------|-----------------|--------|
| UT-1 | [Test description] | [Input data] | [Expected result] | [ ] |
| UT-2 | [Test description] | [Input data] | [Expected result] | [ ] |

### Edge Cases

| ID | Description | Scenario | Handling |
|----|-------------|----------|----------|
| EC-1 | [Edge case] | [When this happens] | [Expected behavior] |

---

## 3. Property-Based Tests

### Properties to Verify

```typescript
// Property 1: Determinism
fc.assert(
  fc.property(
    arbitraryInput(),
    (input) => {
      return fn(input) === fn(input);
    }
  )
);

// Property 2: [Property name]
// [Description]
```

---

## 4. Integration Tests

### Test Scenarios

| ID | Description | Setup | Actions | Assertions |
|----|-------------|-------|---------|------------|
| IT-1 | [Scenario] | [Initial state] | [Steps] | [Verify] |

---

## 5. Golden Frame Tests

### Golden Frames

| Frame ID | Description | Input File | Expected Output |
|----------|-------------|------------|-----------------|
| GF-1 | [Description] | `tests/golden/[name].canvas.json` | `[name].expected.tsx` |

---

## 6. Accessibility Tests

### WCAG Criteria

| ID | Criterion | Level | Test Method | Status |
|----|-----------|-------|-------------|--------|
| A11Y-1 | Color contrast ≥ 4.5:1 | AA | Automated | [ ] |
| A11Y-2 | Keyboard navigation | AA | Manual | [ ] |
| A11Y-3 | Screen reader support | AA | Manual | [ ] |

---

## 7. Performance Tests

### Budgets

| Metric | Budget | Test Method |
|--------|--------|-------------|
| Canvas render | <16ms p95 | Profiling |
| Code generation | <500ms p95 | Benchmark |

---

## 8. Security Tests

### Security Checks

| ID | Check | Method | Status |
|----|-------|--------|--------|
| SEC-1 | Webview CSP | Static analysis | [ ] |
| SEC-2 | Filesystem access | Code review | [ ] |
| SEC-3 | Token sanitization | Unit test | [ ] |

---

## 9. Test Environment

### Setup Requirements

- Node.js version: [version]
- VS Code version: [version]
- Test data: `tests/fixtures/`

### Test Execution

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:golden
npm run test:a11y
```

---

## 10. Acceptance Criteria

### Definition of Done

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Property-based tests verify invariants
- [ ] Golden frame tests match expected output
- [ ] Accessibility audit passes
- [ ] Performance budgets met
- [ ] Security checks pass
- [ ] Code coverage meets tier threshold
- [ ] Mutation score meets tier threshold

---

**Last Updated**: [Date]  
**Status**: [Draft|In Progress|Complete]

