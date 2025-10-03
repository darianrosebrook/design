# Performance Monitoring API

API for monitoring and optimizing Designer performance, including memory usage, operation timing, and budget management.

## 📋 Overview

The Performance Monitoring API provides:

- **Operation Timing**: Track and measure operation durations
- **Memory Budget Monitoring**: Monitor memory usage against configurable limits
- **Performance Metrics**: Collect and analyze performance data
- **Budget Management**: Configure and enforce performance budgets
- **Performance Warnings**: Alert users when budgets are exceeded

## 🚀 Quick Start

```typescript
import { PerformanceMonitor, checkDocumentPerformance } from '@paths-design/canvas-schema';

const monitor = PerformanceMonitor.getInstance();

// Start timing an operation
monitor.startOperation('document-load');

// Your operation here
const document = loadDocument();

// End timing and get duration
const duration = monitor.endOperation('document-load');
console.log(`Load took ${duration}ms`);

// Check document performance
const performance = checkDocumentPerformance(document);
if (!performance.withinBudget) {
  console.warn('Performance warnings:', performance.warnings);
}
```

## ⏱️ Operation Timing

### Basic Timing
```typescript
import { PerformanceMonitor } from '@paths-design/canvas-schema';

const monitor = PerformanceMonitor.getInstance();

// Start timing
monitor.startOperation('complex-operation');

// Your operation here
const result = performComplexOperation();

// End timing
const duration = monitor.endOperation('complex-operation');
console.log(`Operation took ${duration}ms`);

// Check if operation exceeded time budget
if (monitor.exceedsTimeBudget(duration)) {
  console.warn('Operation exceeded time budget');
}
```

### Memory Usage Tracking
```typescript
// Record memory usage for an operation
const memoryUsed = estimateMemoryUsage(data);
monitor.recordMemoryUsage('my-operation', memoryUsed);

// Check if operation exceeds memory budget
if (monitor.exceedsMemoryBudget(memoryUsed)) {
  console.warn('Operation exceeds memory budget');
}
```

### Getting Metrics
```typescript
// Get all performance metrics
const metrics = monitor.getMetrics();
console.log('Operation counts:', metrics.operationCounts);
console.log('Memory usage:', metrics.memoryUsage);

// Reset metrics
monitor.reset();
```

## 📊 Document Performance

### Performance Budgets
```typescript
import { PERFORMANCE_BUDGETS } from '@paths-design/canvas-schema';

// Available budget constants
console.log('Max nodes per document:', PERFORMANCE_BUDGETS.MAX_NODES_PER_DOCUMENT);
console.log('Max artboards per document:', PERFORMANCE_BUDGETS.MAX_ARTBOARDS_PER_DOCUMENT);
console.log('Max nesting depth:', PERFORMANCE_BUDGETS.MAX_NESTING_DEPTH);
console.log('Memory budget MB:', PERFORMANCE_BUDGETS.MEMORY_BUDGET_MB);
console.log('Operation timeout ms:', PERFORMANCE_BUDGETS.OPERATION_TIMEOUT_MS);
```

### Document Analysis
```typescript
import { checkDocumentPerformance } from '@paths-design/canvas-schema';

// Analyze document performance
const performance = checkDocumentPerformance(document);

console.log('Within budget:', performance.withinBudget);
console.log('Warnings:', performance.warnings);
console.log('Metrics:', {
  nodeCount: performance.metrics.nodeCount,
  artboardCount: performance.metrics.artboardCount,
  maxNestingDepth: performance.metrics.maxNestingDepth,
  estimatedMemoryMB: performance.metrics.estimatedMemoryMB
});

// Check specific limits
if (performance.metrics.nodeCount > PERFORMANCE_BUDGETS.MAX_NODES_PER_DOCUMENT) {
  console.warn('Document has too many nodes');
}

if (performance.metrics.estimatedMemoryMB > PERFORMANCE_BUDGETS.MEMORY_BUDGET_MB) {
  console.warn('Document may exceed memory budget');
}
```

