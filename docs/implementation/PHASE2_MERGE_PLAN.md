# Phase 2 Implementation Plan — Merge Conflict Detection & Semantic Diff

**Author**: @darianrosebrook  
**Date**: October 2, 2025  
**Status**: Planning  
**Scope**: RQ-004 (Conflict Taxonomy), RQ-005 (Semantic Diff Algorithm)

---

## Objectives

1. **Define comprehensive conflict taxonomy** for Designer canvas documents that covers structural, property, and content conflicts (RQ-004).
2. **Design and implement deterministic conflict detection algorithm** that analyzes three versions (base, local, remote) of a document (RQ-004).
3. **Build semantic diff engine** that produces high-level change operations (add, remove, modify, move) with stable IDs and canonical ordering (RQ-005).
4. **Deliver 20 conflict scenarios** with automated tests covering critical merge cases (Tier 1 requirement).
5. **Provide human-readable artifacts** (JSON + textual summaries) to drive future merge UI and PR comments.

---

## Conflict Taxonomy (RQ-004)

| Category | Code | Description | Auto-Resolvable | Example Scenario |
|----------|------|-------------|------------------|------------------|
| Structural | S-DEL-MOD | Node deleted in one branch, modified in the other | ❌ | Local deletes node, remote changes text |
| Structural | S-MOVE-MOVE | Node moved to different parents in both branches | ⚠️ | Node dragged into different frames |
| Structural | S-ORDER | Children reordered differently | ✅ (stable sort) | Two branches reorder same siblings |
| Structural | S-ADD-ADD | Different nodes inserted at same position | ✅ (list merge) | Simultaneous insert at index 2 |
| Structural | S-ULID-COLLISION | Duplicate ULID introduced | ❌ | Manual edit duplicates ID |
| Property | P-GEOMETRY | Frame properties diverge (x, y, width, height) | ⚠️ | Both branches reposition node |
| Property | P-VISIBILITY | Visibility toggled differently | ✅ (bool resolution) | Local hides, remote shows |
| Property | P-STYLE | Style attributes conflict (fills, strokes, opacity) | ⚠️ | Different fills applied |
| Property | P-LAYOUT | Layout metadata conflicts (auto-layout) | ⚠️ | Different flex settings |
| Property | P-BINDING | Data bindings diverge | ❌ | Different data sources |
| Content | C-TEXT | Text content differs | ⚠️ | Both edit text |
| Content | C-TOKENS | Token reference vs literal edit | ⚠️ | Token vs hard-coded color |
| Content | C-COMPONENT-PROPS | Component props conflict | ⚠️ | Prop value vs structure change |
| Content | C-CHILDREN | Child list edits conflict (add/remove vs modify) | ⚠️ | One deletes child, other edits |
| Metadata | M-NAME | Node renaming conflict | ✅ (prefer remote/local rule) | Both rename frame |
| Metadata | M-TAGS | Tag/annotation divergence | ✅ (merge sets) | Comments added |

**Auto-Resolution Strategy Legend**
- ✅: Resolved automatically without user input
- ⚠️: Requires policy (merge heuristics, average geometry, prefer latest)
- ❌: Requires manual resolution (record in `meta.conflicts`)

---

## Conflict Scenario Matrix (20 Cases)

1. S-DEL-MOD: Node deleted locally, modified remotely
2. S-MOVE-MOVE: Node moved to Frame A locally, Frame B remotely
3. S-ORDER: Children reordered differently (list shuffle)
4. S-ADD-ADD: Concurrent insertions at same index
5. S-ULID-COLLISION: Same ULID introduced in both branches
6. P-GEOMETRY: Frame geometry changed differently
7. P-VISIBILITY: Visibility toggled true vs false
8. P-STYLE: Fill color set to different values
9. P-LAYOUT: Auto-layout gap changed vs fixed
10. P-BINDING: Binding path changed vs removed
11. C-TEXT: Text content divergence
12. C-TOKENS: Token reference replaced with literal vs token renamed
13. C-COMPONENT-PROPS: Component prop value vs structural change
14. C-CHILDREN: Child removed vs modified
15. C-CHILDREN: Child added in both branches at different positions
16. Metadata: Node renamed differently
17. Metadata: Tags added vs removed
18. Mixed: Parent deleted, child modified
19. Mixed: Component instance deleted vs prop edit
20. Mixed: Frame geometry change vs child move (cascade)

Each scenario will have:
- Base document fixture (`tests/fixtures/merge/base-XX.json`)
- Local + remote variants (`local-XX.json`, `remote-XX.json`)
- Expected conflict output (`expected-conflicts-XX.json`)

---

## Conflict Detection Algorithm (RQ-004)

### Inputs
- `baseDoc: CanvasDocumentType`
- `localDoc: CanvasDocumentType`
- `remoteDoc: CanvasDocumentType`

