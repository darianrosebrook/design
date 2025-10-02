# Priority Implementation Plan - Low Completion Areas

**Author**: @darianrosebrook  
**Date**: October 2, 2025  
**Status**: Active Development

---

## Executive Summary

This document outlines the implementation plan for three critical areas with low completion rates:
- **Area 002: Merge Conflict Resolution** (10% complete)
- **Area 003: VS Code Extension Security** (30% complete)
- **Area 004: Component Discovery** (5% complete)

All implementations will follow the CAWS framework with proper risk tiering, testing, and verification.

---

## Priority Order (Based on Blocking Dependencies)

### 🔴 Phase 1: Security Foundation (Week 1-2)
**Why First**: Blocks VS Code extension development, critical security requirements

1. **Secure Message Protocol** (RQ-007)
2. **Path Validation** (RQ-008)
3. **Resource Limits** (RQ-009)

### 🟠 Phase 2: Merge Strategy (Week 2-3)
**Why Second**: Required for collaboration, blocks multi-user workflows

4. **Conflict Detection** (RQ-004)
5. **Semantic Diff** (RQ-005)
6. **CRDT Evaluation** (RQ-006)

### 🟡 Phase 3: Component Discovery (Week 4-5)
**Why Third**: Feature enhancement, not blocking core functionality

7. **Component Discovery** (RQ-010)
8. **Prop Extraction** (RQ-011)
9. **Index Format** (RQ-012)

---

## Phase 1: Security Foundation 🔴

### Implementation: Secure Message Protocol (RQ-007)

**Package**: `packages/vscode-ext/` (new)  
**Risk Tier**: 1 (Critical)  
**Estimated LOC**: 200-300

#### Requirements

**Acceptance Criteria**:
- All webview ↔ extension messages validated with Zod schemas
- Invalid messages rejected with clear error messages
- Protocol versioning supports future changes
- Message payloads sanitized before processing

#### Implementation Steps

1. **Define Message Types**
```typescript
// packages/vscode-ext/src/protocol.ts

export const LoadDocumentRequest = z.object({
  type: z.literal('loadDocument'),
  payload: z.object({
    path: z.string(),
  }),
});

export const SaveDocumentRequest = z.object({
  type: z.literal('saveDocument'),
  payload: z.object({
    path: z.string(),
    document: CanvasDocument,
  }),
});

export const UpdateNodeRequest = z.object({
  type: z.literal('updateNode'),
  payload: z.object({
    documentId: ULID,
    nodeId: ULID,
    patch: Patch,
  }),
});

export const WebviewMessage = z.union([
  LoadDocumentRequest,
  SaveDocumentRequest,
  UpdateNodeRequest,
  // ... more message types
]);
```

2. **Create Message Handler**
```typescript
// packages/vscode-ext/src/message-handler.ts

export class MessageHandler {
  constructor(private context: vscode.ExtensionContext) {}

  async handle(message: unknown): Promise<MessageResponse> {
    const validation = WebviewMessage.safeParse(message);
    
    if (!validation.success) {
      return {
        success: false,
        error: 'Invalid message format',
        details: validation.error.errors,
      };
    }

    const validMessage = validation.data;
    
    switch (validMessage.type) {
      case 'loadDocument':
        return this.handleLoadDocument(validMessage.payload);
      case 'saveDocument':
        return this.handleSaveDocument(validMessage.payload);
      // ... handle other types
    }
  }
}
```

3. **Testing Requirements** (Tier 1: 70% mutation coverage)
```typescript
// tests/message-handler.test.ts

describe('MessageHandler', () => {
  it('rejects malformed messages', async () => {
    const handler = new MessageHandler(mockContext);
    const result = await handler.handle({ invalid: 'message' });
    expect(result.success).toBe(false);
  });

  it('validates message schemas', async () => {
    const handler = new MessageHandler(mockContext);
    const result = await handler.handle({
      type: 'loadDocument',
      payload: { path: '../../../etc/passwd' }, // Should be rejected
    });
    expect(result.success).toBe(false);
  });

  it('handles valid load document message', async () => {
    const handler = new MessageHandler(mockContext);
    const result = await handler.handle({
      type: 'loadDocument',
      payload: { path: 'design/home.canvas.json' },
    });
    expect(result.success).toBe(true);
  });
});
```