### Performance-Aware Validation
```typescript
import { validateDocumentWithPerformance } from '@paths-design/canvas-schema';

// Validate with performance analysis
const result = validateDocumentWithPerformance(document);

if (result.success) {
  if (result.performance?.warnings.length) {
    console.warn('Performance warnings:', result.performance.warnings);
  }

  // Document is valid and within performance budgets
  console.log('Document is performant');
} else {
  console.error('Document validation failed:', result.errors);
}
```

## ⚙️ Configuration Management

### Reading Performance Settings
```typescript
import * as vscode from 'vscode';

// Get performance configuration
const config = vscode.workspace.getConfiguration('designer.performance');

// Read specific settings
const enableBudgetMonitoring = config.get('enableBudgetMonitoring', true);
const memoryBudgetMB = config.get('memoryBudgetMB', 100);
const maxNodes = config.get('maxNodesPerDocument', 10000);

// Check if budget monitoring is enabled
if (enableBudgetMonitoring) {
  console.log('Performance monitoring is active');
}
```

### Updating Performance Settings
```typescript
// Update memory budget
await config.update('memoryBudgetMB', 200, vscode.ConfigurationTarget.Global);

// Disable budget monitoring
await config.update('enableBudgetMonitoring', false, vscode.ConfigurationTarget.Workspace);

// Update node limit
await config.update('maxNodesPerDocument', 50000, vscode.ConfigurationTarget.Global);
```

## 📈 Advanced Monitoring

### Custom Performance Metrics
```typescript
const monitor = PerformanceMonitor.getInstance();

// Track custom metrics
monitor.recordMemoryUsage('custom-operation', customMemoryUsage);

// Create operation-specific timing
const startTime = performance.now();
// ... operation ...
const duration = performance.now() - startTime;

if (duration > 1000) { // 1 second threshold
  console.warn('Operation took longer than expected');
}
```

### Batch Operations Monitoring
```typescript
// Monitor batch operations
monitor.startOperation('batch-process');

for (const item of items) {
  monitor.startOperation(`process-item-${item.id}`);
  await processItem(item);
  monitor.endOperation(`process-item-${item.id}`);
}

const totalDuration = monitor.endOperation('batch-process');
console.log(`Batch processing took ${totalDuration}ms`);
```

### Memory Usage Estimation
```typescript
// Estimate memory usage for canvas documents
function estimateDocumentMemoryUsage(doc: CanvasDocument): number {
  let nodeCount = 0;

  const countNodes = (nodes: Node[]) => {
    nodes.forEach(node => {
      nodeCount++;
      if (node.children) {
        countNodes(node.children);
      }
    });
  };

  doc.artboards.forEach(artboard => {
    if (artboard.children) {
      countNodes(artboard.children);
    }
  });

  // Rough estimate: ~1KB per node
  return nodeCount * 1024;
}

// Use in performance monitoring
const memoryUsage = estimateDocumentMemoryUsage(document);
monitor.recordMemoryUsage('document-load', memoryUsage);
```

## 🚨 Performance Warnings

### Warning System
```typescript
import { checkDocumentPerformance } from '@paths-design/canvas-schema';

// Check document and show warnings
const performance = checkDocumentPerformance(document);

if (!performance.withinBudget) {
  performance.warnings.forEach(warning => {
    console.warn(`Performance Warning: ${warning}`);

    // Show user-friendly warning
    vscode.window.showWarningMessage(`Performance Warning: ${warning}`);
  });
}
```

### Custom Warning Thresholds
```typescript
// Define custom performance thresholds
const CUSTOM_THRESHOLDS = {
  MAX_NODES: 50000,
  MAX_MEMORY_MB: 50,
  MAX_LOAD_TIME_MS: 5000
};

// Check against custom thresholds
const nodeCount = countNodes(document);
if (nodeCount > CUSTOM_THRESHOLDS.MAX_NODES) {
  console.warn(`Document has ${nodeCount} nodes, custom limit is ${CUSTOM_THRESHOLDS.MAX_NODES}`);
}
```

