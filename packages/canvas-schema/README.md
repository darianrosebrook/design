# Canvas Schema

**Author**: @darianrosebrook
**Version**: 0.1.0
**Package**: @paths-design/designer/canvas-schema

Core schema definitions and validation for Designer canvas documents.

## Overview

This package provides:
- **TypeScript types** for canvas documents using Zod schemas
- **JSON Schema validation** using Ajv for runtime validation
- **ULID generation** for stable node IDs
- **Canonical serialization** for deterministic output

## Installation

```bash
pnpm add @paths-design/designer/canvas-schema
```

## Usage

### TypeScript Types

```typescript
import { CanvasDocument, TextNode, FrameNode, ULID, Rect } from '@paths-design/designer/canvas-schema';

const doc: CanvasDocument = {
  schemaVersion: '0.1.0',
  id: '01JF2PZV9G2WR5C3W7P0YHNX9D',
  name: 'My Design',
  artboards: [
    {
      id: '01JF2Q02Q3MZ3Q9J7HB3X6N9QB',
      name: 'Desktop',
      frame: { x: 0, y: 0, width: 1440, height: 1024 },
      children: [
        {
          id: '01JF2Q06GTS16EJ3A3F0KK9K3T',
          type: 'frame',
          name: 'Hero',
          frame: { x: 0, y: 0, width: 1440, height: 480 },
          style: { fills: [{ type: 'solid', color: '#111317' }] },
          children: []
        }
      ]
    }
  ]
};
```

### Validation

```typescript
import { validateCanvasDocument } from '@paths-design/designer/canvas-schema';

const result = validateCanvasDocument(doc);

if (result.valid) {
  console.log('Document is valid:', result.data);
} else {
  console.error('Validation errors:', result.errors);
}
```

### ULID Generation

```typescript
import { generateULID } from '@paths-design/designer/canvas-schema';

const nodeId = generateULID(); // Returns a unique 26-character ULID
```

### Canonical Serialization

```typescript
import { canonicalSerialize } from '@paths-design/designer/canvas-schema';

const jsonString = canonicalSerialize(doc);
// Always produces identical output for identical input
```

## Schema Structure

### Canvas Document
```typescript
interface CanvasDocument {
  schemaVersion: '0.1.0';
  id: ULID;
  name: string;
  artboards: Artboard[];
}
```

### Artboard
```typescript
interface Artboard {
  id: ULID;
  name: string;
  frame: Rect;
  children: Node[];
}
```

### Node Types
- **FrameNode**: Container for other nodes with layout
- **TextNode**: Text content with styling
- **ComponentInstanceNode**: Reference to external components

## Development

```bash
# Type checking
pnpm run typecheck

# Build
pnpm run build

# Test (when implemented)
pnpm run test

# Validate schemas
pnpm run validate
```

## Architecture

- **Type Safety**: Zod schemas provide compile-time type checking
- **Runtime Validation**: Ajv validates documents against JSON Schema
- **Determinism**: Canonical serialization ensures identical output
- **Performance**: Optimized for large documents (1000+ nodes)

## Security

- **No eval()**: Schema validation uses safe parsing only
- **Input Sanitization**: All inputs validated against schemas
- **Workspace Isolation**: Designed for VS Code webview security model