#### CAWS Verification

- [ ] Schema validation tests pass
- [ ] Mutation testing achieves 70% coverage
- [ ] Security audit passes (no eval, no arbitrary file access)
- [ ] Documentation complete

**Deliverable**: `packages/vscode-ext/src/protocol.ts`, `message-handler.ts`

---

### Implementation: Path Validation (RQ-008)

**Package**: `packages/vscode-ext/` (security utilities)  
**Risk Tier**: 1 (Critical Security)  
**Estimated LOC**: 100-150

#### Requirements

**Acceptance Criteria**:
- All file paths validated against workspace root
- Directory traversal attacks prevented
- Only `.canvas.json` and `.json` files accessible
- Absolute paths rejected

#### Implementation

```typescript
// packages/vscode-ext/src/security/path-validator.ts

export class PathValidator {
  private workspaceRoot: string;
  private allowedPatterns: RegExp[];

  constructor(workspaceRoot: string) {
    this.workspaceRoot = path.resolve(workspaceRoot);
    this.allowedPatterns = [
      /^design\/.*\.canvas\.json$/,
      /^design\/tokens\.json$/,
      /^design\/mappings\..*\.json$/,
    ];
  }

  /**
   * Validate that a path is safe to access
   * @param filePath Path to validate
   * @returns Validation result
   */
  validate(filePath: string): ValidationResult {
    // Normalize path
    const normalized = path.normalize(filePath);
    
    // Reject absolute paths
    if (path.isAbsolute(normalized)) {
      return {
        valid: false,
        reason: 'Absolute paths not allowed',
      };
    }

    // Check for directory traversal
    if (normalized.includes('..')) {
      return {
        valid: false,
        reason: 'Directory traversal not allowed',
      };
    }

    // Resolve to absolute and check it's within workspace
    const resolved = path.resolve(this.workspaceRoot, normalized);
    if (!resolved.startsWith(this.workspaceRoot)) {
      return {
        valid: false,
        reason: 'Path outside workspace',
      };
    }

    // Check against allowed patterns
    const isAllowed = this.allowedPatterns.some(pattern => 
      pattern.test(normalized)
    );

    if (!isAllowed) {
      return {
        valid: false,
        reason: 'Path does not match allowed patterns',
      };
    }

    return {
      valid: true,
      resolvedPath: resolved,
    };
  }
}
```

#### Testing Requirements

```typescript
describe('PathValidator', () => {
  const validator = new PathValidator('/workspace');

  it('allows valid design file paths', () => {
    const result = validator.validate('design/home.canvas.json');
    expect(result.valid).toBe(true);
  });

  it('rejects directory traversal attempts', () => {
    const result = validator.validate('../../../etc/passwd');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('traversal');
  });

  it('rejects absolute paths', () => {
    const result = validator.validate('/etc/passwd');
    expect(result.valid).toBe(false);
  });

  it('rejects paths outside workspace', () => {
    const result = validator.validate('../../other-project/file.json');
    expect(result.valid).toBe(false);
  });

  it('rejects disallowed file types', () => {
    const result = validator.validate('design/script.js');
    expect(result.valid).toBe(false);
  });
});
```

**Deliverable**: `packages/vscode-ext/src/security/path-validator.ts`

---

### Implementation: Resource Limits (RQ-009)

**Package**: `packages/vscode-ext/` (resource management)  
**Risk Tier**: 1 (Performance & Stability)  
**Estimated LOC**: 150-200

#### Requirements

**Acceptance Criteria**:
- Document size limits enforced (10MB default)
- Node count warnings (1000 nodes)
- Memory usage monitoring
- Graceful degradation for large documents

#### Implementation

