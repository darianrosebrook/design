# Designer Project - Agent Workflow Guide

**Author**: @darianrosebrook  
**Version**: 1.0.0  
**Project**: paths.design/designer

---

## Project Context

Designer is a **local-first, repo-native design tool** that lives in VS Code/Cursor, enabling deterministic code generation from visual designs.

### Core Philosophy

1. **Design artifacts live with code** - No external tools, no proprietary formats
2. **Deterministic round-trips** - Same design → identical code, every time
3. **Git-friendly** - Stable IDs, canonical JSON, merge-aware diffs
4. **IDE-native** - VS Code webview and Cursor MCP integration

---

## Risk Tiering for Designer

### Tier 1 - Critical Path

**Components**: canvas-schema, canvas-engine, codegen-react  
**Requirements**: 70% mutation, 90% coverage, contract tests mandatory  
**Why**: Foundation components - bugs break determinism

### Tier 2 - Core Features

**Components**: canvas-renderer-dom, tokens, vscode-ext  
**Requirements**: 50% mutation, 80% coverage, integration tests  
**Why**: Direct user impact and data integrity

### Tier 3 - Quality of Life

**Components**: CLI tools, docs, examples  
**Requirements**: 30% mutation, 70% coverage, smoke tests  
**Why**: Developer experience, recoverable failures

---

## Project-Specific Invariants

1. **Deterministic Generation** - Identical output bytes for identical inputs
2. **Stable Node IDs** - ULIDs assigned once, never regenerate
3. **Canonical Serialization** - Sorted keys, fixed spacing, newline EOF
4. **Token Consistency** - Token refs resolve to CSS variables
5. **Webview Security** - Workspace files only, no arbitrary access

---

## Testing Strategy

### Property-Based Testing

```typescript
fc.assert(
  fc.property(arbitraryCanvasDoc(), (doc) => {
    const output1 = generate(doc);
    const output2 = generate(doc);
    return hash(output1) === hash(output2);
  })
);
```

### Golden Frame Testing

Maintain reference designs with expected output in `tests/golden/`.

---

## Common Failure Modes

**F-01: Non-Deterministic Generation**  
Recovery: Inject clock, sort collections, fixed precision

**F-02: Token Drift**  
Recovery: Emit CSS variables, validate refs, round-trip tests

**F-03: Merge Conflicts**  
Recovery: Canonicalize JSON, semantic merge tool

**F-04: Webview Performance**  
Recovery: Dirty tracking, batch updates, profile hot paths

---

## Agent Conduct Rules

1. **Determinism First** - No Date.now(), Math.random(), unstable ordering
2. **Schema Adherence** - Validate with Zod, never write loose JSON
3. **Token Safety** - Emit CSS variables, never literals
4. **Webview Security** - VS Code API only, never direct fs access
5. **Git-Friendly** - Canonicalize JSON before save
6. **Accessibility** - Semantic HTML, keyboard nav, WCAG compliance
7. **Performance** - 60fps canvas, profile hot paths
8. **Testing** - Property tests, golden frames, contract tests
9. **Rollback Ready** - Feature flags, kill switches
10. **Documentation** - Update schemas, examples, guides

---

## Development Workflow

```bash
# Feature development
cp .caws/templates/feature.yaml .caws/specs/DESIGNER-042.yaml
npm run test:watch
npm run verify
npm run caws:prove

# Code generation
npm run generate design/home.canvas.json src/ui
npm run test:golden
npm run validate:tokens

# Extension development
npm run dev:ext
# F5 to launch, Cmd+R to reload
npm run test:ext
```

---

## Review Checklist

- [ ] Working spec validated
- [ ] Tests pass (`npm run verify`)
- [ ] Determinism verified (identical hashes)
- [ ] Golden frames updated
- [ ] Schema migration guide
- [ ] Token round-trip tested
- [ ] Accessibility audit passed
- [ ] Performance budgets met
- [ ] Webview security validated
- [ ] Documentation updated
- [ ] Changelog entry
- [ ] Provenance generated

---

## Key Resources

**Schemas**: `packages/canvas-schema/schemas/`  
**Documentation**: `docs/overview.md`, `docs/data-model.md`  
**Tools**: `npm run generate`, `npm run watch:tokens`

---

**For full CAWS framework**: See `agents.md` (complete version)
