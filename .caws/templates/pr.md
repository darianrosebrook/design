# [DESIGNER-XXX] Feature Title

## Summary

<!-- Brief description of what this PR accomplishes -->

## Working Spec

- **Risk Tier**: [1|2|3]
- **Mode**: [feature|refactor|fix|doc|chore]
- **Spec**: [Link to .caws/specs/DESIGNER-XXX.yaml]

## Invariants

<!-- List the key invariants this PR maintains -->

- [ ] Deterministic code generation (identical hashes across runs)
- [ ] Stable node IDs (ULIDs never regenerate)
- [ ] Token consistency (design → CSS variables)
- [ ] Canonical JSON format (sorted keys, fixed spacing)
- [ ] Webview security (workspace files only)

## Tests

### Coverage

- **Unit**: X% (target: ≥70% Tier 3, ≥80% Tier 2, ≥90% Tier 1)
- **Mutation**: X% (target: ≥30% Tier 3, ≥50% Tier 2, ≥70% Tier 1)
- **Integration**: X test flows
- **E2E/Golden**: X golden frame tests

### Test Results

```bash
# Run verification locally
npm run verify

# Results:
✓ Schema validation passed
✓ Determinism check passed (SHA-256 hashes match)
✓ Golden frame tests: X/X passed
✓ Mutation score: XX% (target: XX%)
✓ Branch coverage: XX% (target: XX%)
✓ A11y audit: X issues (0 critical, X warnings)
```

## Non-Functional Requirements

### Accessibility

- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation functional
- [ ] Screen reader support tested
- [ ] Color contrast ≥ 4.5:1
- [ ] Reduced motion support

**Audit Results**: [Pass|Warnings|Failures]

### Performance

- **Canvas Rendering**: Xms (budget: <16ms p95)
- **Code Generation**: Xms (budget: <500ms p95)
- **Token Reflection**: Xms (budget: <16ms p95)
- **Extension Load**: Xms (budget: <1000ms p95)

**Budgets**: [Met|Near Limit|Exceeded]

### Security

- [ ] Webview CSP validated
- [ ] No arbitrary filesystem access
- [ ] No eval() or Function() usage
- [ ] Token values sanitized
- [ ] vsce security scan passed

**Security Status**: [Clean|Warnings|Blocked]

## Migration & Rollback

### Schema Changes

<!-- If this PR changes canvas.json or tokens.json schema -->

- **Schema Version**: [0.1.0 → 0.2.0]
- **Breaking Changes**: [Yes|No]
- **Migration Guide**: [Link to docs/migrations/v0.2.md]

### Rollback Strategy

<!-- How to safely rollback if this PR causes issues -->

1. [Step-by-step rollback instructions]
2. Feature flags: [List any feature flags that can disable this]
3. Backward compatibility: [Explain if old designs still work]

## Observability

### Logs Added

- `canvas.{action}.{status}` with [relevant metadata]
- `codegen.{action}.{status}` with [relevant metadata]

### Metrics Added

- `{metric_name}` - [description]

### Traces Added

- `{trace_name}` - [description]

## Changes Summary

### Files Changed

<!-- Automatically populated by git -->

### Key Changes

1. **[Package/Module]**: [What changed and why]
2. **[Package/Module]**: [What changed and why]

## Known Limitations

<!-- Be transparent about what this PR does NOT address -->

- [Limitation 1]
- [Limitation 2]

## Rationale

<!-- 10-line explanation of design decisions -->

[Explain key architectural decisions, trade-offs made, and why this approach was chosen over alternatives]

## Testing Evidence

### Golden Frame Comparison

<!-- Include before/after screenshots or diffs for visual changes -->

### Determinism Verification

```bash
# Run 1
$ npm run generate design/home.canvas.json out1/
SHA-256: abc123...

# Run 2
$ npm run generate design/home.canvas.json out2/
SHA-256: abc123...

✓ Hashes match - determinism verified
```

### Performance Profile

<!-- Include performance measurements if relevant -->

## Checklist

### Pre-Submission

- [ ] Working spec YAML is complete
- [ ] All tests pass locally (`npm run verify`)
- [ ] Determinism verified (identical hashes)
- [ ] Golden frame tests updated
- [ ] Schema migration guide (if applicable)
- [ ] Token resolution tested
- [ ] Accessibility audit passed
- [ ] Performance budgets met
- [ ] Webview security validated
- [ ] Documentation updated
- [ ] Changelog entry added
- [ ] Provenance manifest generated

### Review Criteria

- [ ] Code follows project conventions
- [ ] No duplicate/shadow filenames
- [ ] SOLID principles applied
- [ ] Error handling is comprehensive
- [ ] Logging is appropriate
- [ ] No hardcoded secrets or tokens

## Provenance

**Agent**: [Agent name/version]  
**Model**: [Model name]  
**Commit**: [Commit SHA]  
**Trust Score**: [XX/100]  
**Manifest**: [Link to .agent/provenance.json]

---

**cc**: @darianrosebrook

