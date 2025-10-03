# RQ-006: Merge Strategy Research & Implementation

**Author**: @darianrosebrook
**Date**: October 2, 2025
**Status**: Research Phase

## Problem Statement

Designer needs a robust merge strategy to resolve conflicts detected by the conflict detector. The current system can identify conflicts but cannot automatically resolve them. We need to research and implement merge strategies that can handle different types of conflicts safely and predictably.

## Research Goals

1. **Evaluate CRDT approaches** for collaborative design editing
2. **Design custom merge algorithms** for design-specific conflicts
3. **Implement auto-resolution** for safe conflict types
4. **Provide manual resolution** guidance for complex conflicts

---

## 1. CRDT (Conflict-Free Replicated Data Types) Analysis

### CRDT Characteristics
- **Commutative**: Operations can be applied in any order
- **Associative**: Grouping operations doesn't affect result
- **Idempotent**: Applying same operation multiple times is safe
- **Eventual Consistency**: All replicas converge to same state

### CRDT Types for Design Data

#### 1.1 State-based CRDTs (CvRDTs)
- **Last-Write-Wins (LWW)**: Simple timestamp-based resolution
- **Grow-Only Set**: Additions only, no deletions
- **Observed-Remove Set**: Tracks additions/removals with tombstones

#### 1.2 Operation-based CRDTs (CmRDTs)
- **Operational Transformation**: Transforms operations to maintain consistency
- **Commutative Replicated Data Types**: Operations commute naturally

### CRDT Suitability for Designer

#### ✅ Strengths
- **Automatic conflict resolution** without manual intervention
- **Multi-user collaboration** with guaranteed convergence
- **Offline editing** with automatic synchronization
- **Mathematical guarantees** of eventual consistency

#### ❌ Challenges
- **Design-specific semantics**: CRDTs don't understand design intent
- **Complex operations**: Node moves, style changes, layout adjustments
- **Performance overhead**: Metadata tracking for each operation
- **Merge conflicts still possible**: Some conflicts are inherently unresolvable

#### 🎯 Recommendation: Hybrid Approach
Use CRDT principles for safe operations, custom logic for design-specific conflicts.

---

## 2. Custom Merge Strategy Design

### Conflict Resolution Taxonomy

#### 2.1 Auto-Resolvable Conflicts (Safe to merge automatically)

| Conflict Type | Resolution Strategy | Rationale |
|---------------|-------------------|-----------|
| **S-ORDER** | `prefer-local` | Child ordering is subjective, local preference maintains workflow |
| **M-NAME** | `prefer-remote` | Naming conflicts are minor, remote often represents team consensus |
| **P-VISIBILITY** | `prefer-local` | Visibility changes are workflow-specific |
| **P-STYLE** (opacity) | `prefer-local` | Opacity changes are typically intentional |

#### 2.2 Manual Resolution Required (Complex conflicts)

| Conflict Type | Resolution Strategy | Rationale |
|---------------|-------------------|-----------|
| **S-DEL-MOD** | `manual` | Deletion vs modification is destructive |
| **S-ADD-ADD** | `manual` | Duplicate additions need human judgment |
| **S-MOVE-MOVE** | `manual` | Conflicting moves break layout intent |
| **P-GEOMETRY** | `manual` | Position/size changes affect design composition |
| **P-LAYOUT** | `manual` | Layout changes affect responsive behavior |
| **P-STYLE** (colors/fills) | `manual` | Visual changes need design review |
| **C-TEXT** | `manual` | Content changes need human approval |
| **C-COMPONENT-PROPS** | `manual` | Component behavior changes need validation |

### Resolution Strategy Patterns

#### 2.2.1 Prefer Strategies
```typescript
enum ResolutionStrategy {
  PREFER_LOCAL = 'prefer-local',
  PREFER_REMOTE = 'prefer-remote',
  PREFER_BASE = 'prefer-base',
  MANUAL = 'manual',
  AVERAGE = 'average', // For numeric values
  MERGE = 'merge',    // For additive changes
}
```

#### 2.2.2 Conflict Resolution Engine