### Outputs
- `conflicts: Conflict[]` with structure:
```ts
interface Conflict {
  id: string; // ULID of affected node
  type: "structural" | "property" | "content" | "metadata";
  code: string; // e.g., S-DEL-MOD
  path: string[]; // location within document
  severity: "error" | "warning" | "info";
  autoResolvable: boolean;
  resolutionStrategy?: "prefer-local" | "prefer-remote" | "average" | "manual";
  baseValue?: unknown;
  localValue?: unknown;
  remoteValue?: unknown;
}
```

### Steps
1. **Normalize documents** to canonical order (reuse existing canonical utilities).
2. **Index nodes by ULID** across all three documents for O(1) access.
3. **Detect structural differences**:
   - Presence/absence of nodes (deletion vs addition)
   - Parent-child relationships (moves)
   - Order differences (child index comparisons)
4. **Detect property differences**:
   - Compare frames, styles, layout, bindings (deep diff)
   - Identify conflicting modifications (both diverge from base)
5. **Detect content differences**:
   - Text nodes, component props, token references
6. **Categorize conflicts** using taxonomy codes
7. **Assign severity & auto-resolve flag** based on rules
8. **Generate conflict artifacts** for downstream tools
9. **Ensure determinism** (stable ordering of conflicts)

### Data Structures
- `Map<string, NodeSnapshot>` where snapshot includes parent ID, index, path
- `ConflictBuilder` utility to accumulate conflicts with sorted ordering
- `PathResolver` to produce human-readable paths (e.g., `artboards[0].children[2]`)

---

## Semantic Diff Design (RQ-005)

### Goal
Produce deterministic list of change operations from base → target document to power PR comments, diff visualizations, and merge previews.

### Diff Operation Structure
```ts
interface DiffOperation {
  type: "add" | "remove" | "modify" | "move";
  nodeId: string;
  path: string[];
  field?: string; // for property diffs
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: {
    index?: number;
    parentId?: string;
    description?: string;
  };
}
```

### Diff Strategy
1. **Node Graph Comparison**: Build indexes for base vs target
2. **Set Operations**:
   - Added nodes: present in target, missing in base
   - Removed nodes: present in base, missing in target
   - Modified nodes: present in both, compare properties
   - Moved nodes: parent or index changed
3. **Property Diffing**: Field-by-field comparison with canonical ordering
4. **Content Diffing**: Text, tokens, component props, data bindings
5. **Ordering**: Deterministic sort by path + nodeId + field
6. **Aggregation**: Merge related operations for readability (e.g., geometry updates)

### Outputs
- `DiffOperation[]` for local vs base
- `DiffOperation[]` for remote vs base
- Future: visual diff HTML (Phase 3)

---

## Testing Strategy (Tier 1 Requirements)

### Conflict Detector Tests (new `conflict-detector.test.ts`)
- 20 scenario-driven tests (one per matrix entry)
- Additional unit tests for helper utilities
- Property-based tests (optional stretch goal) for random node graphs

### Semantic Diff Tests (`semantic-diff.test.ts`)
- Round-trip diff application (apply diff to base → target)
- Edge cases: nested moves, multiple property changes
- Determinism checks (same inputs → identical output)

### Performance Tests
- Reuse `performance.test.ts` harness for conflict detection on large docs (1000 nodes)
- Ensure execution < 200ms on baseline MacBook Air M1

---

## Implementation Roadmap

### Week 1 (Current)
- [ ] Finalize conflict taxonomy (this document)
- [ ] Scaffold conflict detector module
- [ ] Set up fixtures for 20 scenarios
- [ ] Implement structural conflict detection (S-* codes)

### Week 2
- [ ] Implement property/content conflict detection (P-*, C-*, M-*)
- [ ] Complete conflict scenario tests (20 cases)
- [ ] Generate conflict artifacts (JSON + textual)

### Week 3
- [ ] Implement semantic diff engine
- [ ] Develop diff tests (round-trip, determinism)
- [ ] Integration tests combining conflict detection + diff
- [ ] Update documentation (`docs/merge-strategy.md`)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex nested conflicts | High | Path-based detection with recursion + path tracking |
| Performance degradation | Medium | Index maps, early exits, amortized O(n) |
| Non-determinism in ordering | High | Canonical sort keys, stable data structures |
| Test fixture maintenance | Medium | Generate fixtures programmatically via helper utilities |
| Future CRDT integration | Low | Design conflict outputs to be CRDT-agnostic |

---

## Success Criteria

- [ ] All 20 conflict scenarios detected and categorized correctly
- [ ] Conflict outputs deterministic and reproducible
- [ ] Diff engine produces stable, readable operations
- [ ] Tests cover structural, property, content conflicts with 80%+ coverage
- [ ] Documentation updated for merge strategy and conflict taxonomy
- [ ] Ready for Phase 2.2: Merge resolution strategies / UI integration

---

**Ready to Implement**: After reviews and stakeholder sign-off, proceed with coding tasks as outlined above.