```typescript
// packages/vscode-ext/src/resource-limits.ts

export interface ResourceLimits {
  maxFileSizeBytes: number;
  maxNodeCount: number;
  warningNodeCount: number;
  maxMemoryMB: number;
}

export const defaultLimits: ResourceLimits = {
  maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
  maxNodeCount: 5000,
  warningNodeCount: 1000,
  maxMemoryMB: 500,
};

export class ResourceManager {
  constructor(private limits: ResourceLimits = defaultLimits) {}

  /**
   * Check if a file is within size limits
   */
  async validateFileSize(filePath: string): Promise<ValidationResult> {
    const stats = await fs.promises.stat(filePath);
    
    if (stats.size > this.limits.maxFileSizeBytes) {
      return {
        valid: false,
        reason: `File size ${stats.size} exceeds limit ${this.limits.maxFileSizeBytes}`,
      };
    }

    return { valid: true };
  }

  /**
   * Check if a document has too many nodes
   */
  validateNodeCount(document: CanvasDocumentType): ValidationResult {
    const nodeCount = this.countNodes(document);

    if (nodeCount > this.limits.maxNodeCount) {
      return {
        valid: false,
        reason: `Node count ${nodeCount} exceeds limit ${this.limits.maxNodeCount}`,
      };
    }

    if (nodeCount > this.limits.warningNodeCount) {
      return {
        valid: true,
        warning: `Document has ${nodeCount} nodes, which may affect performance`,
      };
    }

    return { valid: true };
  }

  private countNodes(document: CanvasDocumentType): number {
    let count = 0;
    
    for (const artboard of document.artboards) {
      count++; // Count artboard
      count += this.countChildNodes(artboard.children);
    }

    return count;
  }

  private countChildNodes(nodes: NodeType[]): number {
    let count = nodes.length;
    
    for (const node of nodes) {
      if (node.type === 'frame' && node.children) {
        count += this.countChildNodes(node.children);
      }
    }

    return count;
  }
}
```

**Deliverable**: `packages/vscode-ext/src/resource-limits.ts`

---

## Phase 2: Merge Strategy 🟠

### Implementation: Conflict Detection (RQ-004)

**Package**: `packages/canvas-engine/`  
**Risk Tier**: 1 (Data Integrity)  
**Estimated LOC**: 300-400

#### Conflict Taxonomy