```typescript
interface MergeResolution {
  strategy: ResolutionStrategy;
  resolvedValue: unknown;
  confidence: number; // 0-1, how confident we are in this resolution
  requiresReview: boolean;
  explanation: string;
}

class ConflictResolver {
  resolve(conflict: Conflict, context: MergeContext): MergeResolution {
    switch (conflict.type) {
      case 'structural':
        return this.resolveStructural(conflict, context);
      case 'property':
        return this.resolveProperty(conflict, context);
      case 'content':
        return this.resolveContent(conflict, context);
      case 'metadata':
        return this.resolveMetadata(conflict, context);
    }
  }
}
```

---

## 3. Implementation Plan

### Phase 1: Auto-Resolution Framework (Current)

#### 3.1 Core Resolution Engine
```typescript
// packages/canvas-engine/src/merge/resolution-engine.ts
export class MergeResolutionEngine {
  async resolveConflicts(
    conflicts: Conflict[],
    context: MergeContext
  ): Promise<MergeResult> {
    const resolutions: MergeResolution[] = [];

    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict, context);
      resolutions.push(resolution);

      if (resolution.requiresReview) {
        // Mark for manual resolution
        this.markForManualReview(conflict, resolution);
      }
    }

    return {
      resolvedDocument: this.applyResolutions(context.target, resolutions),
      unresolvedConflicts: resolutions.filter(r => r.requiresReview),
      confidence: this.calculateOverallConfidence(resolutions),
    };
  }
}
```

#### 3.2 Strategy Implementations

```typescript
// Auto-resolvable strategies
export class PreferLocalResolver implements ConflictResolver {
  resolve(conflict: Conflict): MergeResolution {
    return {
      strategy: 'prefer-local',
      resolvedValue: conflict.localValue,
      confidence: 0.7,
      requiresReview: false,
      explanation: 'Using local changes as they represent current workflow',
    };
  }
}

export class PreferRemoteResolver implements ConflictResolver {
  resolve(conflict: Conflict): MergeResolution {
    return {
      strategy: 'prefer-remote',
      resolvedValue: conflict.remoteValue,
      confidence: 0.8,
      requiresReview: false,
      explanation: 'Using remote changes as they may represent team consensus',
    };
  }
}

// Manual resolution required
export class ManualResolver implements ConflictResolver {
  resolve(conflict: Conflict): MergeResolution {
    return {
      strategy: 'manual',
      resolvedValue: conflict.baseValue, // Keep base as fallback
      confidence: 0.0,
      requiresReview: true,
      explanation: 'This conflict requires human judgment to resolve',
    };
  }
}
```

### Phase 2: Advanced Resolution Strategies

#### 3.3 Numeric Averaging (for compatible changes)
```typescript
export class NumericAverageResolver implements ConflictResolver {
  resolve(conflict: Conflict): MergeResolution {
    const localVal = conflict.localValue as number;
    const remoteVal = conflict.remoteValue as number;

    if (typeof localVal === 'number' && typeof remoteVal === 'number') {
      const average = (localVal + remoteVal) / 2;
      return {
        strategy: 'average',
        resolvedValue: average,
        confidence: 0.6,
        requiresReview: false,
        explanation: 'Averaged numeric values to compromise between changes',
      };
    }

    return new ManualResolver().resolve(conflict);
  }
}
```

#### 3.4 Property Merging (for additive changes)
```typescript
export class PropertyMergeResolver implements ConflictResolver {
  resolve(conflict: Conflict): MergeResolution {
    // For properties like styles, merge compatible changes
    const localProps = conflict.localValue as Record<string, any>;
    const remoteProps = conflict.remoteValue as Record<string, any>;

    const merged = { ...localProps };
    for (const [key, value] of Object.entries(remoteProps)) {
      if (!(key in localProps)) {
        merged[key] = value; // Add new properties
      }
      // Conflicting properties require manual resolution
    }

    return {
      strategy: 'merge',
      resolvedValue: merged,
      confidence: 0.5,
      requiresReview: Object.keys(localProps).some(key => key in remoteProps),
      explanation: 'Merged compatible properties, conflicts need review',
    };
  }
}
```

### Phase 3: Intelligent Resolution (Future)

#### 3.5 Context-Aware Resolution
- **Design Pattern Recognition**: Detect common design patterns
- **Semantic Understanding**: Understand design intent from context
- **User Preference Learning**: Learn from past resolution choices
- **Collaboration Context**: Consider user roles and expertise