## 📊 Performance Metrics

### Metrics Collection
```typescript
const monitor = PerformanceMonitor.getInstance();

// Get current metrics
const metrics = monitor.getMetrics();
console.log('Operations tracked:', Object.keys(metrics.operationCounts).length);
console.log('Memory tracked:', Object.keys(metrics.memoryUsage).length);

// Detailed metrics
Object.entries(metrics.operationCounts).forEach(([operation, count]) => {
  console.log(`${operation}: ${count} operations`);
});

Object.entries(metrics.memoryUsage).forEach(([operation, bytes]) => {
  console.log(`${operation}: ${(bytes / 1024 / 1024).toFixed(2)} MB`);
});
```

### Performance Reporting
```typescript
// Generate performance report
function generatePerformanceReport(doc: CanvasDocument) {
  const performance = checkDocumentPerformance(doc);
  const monitor = PerformanceMonitor.getInstance();
  const metrics = monitor.getMetrics();

  return {
    document: {
      name: doc.name,
      nodeCount: performance.metrics.nodeCount,
      artboardCount: performance.metrics.artboardCount,
      withinBudget: performance.withinBudget
    },
    performance: {
      warnings: performance.warnings,
      memoryUsage: performance.metrics.estimatedMemoryMB
    },
    operations: metrics.operationCounts
  };
}

// Use in monitoring
const report = generatePerformanceReport(document);
console.log('Performance Report:', JSON.stringify(report, null, 2));
```

## 🎛️ Configuration Integration

### VS Code Settings Integration
```typescript
import * as vscode from 'vscode';

// Read performance settings from VS Code
const config = vscode.workspace.getConfiguration('designer.performance');
const enableMonitoring = config.get('enableBudgetMonitoring', true);
const memoryBudget = config.get('memoryBudgetMB', 100);

// Use settings in performance monitoring
if (enableMonitoring) {
  const performance = checkDocumentPerformance(document);

  if (performance.metrics.estimatedMemoryMB > memoryBudget) {
    vscode.window.showWarningMessage(
      `Document may use ${performance.metrics.estimatedMemoryMB.toFixed(1)}MB, exceeding budget of ${memoryBudget}MB`
    );
  }
}
```

### Dynamic Budget Adjustment
```typescript
// Adjust budgets based on system capabilities
const systemMemoryGB = getSystemMemoryGB();

if (systemMemoryGB > 16) {
  // High-end system, increase budgets
  await config.update('memoryBudgetMB', 200);
  await config.update('maxNodesPerDocument', 50000);
} else if (systemMemoryGB < 8) {
  // Low-end system, decrease budgets
  await config.update('memoryBudgetMB', 50);
  await config.update('maxNodesPerDocument', 5000);
}
```

## 📋 Best Practices

### Operation Monitoring
- **Start timing early** - Begin monitoring before heavy operations
- **Use descriptive names** - Make operation IDs meaningful for debugging
- **Monitor memory usage** - Track memory consumption for large operations
- **Handle timeouts** - Set appropriate timeouts for long-running operations

### Document Performance
- **Check budgets early** - Validate performance before processing large documents
- **Use progressive loading** - Load complex documents incrementally
- **Monitor nesting depth** - Deep nesting can cause performance issues
- **Estimate memory usage** - Plan operations based on document size

### Configuration Management
- **Use appropriate targets** - Global for system-wide, Workspace for project-specific
- **Validate settings** - Ensure configuration values are reasonable
- **Provide user feedback** - Show when settings are updated
- **Handle setting errors** - Gracefully handle invalid configuration

## 🚨 Error Handling

