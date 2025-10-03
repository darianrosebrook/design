# Plugin Developer API Documentation

Comprehensive API reference for extending Designer with plugins, tools, and integrations.

## 🎯 Overview

Designer provides multiple APIs for plugin development:

- **[Canvas Schema API](./canvas-schema.md)** - Programmatic access to canvas documents and nodes
- **[VS Code Extension API](./vscode-extension.md)** - Extend the VS Code extension functionality
- **[Component System API](./components.md)** - Create and manage reusable components
- **[Performance Monitoring API](./performance.md)** - Monitor and optimize performance
- **[MCP/Agent API](./mcp-agent.md)** - Integrate with external tools and agents

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** - For plugin development
- **TypeScript** - Recommended for type safety
- **VS Code Extension Development** - For extension plugins

### Basic Plugin Structure
```typescript
// Example plugin structure
import { CanvasDocument, createEmptyDocument } from '@paths-design/canvas-schema';

export class MyPlugin {
  async processDocument(doc: CanvasDocument): Promise<CanvasDocument> {
    // Plugin logic here
    return doc;
  }
}
```

## 🔧 API Categories

### 📄 Canvas Schema API
**Primary API for working with canvas documents**
- Document creation and validation
- Node manipulation and traversal
- Schema migration and version handling
- Component definition and instantiation

### 🔌 VS Code Extension API
**Extend the VS Code extension**
- Command registration and handling
- Webview communication
- Workspace file operations
- Configuration management

### 🧩 Component System API
**Create and manage reusable components**
- Component definition and properties
- Component library management
- Component instantiation and overrides
- Component validation and versioning

### ⚡ Performance Monitoring API
**Monitor and optimize performance**
- Performance budget tracking
- Memory usage monitoring
- Operation timing and profiling
- Performance warnings and alerts

### 🤖 MCP/Agent API
**Integrate with external tools and agents**
- Message protocol definitions
- Tool registration and execution
- Agent communication patterns
- Provenance and audit trails

## 📚 Examples

### Basic Canvas Processing
```typescript
import { validateDocument, createEmptyDocument } from '@paths-design/canvas-schema';

// Create a new document
const doc = createEmptyDocument('My Design');

// Validate and process
const validation = validateDocument(doc);
if (validation.success) {
  console.log('Document is valid');
}
```

### Component Creation
```typescript
import { createComponentFromNode, createComponentInstance } from '@paths-design/canvas-schema';

// Create component from existing node
const component = createComponentFromNode(node, 'Button', 'A reusable button');

// Create instance with overrides
const instance = createComponentInstance(component, position, {
  text: 'Click me',
  variant: 'primary'
});
```

### Performance Monitoring
```typescript
import { PerformanceMonitor } from '@paths-design/canvas-schema';

const monitor = PerformanceMonitor.getInstance();

// Start timing an operation
monitor.startOperation('complex-calculation');

// Your operation here
const result = performComplexCalculation();

// End timing and get duration
const duration = monitor.endOperation('complex-calculation');
console.log(`Operation took ${duration}ms`);
```

## 🎛️ Configuration

### Performance Budgets
```json
{
  "designer.performance.enableBudgetMonitoring": true,
  "designer.performance.memoryBudgetMB": 100,
  "designer.performance.maxNodesPerDocument": 10000
}
```

### Extension Development
```json
{
  "designer.development.enableDebugMode": true,
  "designer.development.logLevel": "verbose"
}
```

## 🔍 Testing

### API Testing Patterns
```typescript
import { describe, it, expect } from 'vitest';
import { validateDocument } from '@paths-design/canvas-schema';

describe('Canvas API', () => {
  it('validates documents correctly', () => {
    const doc = createEmptyDocument('Test');
    const result = validateDocument(doc);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
```

## 🚨 Error Handling

### Common Patterns
```typescript
try {
  const result = validateDocument(document);
  if (!result.success) {
    console.error('Validation failed:', result.errors);
    return;
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

## 📞 Support

- **Issues**: Report API issues in the main repository
- **Discussions**: Use GitHub Discussions for API questions
- **Examples**: Check `packages/*/tests/` for usage examples
- **Changelog**: Follow API changes in release notes

---

*Plugin development? → [Canvas Schema API](./canvas-schema.md)*
