# Canvas Schema API

Core API for working with Designer canvas documents, nodes, and schema validation.

## 📋 Overview

The Canvas Schema API provides TypeScript interfaces and functions for:

- **Document Management**: Create, validate, and manipulate canvas documents
- **Node Operations**: Work with frames, text, vectors, images, and components
- **Schema Validation**: Validate documents against the current schema
- **Schema Migration**: Handle version upgrades automatically
- **Performance Monitoring**: Track document performance and memory usage

## 🚀 Quick Start

```typescript
import {
  CanvasDocument,
  createEmptyDocument,
  validateDocument,
  generateULID
} from '@paths-design/canvas-schema';

// Create a new document
const doc = createEmptyDocument('My Design');

// Generate unique IDs
const nodeId = generateULID();

// Validate the document
const validation = validateDocument(doc);
console.log('Document valid:', validation.success);
```

## 📄 Core Types

### CanvasDocument
```typescript
interface CanvasDocument {
  schemaVersion: "0.1.0";
  id: string;           // ULID
  name: string;
  artboards: Artboard[];
}
```

### Artboard
```typescript
interface Artboard {
  id: string;           // ULID
  name: string;
  frame: Rect;
  children: Node[];
}
```

### Node Types
```typescript
type Node =
  | FrameNode
  | TextNode
  | VectorNode
  | ImageNode
  | ComponentInstanceNode;

interface BaseNode {
  id: string;           // ULID
  type: string;
  name: string;
  visible: boolean;
  frame: Rect;
  style?: Style;
  data?: Record<string, any>;
  bind?: any;
  semanticKey?: string;
}
```

## 🔧 Document Operations

### Creating Documents
```typescript
import { createEmptyDocument, generateULID } from '@paths-design/canvas-schema';

// Create empty document
const doc = createEmptyDocument('Homepage');

// Create document with custom artboard
const customDoc: CanvasDocument = {
  schemaVersion: "0.1.0",
  id: generateULID(),
  name: "Custom Design",
  artboards: [{
    id: generateULID(),
    name: "Main Artboard",
    frame: { x: 0, y: 0, width: 1920, height: 1080 },
    children: []
  }]
};
```

### Document Validation
```typescript
import { validateDocument, validateDocumentWithPerformance } from '@paths-design/canvas-schema';

// Basic validation
const basicValidation = validateDocument(document);
if (!basicValidation.success) {
  console.error('Validation errors:', basicValidation.errors);
}

// Performance-aware validation
const perfValidation = validateDocumentWithPerformance(document);
if (perfValidation.performance?.warnings.length) {
  console.warn('Performance warnings:', perfValidation.performance.warnings);
}
```

### Schema Migration
```typescript
import { migrateDocument, needsMigration } from '@paths-design/canvas-schema';

// Check if migration needed
if (needsMigration(document.schemaVersion)) {
  const migrated = migrateDocument(document);
  console.log('Migrated to version:', migrated.schemaVersion);
}
```

## 🎨 Node Operations

### Node Creation
```typescript
import { generateULID } from '@paths-design/canvas-schema';

// Create a text node
const textNode: TextNode = {
  id: generateULID(),
  type: 'text',
  name: 'Title',
  visible: true,
  frame: { x: 100, y: 100, width: 200, height: 40 },
  text: 'Hello World',
  textStyle: {
    size: 24,
    family: 'Inter',
    weight: 'bold'
  }
};

// Create a frame node
const frameNode: FrameNode = {
  id: generateULID(),
  type: 'frame',
  name: 'Container',
  visible: true,
  frame: { x: 0, y: 0, width: 400, height: 300 },
  layout: { direction: 'vertical' },
  children: [textNode]
};
```

### Node Traversal
```typescript
import { CanvasDocument } from '@paths-design/canvas-schema';

// Find node by ID
function findNodeById(doc: CanvasDocument, nodeId: string): Node | null {
  for (const artboard of doc.artboards) {
    for (const node of artboard.children) {
      if (node.id === nodeId) return node;
      // Recursively search children
      const found = findInChildren(node, nodeId);
      if (found) return found;
    }
  }
  return null;
}

function findInChildren(node: Node, targetId: string): Node | null {
  if (!node.children) return null;
  for (const child of node.children) {
    if (child.id === targetId) return child;
    const found = findInChildren(child, targetId);
    if (found) return found;
  }
  return null;
}
```