---

## 4. Integration with Existing Systems

### 4.1 Merge Workflow Enhancement

```typescript
// Enhanced merge process
async function performMerge(
  base: CanvasDocument,
  local: CanvasDocument,
  remote: CanvasDocument
): Promise<MergeResult> {
  // 1. Detect conflicts (existing)
  const conflicts = detectConflicts({ base, local, remote });

  // 2. Attempt auto-resolution (new)
  const resolver = new MergeResolutionEngine();
  const resolution = await resolver.resolveConflicts(conflicts, { base, local, remote });

  // 3. Return results
  if (resolution.unresolvedConflicts.length === 0) {
    return { success: true, document: resolution.resolvedDocument };
  } else {
    return {
      success: false,
      document: resolution.resolvedDocument,
      conflicts: resolution.unresolvedConflicts,
      needsManualReview: true,
    };
  }
}
```

### 4.2 API Extensions

```typescript
// New merge API with resolution
interface MergeOptions {
  autoResolve?: boolean;
  resolutionStrategies?: Record<string, ResolutionStrategy>;
  onConflict?: (conflict: Conflict) => ResolutionStrategy;
}

interface MergeResult {
  success: boolean;
  document: CanvasDocument;
  conflicts?: Conflict[];
  resolutions?: MergeResolution[];
  needsManualReview?: boolean;
  confidence?: number;
}
```

---

## 5. Testing Strategy

### 5.1 Resolution Test Categories

#### 5.1.1 Auto-Resolution Tests
```typescript
describe('Auto-Resolution', () => {
  it('resolves S-ORDER conflicts with prefer-local strategy', async () => {
    const conflicts = [createOrderConflict()];
    const result = await resolver.resolveConflicts(conflicts, context);

    expect(result.unresolvedConflicts).toHaveLength(0);
    expect(result.confidence).toBeGreaterThan(0.5);
  });
});
```

#### 5.1.2 Manual Resolution Tests
```typescript
describe('Manual Resolution', () => {
  it('marks destructive conflicts for manual review', async () => {
    const conflicts = [createDeleteModifyConflict()];
    const result = await resolver.resolveConflicts(conflicts, context);

    expect(result.needsManualReview).toBe(true);
    expect(result.unresolvedConflicts).toHaveLength(1);
  });
});
```

#### 5.1.3 Confidence Scoring Tests
```typescript
describe('Confidence Scoring', () => {
  it('assigns high confidence to safe resolutions', async () => {
    // Test that safe auto-resolutions get high confidence scores
  });

  it('assigns low confidence to risky resolutions', async () => {
    // Test that complex resolutions get appropriate confidence scores
  });
});
```

---

## 6. Success Metrics

### 6.1 Quantitative Metrics
- **Auto-resolution Rate**: % of conflicts resolved without human intervention
- **Resolution Confidence**: Average confidence score for auto-resolutions
- **Manual Review Time**: Time spent on manual conflict resolution
- **Merge Success Rate**: % of merges completed successfully

### 6.2 Qualitative Metrics
- **User Satisfaction**: Developer experience with merge conflicts
- **Design Integrity**: How well auto-resolution preserves design intent
- **Team Productivity**: Impact on collaborative workflows

---

## 7. Implementation Timeline

### Phase 1 (Current): Basic Auto-Resolution ✅
- [x] Research merge strategies
- [x] Design resolution taxonomy
- [x] Implement prefer-local/remote strategies
- [ ] Add resolution engine framework
- [ ] Integrate with existing merge pipeline

### Phase 2 (Next): Advanced Strategies
- [ ] Implement numeric averaging
- [ ] Add property merging
- [ ] Create conflict-specific resolvers
- [ ] Add confidence scoring

### Phase 3 (Future): Intelligent Resolution
- [ ] Context-aware resolution
- [ ] User preference learning
- [ ] Design pattern recognition

---

## 8. References

- [CRDTs: Consistency without concurrency control](https://hal.inria.fr/inria-00609399/document)
- [Operational Transformation](https://operational-transformation.github.io/)
- [Git merge strategies](https://git-scm.com/docs/merge-strategies)
- [Conflict-Free Replicated Data Types](https://crdt.tech/)