**Conflict Types**:
1. **Structural Conflicts**
   - Same node moved to different parents
   - Same node deleted in one branch, modified in another
   - Different nodes added with same ID (shouldn't happen with ULIDs)

2. **Property Conflicts**
   - Same property modified differently (e.g., x: 100 vs x: 200)
   - Frame geometry conflicts
   - Style property conflicts

3. **Content Conflicts**
   - Text content modified differently
   - Different child nodes added to same parent
   - Z-order conflicts

#### Implementation

```typescript
// packages/canvas-engine/src/merge/conflict-detector.ts

export interface Conflict {
  type: 'structural' | 'property' | 'content';
  severity: 'error' | 'warning';
  nodeId: string;
  path: string[];
  baseValue: any;
  localValue: any;
  remoteValue: any;
  autoResolvable: boolean;
}

export class ConflictDetector {
  /**
   * Detect conflicts between three versions of a document
   * @param base Common ancestor
   * @param local Current branch
   * @param remote Other branch
   */
  detectConflicts(
    base: CanvasDocumentType,
    local: CanvasDocumentType,
    remote: CanvasDocumentType
  ): Conflict[] {
    const conflicts: Conflict[] = [];

    // Index nodes by ID for efficient lookup
    const baseNodes = this.indexNodes(base);
    const localNodes = this.indexNodes(local);
    const remoteNodes = this.indexNodes(remote);

    // Check all nodes
    const allNodeIds = new Set([
      ...baseNodes.keys(),
      ...localNodes.keys(),
      ...remoteNodes.keys(),
    ]);

    for (const nodeId of allNodeIds) {
      const baseNode = baseNodes.get(nodeId);
      const localNode = localNodes.get(nodeId);
      const remoteNode = remoteNodes.get(nodeId);

      // Detect structural conflicts
      conflicts.push(...this.detectStructuralConflicts(
        nodeId, baseNode, localNode, remoteNode
      ));

      // Detect property conflicts
      if (localNode && remoteNode) {
        conflicts.push(...this.detectPropertyConflicts(
          nodeId, baseNode, localNode, remoteNode
        ));
      }
    }

    return conflicts;
  }

  private detectStructuralConflicts(
    nodeId: string,
    base: NodeType | undefined,
    local: NodeType | undefined,
    remote: NodeType | undefined
  ): Conflict[] {
    const conflicts: Conflict[] = [];

    // Node deleted in local, modified in remote
    if (base && !local && remote) {
      conflicts.push({
        type: 'structural',
        severity: 'error',
        nodeId,
        path: [nodeId],
        baseValue: base,
        localValue: null,
        remoteValue: remote,
        autoResolvable: false,
      });
    }

    // Node deleted in remote, modified in local
    if (base && local && !remote) {
      conflicts.push({
        type: 'structural',
        severity: 'error',
        nodeId,
        path: [nodeId],
        baseValue: base,
        localValue: local,
        remoteValue: null,
        autoResolvable: false,
      });
    }

    return conflicts;
  }

  private detectPropertyConflicts(
    nodeId: string,
    base: NodeType | undefined,
    local: NodeType,
    remote: NodeType
  ): Conflict[] {
    const conflicts: Conflict[] = [];

    // Check frame properties
    if (local.frame && remote.frame) {
      ['x', 'y', 'width', 'height'].forEach(prop => {
        const localVal = local.frame[prop as keyof typeof local.frame];
        const remoteVal = remote.frame[prop as keyof typeof remote.frame];
        const baseVal = base?.frame?.[prop as keyof typeof base.frame];

        if (localVal !== remoteVal && localVal !== baseVal && remoteVal !== baseVal) {
          conflicts.push({
            type: 'property',
            severity: 'warning',
            nodeId,
            path: [nodeId, 'frame', prop],
            baseValue: baseVal,
            localValue: localVal,
            remoteValue: remoteVal,
            autoResolvable: true, // Can average coordinates
          });
        }
      });
    }

    return conflicts;
  }

  private indexNodes(doc: CanvasDocumentType): Map<string, NodeType> {
    const index = new Map<string, NodeType>();
    
    for (const artboard of doc.artboards) {
      this.indexNodeRecursive(artboard.children, index);
    }

    return index;
  }

  private indexNodeRecursive(nodes: NodeType[], index: Map<string, NodeType>) {
    for (const node of nodes) {
      index.set(node.id, node);
      if (node.type === 'frame' && node.children) {
        this.indexNodeRecursive(node.children, index);
      }
    }
  }
}
```

**Testing Requirements**: 20 example conflict scenarios

**Deliverable**: `packages/canvas-engine/src/merge/conflict-detector.ts`

---

### Implementation: Semantic Diff (RQ-005)

**Package**: `packages/canvas-engine/`  
**Risk Tier**: 2 (Quality of Life)  
**Estimated LOC**: 200-300

#### Implementation

```typescript
// packages/canvas-engine/src/merge/semantic-diff.ts

export interface DiffOperation {
  type: 'add' | 'remove' | 'modify' | 'move';
  nodeId: string;
  path: string[];
  oldValue?: any;
  newValue?: any;
  oldParent?: string;
  newParent?: string;
}

export class SemanticDiff {
  /**
   * Generate semantic diff between two documents
   */
  diff(
    oldDoc: CanvasDocumentType,
    newDoc: CanvasDocumentType
  ): DiffOperation[] {
    const operations: DiffOperation[] = [];

    const oldNodes = this.indexWithParents(oldDoc);
    const newNodes = this.indexWithParents(newDoc);

    const allIds = new Set([...oldNodes.keys(), ...newNodes.keys()]);

    for (const nodeId of allIds) {
      const oldInfo = oldNodes.get(nodeId);
      const newInfo = newNodes.get(nodeId);

      if (!oldInfo && newInfo) {
        // Node added
        operations.push({
          type: 'add',
          nodeId,
          path: [nodeId],
          newValue: newInfo.node,
        });
      } else if (oldInfo && !newInfo) {
        // Node removed
        operations.push({
          type: 'remove',
          nodeId,
          path: [nodeId],
          oldValue: oldInfo.node,
        });
      } else if (oldInfo && newInfo) {
        // Check if moved
        if (oldInfo.parentId !== newInfo.parentId) {
          operations.push({
            type: 'move',
            nodeId,
            path: [nodeId],
            oldParent: oldInfo.parentId,
            newParent: newInfo.parentId,
          });
        }

        // Check for property changes
        operations.push(...this.diffNodeProperties(oldInfo.node, newInfo.node));
      }
    }

    return operations;
  }

  private diffNodeProperties(oldNode: NodeType, newNode: NodeType): DiffOperation[] {
    const operations: DiffOperation[] = [];

    // Compare frame properties
    if (JSON.stringify(oldNode.frame) !== JSON.stringify(newNode.frame)) {
      operations.push({
        type: 'modify',
        nodeId: oldNode.id,
        path: [oldNode.id, 'frame'],
        oldValue: oldNode.frame,
        newValue: newNode.frame,
      });
    }

    // Compare other properties based on node type
    if (oldNode.type === 'text' && newNode.type === 'text') {
      if (oldNode.text !== newNode.text) {
        operations.push({
          type: 'modify',
          nodeId: oldNode.id,
          path: [oldNode.id, 'text'],
          oldValue: oldNode.text,
          newValue: newNode.text,
        });
      }
    }

    return operations;
  }

  private indexWithParents(doc: CanvasDocumentType): Map<string, { node: NodeType; parentId?: string }> {
    const index = new Map();
    
    for (const artboard of doc.artboards) {
      this.indexNodesWithParent(artboard.children, undefined, index);
    }

    return index;
  }

  private indexNodesWithParent(
    nodes: NodeType[],
    parentId: string | undefined,
    index: Map<string, { node: NodeType; parentId?: string }>
  ) {
    for (const node of nodes) {
      index.set(node.id, { node, parentId });
      if (node.type === 'frame' && node.children) {
        this.indexNodesWithParent(node.children, node.id, index);
      }
    }
  }
}
```

**Deliverable**: `packages/canvas-engine/src/merge/semantic-diff.ts`

---

## Phase 3: Component Discovery 🟡

### Implementation Overview

**Package**: `packages/component-indexer/` (new)  
**Risk Tier**: 2 (Feature Enhancement)  
**Estimated LOC**: 400-500

This phase will be detailed after Phases 1 and 2 are complete.

**Key Decisions Needed**:
- react-docgen-typescript vs TS Compiler API
- Index format schema
- Watch mode implementation
- Monorepo support

---

## CAWS Verification Checklist

For each implementation:

### Risk Tier 1 Requirements
- [ ] 70% mutation testing coverage
- [ ] Contract tests for all public APIs
- [ ] Property-based tests for core algorithms
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Working spec updated

### Risk Tier 2 Requirements
- [ ] 50% mutation testing coverage
- [ ] Integration tests
- [ ] Documentation complete

### All Implementations
- [ ] Linter passes
- [ ] Type checking passes
- [ ] Unit tests pass
- [ ] Coverage thresholds met
- [ ] Git provenance generated
- [ ] Changelog updated

---

## Timeline

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1 | Security - Message Protocol | Protocol schemas, message handler, tests |
| 1-2 | Security - Path Validation | Path validator, security tests |
| 2 | Security - Resource Limits | Resource manager, limit tests |
| 2-3 | Merge - Conflict Detection | Conflict detector, 20 test scenarios |
| 3 | Merge - Semantic Diff | Diff tool, integration tests |
| 4-5 | Component Discovery | Discovery system, prop extraction |

---

## Success Metrics

- **Security**: All 3 RQs resolved, 0 security vulnerabilities
- **Merge**: Conflict detection handles 20 scenarios, diff tool outputs clean HTML
- **Component Discovery**: Can index 100 components in <5s
- **Testing**: All packages meet tier requirements (70% tier 1, 50% tier 2)
- **Documentation**: All APIs documented, guides complete

---

**Next Action**: Begin Phase 1 - Secure Message Protocol implementation