### Performance Errors
```typescript
try {
  const performance = checkDocumentPerformance(document);

  if (!performance.withinBudget) {
    // Handle performance issues
    if (performance.warnings.some(w => w.includes('nodes'))) {
      // Too many nodes - suggest optimization
      vscode.window.showWarningMessage(
        'Document has many nodes. Consider breaking into smaller documents.'
      );
    }
  }
} catch (error) {
  console.error('Performance check failed:', error);
}
```

### Monitoring Errors
```typescript
const monitor = PerformanceMonitor.getInstance();

try {
  monitor.startOperation('risky-operation');
  // ... operation ...
  const duration = monitor.endOperation('risky-operation');
} catch (error) {
  // Handle monitoring errors
  console.error('Performance monitoring error:', error);
  // Continue without monitoring
}
```

## 📚 Examples

### Complete Performance Monitoring Setup
```typescript
import {
  PerformanceMonitor,
  checkDocumentPerformance,
  PERFORMANCE_BUDGETS
} from '@paths-design/canvas-schema';
import * as vscode from 'vscode';

class PerformanceAwarePlugin {
  private monitor = PerformanceMonitor.getInstance();

  async processLargeDocument(document: CanvasDocument): Promise<void> {
    // Check performance budget before processing
    const config = vscode.workspace.getConfiguration('designer.performance');
    const enableMonitoring = config.get('enableBudgetMonitoring', true);

    if (enableMonitoring) {
      const performance = checkDocumentPerformance(document);

      if (!performance.withinBudget) {
        const proceed = await vscode.window.showWarningMessage(
          `Document may have performance issues: ${performance.warnings.join(', ')}. Continue?`,
          'Continue',
          'Cancel'
        );

        if (proceed !== 'Continue') {
          return;
        }
      }
    }

    // Start monitoring
    this.monitor.startOperation('large-document-processing');

    try {
      // Process in chunks to avoid memory issues
      const chunks = this.chunkDocument(document);

      for (const chunk of chunks) {
        await this.processChunk(chunk);
      }

    } finally {
      // Always end monitoring
      const duration = this.monitor.endOperation('large-document-processing');
      console.log(`Document processing took ${duration}ms`);
    }
  }

  private chunkDocument(doc: CanvasDocument): CanvasDocument[] {
    // Implementation for chunking large documents
    return [doc]; // Simplified for example
  }

  private async processChunk(chunk: CanvasDocument): Promise<void> {
    // Process chunk and monitor memory
    const memoryBefore = process.memoryUsage().heapUsed;
    // ... processing ...
    const memoryAfter = process.memoryUsage().heapUsed;
    const memoryUsed = memoryAfter - memoryBefore;

    this.monitor.recordMemoryUsage('chunk-processing', memoryUsed);
  }
}
```

## 🎯 API Reference

### PerformanceMonitor Class
- `getInstance(): PerformanceMonitor` - Get singleton instance
- `startOperation(operationId: string): void` - Start timing operation
- `endOperation(operationId: string): number` - End timing and return duration
- `recordMemoryUsage(operationId: string, bytes: number): void` - Record memory usage
- `exceedsMemoryBudget(bytes: number): boolean` - Check memory budget
- `exceedsTimeBudget(milliseconds: number): boolean` - Check time budget
- `getMetrics(): PerformanceMetrics` - Get current metrics
- `reset(): void` - Reset all metrics

### Performance Functions
- `checkDocumentPerformance(doc: CanvasDocument): PerformanceCheck` - Analyze document performance
- `validateDocumentWithPerformance(doc: unknown): PerformanceValidationResult` - Validate with performance

### Constants
- `PERFORMANCE_BUDGETS` - Performance budget constants

### Types
- `PerformanceCheck` - Document performance analysis result
- `PerformanceMetrics` - Operation timing and memory metrics
- `PerformanceValidationResult` - Validation result with performance data

---

*Performance optimization? → [MCP/Agent API](./mcp-agent.md)*