### Node Manipulation
```typescript
// Update node properties
function updateNodeText(node: TextNode, newText: string): TextNode {
  return {
    ...node,
    text: newText,
    // Update timestamp or other metadata as needed
  };
}

// Add child node
function addChild(parent: FrameNode, child: Node): FrameNode {
  return {
    ...parent,
    children: [...(parent.children || []), child]
  };
}
```

## 🧩 Component System

### Component Creation
```typescript
import { createComponentFromNode, createComponentInstance } from '@paths-design/canvas-schema';

// Create component from existing node
const buttonNode: FrameNode = { /* button design */ };
const buttonComponent = createComponentFromNode(
  buttonNode,
  'Button',
  'A reusable button component',
  'ui',
  ['interactive', 'form']
);

// Create component instance
const buttonInstance = createComponentInstance(
  buttonComponent,
  { x: 100, y: 100, width: 120, height: 40 },
  { text: 'Click me', variant: 'primary' }
);
```

### Component Properties
```typescript
// Define component with customizable properties
const componentDefinition = createComponentFromNode(node, 'Card', 'A card component');

// Component properties are automatically extracted:
// - Text nodes: text content
// - Frame nodes: layout properties
// - Style properties: fills, strokes, etc.

// Use component with property overrides
const cardInstance = createComponentInstance(componentDefinition, position, {
  title: 'Custom Title',
  elevated: true
});
```

## ⚡ Performance Monitoring

### Basic Monitoring
```typescript
import { PerformanceMonitor, checkDocumentPerformance } from '@paths-design/canvas-schema';

const monitor = PerformanceMonitor.getInstance();

// Start timing an operation
monitor.startOperation('document-load');

// Your operation here
const doc = loadDocument();

// End timing
const duration = monitor.endOperation('document-load');
console.log(`Load took ${duration}ms`);

// Check document performance
const performance = checkDocumentPerformance(doc);
if (!performance.withinBudget) {
  console.warn('Performance warnings:', performance.warnings);
}
```

### Memory Budget Tracking
```typescript
import { PERFORMANCE_BUDGETS } from '@paths-design/canvas-schema';

// Check if operation exceeds memory budget
const estimatedMemory = calculateMemoryUsage(data);
if (monitor.exceedsMemoryBudget(estimatedMemory)) {
  console.warn('Operation exceeds memory budget');
}

// Get current metrics
const metrics = monitor.getMetrics();
console.log('Operations tracked:', metrics.operationCounts);
```

## 🔄 Schema Migration

### Migration Functions
```typescript
import { migrations, migrateDocument } from '@paths-design/canvas-schema';

// Available migrations
console.log('Available migrations:', Object.keys(migrations));

// Migrate a document
const oldDoc = { schemaVersion: '0.0.1', /* ... */ };
const newDoc = migrateDocument(oldDoc);
console.log('Migrated to:', newDoc.schemaVersion);
```

### Version Detection
```typescript
import { needsMigration, LATEST_SCHEMA_VERSION } from '@paths-design/canvas-schema';

if (needsMigration(document.schemaVersion)) {
  console.log('Migration needed');
  const migrated = migrateDocument(document);
} else {
  console.log('Document is current version');
}
```

## 🎛️ Validation

### Basic Validation
```typescript
import { validateDocument } from '@paths-design/canvas-schema';

const result = validateDocument(document);

if (result.success) {
  console.log('Document is valid');
  // result.data contains the validated document
} else {
  console.error('Validation errors:', result.errors);
}
```

### Migration-Aware Validation
```typescript
import { validateDocumentWithPerformance } from '@paths-design/canvas-schema';

const result = validateDocumentWithPerformance(document);

if (result.success) {
  if (result.migrated) {
    console.log('Document was automatically migrated');
  }

  if (result.performance?.warnings.length) {
    console.warn('Performance warnings:', result.performance.warnings);
  }
}
```

## 📋 Best Practices

### Document Management
- **Always validate** documents before processing
- **Use ULIDs** for all node and document IDs
- **Handle migrations** gracefully in your code
- **Monitor performance** for large documents

### Node Operations
- **Preserve node IDs** when possible for stability
- **Use semantic keys** for component identification
- **Validate node types** before type-specific operations
- **Handle nested structures** recursively

### Component Development
- **Extract meaningful properties** from source nodes
- **Provide sensible defaults** for all properties
- **Include comprehensive descriptions** for component properties
- **Test component instantiation** thoroughly

### Performance
- **Monitor operation timing** for bottlenecks
- **Check memory budgets** before large operations
- **Use performance-aware validation** for large documents
- **Implement progressive loading** for complex documents

## 🚨 Error Handling

### Common Error Patterns
```typescript
import { validateDocument } from '@paths-design/canvas-schema';

try {
  const result = validateDocument(document);

  if (!result.success) {
    // Handle validation errors
    result.errors?.forEach(error => {
      console.error(`Validation error: ${error}`);
    });
    return;
  }

  // Process valid document
  processDocument(result.data!);

} catch (error) {
  // Handle unexpected errors
  console.error('Unexpected error:', error);
}
```

### Migration Error Handling
```typescript
import { migrateDocument } from '@paths-design/canvas-schema';

try {
  const migrated = migrateDocument(oldDocument);
  console.log('Migration successful');
} catch (error) {
  if (error.message.includes('No migration available')) {
    console.error('Unsupported schema version');
  } else {
    console.error('Migration failed:', error.message);
  }
}
```

## 📚 Examples

### Complete Document Processing Pipeline
```typescript
import {
  createEmptyDocument,
  validateDocument,
  migrateDocument,
  checkDocumentPerformance,
  PerformanceMonitor
} from '@paths-design/canvas-schema';

async function processCanvasDocument(rawData: any): Promise<CanvasDocument> {
  const monitor = PerformanceMonitor.getInstance();

  // Start performance monitoring
  monitor.startOperation('document-processing');

  try {
    // Validate and migrate if needed
    const validation = validateDocument(rawData);

    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
    }

    let document = validation.data!;

    // Check performance
    const performance = checkDocumentPerformance(document);
    if (!performance.withinBudget) {
      console.warn('Performance warnings:', performance.warnings);
    }

    // Process the document
    document = await enhanceDocument(document);

    // End monitoring
    const duration = monitor.endOperation('document-processing');
    console.log(`Processing took ${duration}ms`);

    return document;

  } catch (error) {
    monitor.endOperation('document-processing'); // End even on error
    throw error;
  }
}
```

## 🎯 API Reference

### Core Functions
- `createEmptyDocument(name: string): CanvasDocument` - Create new document
- `validateDocument(doc: unknown): ValidationResult` - Validate document
- `validateDocumentWithPerformance(doc: unknown): PerformanceValidationResult` - Validate with performance
- `migrateDocument(doc: any): CanvasDocument` - Migrate schema version
- `needsMigration(version: string): boolean` - Check if migration needed

### Performance Functions
- `PerformanceMonitor.getInstance(): PerformanceMonitor` - Get performance monitor
- `checkDocumentPerformance(doc: CanvasDocument): PerformanceCheck` - Check document performance
- `PERFORMANCE_BUDGETS` - Performance budget constants

### Utility Functions
- `generateULID(): string` - Generate unique ID
- `canonicalizeDocument(obj: any): string` - Canonical JSON serialization
- `isValidUlid(id: string): boolean` - Validate ULID format

### Type Exports
- `CanvasDocumentType` - Canvas document type
- `NodeType` - Union of all node types
- `ArtboardType` - Artboard type
- `ComponentDefinitionType` - Component definition type

---

*Ready to build? → [VS Code Extension API](./vscode-extension.md)*
