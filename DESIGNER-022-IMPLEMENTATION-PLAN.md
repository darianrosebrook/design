# DESIGNER-022 Canvas Refactor - Implementation Plan

**Author**: @darianrosebrook  
**Date**: January 2025  
**Status**: 🚀 Implementation Ready

## Overview

This document outlines the complete implementation plan for DESIGNER-022, which refactors the canvas system into a unified, performant architecture that meets all acceptance criteria and non-functional requirements.

## Current State Analysis

### ✅ Existing Foundation
- VS Code extension with webview provider (`packages/vscode-ext/`)
- Basic React webview with message protocol
- Zod validation for all messages
- ESBuild configuration for bundling
- Document store and selection coordination
- Canvas schema and type definitions

### ❌ Missing Critical Components
- **Unified Canvas Host**: Single webview with renderer + properties + interactions
- **Real Canvas Rendering**: Currently just placeholder HTML
- **Pan/Zoom System**: Document-space coordinate system with world transform
- **Dirty Region Rendering**: Performance optimization for large documents
- **Hit Testing**: Accurate selection and interaction
- **Performance Monitoring**: Memory usage, FPS tracking, bundle size limits

## Architecture Design

### Unified Canvas Host Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension Host                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            CanvasWebviewProvider                    │   │
│  │  • Document loading & persistence                  │   │
│  │  • Selection coordination                          │   │
│  │  • Message validation (Zod)                        │   │
│  │  • Performance monitoring                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                             │
│                              │ Message Protocol             │
│                              │ (Validated, Typed)          │
│                              ▼                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Unified Canvas Webview                │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │              Canvas Shell                    │   │   │
│  │  │  • Top Navigation Bar                        │   │   │
│  │  │  • Left Panel (Layers)                      │   │   │
│  │  │  • Center Canvas Area                        │   │   │
│  │  │  • Right Panel (Properties)                  │   │   │
│  │  │  • Bottom Action Bar                         │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │            Canvas Renderer                  │   │   │
│  │  │  • Document-space coordinates               │   │   │
│  │  │  • Pan/zoom with world transform           │   │   │
│  │  │  • HiDPI scaling                           │   │   │
│  │  │  • Dirty region tracking                  │   │   │
│  │  │  • Hit testing (R-tree)                   │   │   │
│  │  │  • 60fps rendering                         │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │         Interaction Layer                   │   │   │
│  │  │  • Mouse/touch events                      │   │   │
│  │  │  • Keyboard navigation                     │   │   │
│  │  │  • Selection modes (single/rect/lasso)     │   │   │
│  │  │  • Accessibility (ARIA, SR)                │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Single React Root**: One webview, one bundle, no `window.React` dependencies
2. **Document-Space Coordinates**: All positioning in document space, pan/zoom via world transform
3. **Immutable State**: Engine mutations are pure and deterministic
4. **Dirty Region Rendering**: Only re-render changed areas for performance
5. **CSP Compliance**: Strict Content Security Policy with nonce-based scripts
6. **Bundle Size Limits**: ≤ 2.5 MB gzipped (target 2.0 MB)

## Implementation Milestones

### M1: Shell + Pan/Zoom + Create/Select + Typed Bridge + Save
**Timeline**: 2-3 days  
**Goal**: Basic unified canvas with core functionality

#### Tasks:
1. **Unified Canvas Shell**
   - Refactor `webviews/canvas/index.tsx` into proper shell layout
   - Implement top navigation, left panel, canvas area, right panel, action bar
   - Add proper CSS layout with resizable panels

2. **Real Canvas Rendering**
   - Replace placeholder HTML with actual `<canvas>` element
   - Implement basic 2D context rendering
   - Add document-space coordinate system
   - Implement pan/zoom with world transform matrix

3. **Pan/Zoom System**
   - Mouse wheel zoom with center point
   - Pan with mouse drag
   - Zoom fit functionality
   - HiDPI display support

4. **Node Creation & Selection**
   - Double-click to create nodes
   - Click to select nodes
   - Visual selection indicators
   - Basic node types (rectangle, text, frame)

5. **Typed Message Bridge**
   - Enhance existing message protocol
   - Add canvas-specific messages (zoom, pan, create, select)
   - Ensure all messages are validated with Zod

6. **Document Save/Load**
   - Integrate with existing DocumentStore
   - Implement save on changes
   - Handle document persistence

#### Acceptance Criteria:
- [ ] A1: Unified canvas shell visible in <1000ms
- [ ] A2: Basic rendering works with simple documents
- [ ] A3: Node selection updates properties panel
- [ ] A6: Document save/load works correctly

### M2: Lasso/Rect Selection, Dirty Tracking, Properties Integration
**Timeline**: 2-3 days  
**Goal**: Advanced selection and performance optimization

#### Tasks:
1. **Advanced Selection Modes**
   - Rectangle selection with drag
   - Lasso selection with freeform drawing
   - Multi-select with Ctrl/Cmd
   - Selection mode switching

2. **Dirty Region Tracking**
   - Track which nodes have changed
   - Only re-render dirty regions
   - Implement dirty region batching
   - Performance monitoring

3. **Properties Panel Integration**
   - Real-time property updates
   - Property validation
   - Undo/redo for property changes
   - Property change notifications

4. **Performance Optimizations**
   - Object pooling for nodes
   - Efficient rendering loops
   - Memory usage monitoring
   - FPS tracking and display

#### Acceptance Criteria:
- [ ] A4: Property changes update state immutably
- [ ] A7: Message validation works correctly
- [ ] A8: Keyboard navigation works
- [ ] A10: Memory usage stays stable

### M3: Performance Hardening, R-tree Hit Test, A11y Polish
**Timeline**: 2-3 days  
**Goal**: Production-ready performance and accessibility

#### Tasks:
1. **R-tree Hit Testing**
   - Implement spatial indexing for nodes
   - Fast hit testing for large documents
   - Efficient selection queries
   - Performance benchmarks

2. **Memory Pooling**
   - Object pools for frequently created objects
   - Garbage collection optimization
   - Memory leak prevention
   - Long session stability (8h+)

3. **Accessibility Polish**
   - ARIA labels and roles
   - Keyboard navigation
   - Screen reader announcements
   - High contrast support
   - Focus management

4. **Bundle Optimization**
   - Tree shaking and dead code elimination
   - Bundle size monitoring
   - Source map optimization
   - Deterministic builds

#### Acceptance Criteria:
- [ ] A2: 500 nodes render in <150ms, maintain 60fps
- [ ] A5: HiDPI rendering is crisp and accurate
- [ ] A9: Bundle size ≤ 2.5 MB gzipped
- [ ] A10: 8-hour memory stability

## Technical Implementation Details

### 1. Unified Canvas Shell

**File**: `packages/vscode-ext/webviews/canvas/index.tsx`

```typescript
interface CanvasShellProps {
  document: CanvasDocumentType | null;
  selection: SelectionState;
  onSelectionChange: (selection: SelectionState) => void;
  onPropertyChange: (event: PropertyChangeEvent) => void;
}

const CanvasShell: React.FC<CanvasShellProps> = ({
  document,
  selection,
  onSelectionChange,
  onPropertyChange,
}) => {
  return (
    <div className="canvas-shell">
      <TopNavigation document={document} />
      <div className="canvas-layout">
        <LeftPanel 
          document={document}
          selection={selection}
          onSelectionChange={onSelectionChange}
        />
        <CanvasArea
          document={document}
          selection={selection}
          onSelectionChange={onSelectionChange}
        />
        <RightPanel
          selection={selection}
          onPropertyChange={onPropertyChange}
        />
      </div>
      <ActionBar />
    </div>
  );
};
```

### 2. Canvas Renderer

**File**: `packages/vscode-ext/webviews/canvas/renderer/CanvasRenderer.ts`

```typescript
interface CanvasRenderer {
  // Core rendering
  render(document: CanvasDocumentType): void;
  updateNodes(nodeIds: string[], updates: Partial<NodeType>[]): void;
  
  // Viewport management
  setViewport(viewport: Viewport): void;
  panTo(x: number, y: number): void;
  zoomTo(scale: number, center?: Point): void;
  
  // Selection and interaction
  hitTest(point: Point): HitTestResult | null;
  setSelection(nodeIds: string[]): void;
  
  // Performance
  getDirtyRegions(): Rectangle[];
  getFPS(): number;
  getMemoryUsage(): number;
}
```

### 3. Message Protocol Enhancement

**File**: `packages/vscode-ext/src/protocol/messages.ts`

```typescript
// Add canvas-specific messages
export const CanvasZoomMessage = MessageEnvelope.extend({
  type: z.literal("canvasZoom"),
  payload: z.object({
    scale: z.number(),
    center: z.object({ x: z.number(), y: z.number() }).optional(),
  }),
});

export const CanvasPanMessage = MessageEnvelope.extend({
  type: z.literal("canvasPan"),
  payload: z.object({
    deltaX: z.number(),
    deltaY: z.number(),
  }),
});

export const CanvasCreateNodeMessage = MessageEnvelope.extend({
  type: z.literal("canvasCreateNode"),
  payload: z.object({
    type: z.string(),
    position: z.object({ x: z.number(), y: z.number() }),
    properties: z.record(z.unknown()),
  }),
});
```

### 4. Performance Monitoring

**File**: `packages/vscode-ext/webviews/canvas/performance/PerformanceMonitor.ts`

```typescript
class PerformanceMonitor {
  private fps: number = 0;
  private memoryUsage: number = 0;
  private dirtyRegions: Rectangle[] = [];
  
  startFrame(): void;
  endFrame(): void;
  recordDirtyRegion(region: Rectangle): void;
  getMetrics(): PerformanceMetrics;
  checkBudget(): BudgetStatus;
}
```

## File Structure

```
packages/vscode-ext/
├── webviews/
│   └── canvas/
│       ├── index.tsx                 # Main shell component
│       ├── components/
│       │   ├── TopNavigation.tsx
│       │   ├── LeftPanel.tsx
│       │   ├── CanvasArea.tsx
│       │   ├── RightPanel.tsx
│       │   └── ActionBar.tsx
│       ├── renderer/
│       │   ├── CanvasRenderer.ts
│       │   ├── ViewportManager.ts
│       │   ├── HitTester.ts
│       │   └── DirtyTracker.ts
│       ├── interaction/
│       │   ├── MouseHandler.ts
│       │   ├── KeyboardHandler.ts
│       │   └── TouchHandler.ts
│       ├── performance/
│       │   ├── PerformanceMonitor.ts
│       │   ├── MemoryPool.ts
│       │   └── RTree.ts
│       └── styles/
│           └── canvas.css
├── src/
│   ├── canvas-webview/
│   │   ├── canvas-webview-provider.ts
│   │   └── selection-coordinator.ts
│   └── protocol/
│       └── messages.ts
└── esbuild.config.js
```

## Testing Strategy

### Unit Tests
- Canvas renderer functionality
- Message protocol validation
- Performance monitoring
- Hit testing accuracy

### Integration Tests
- End-to-end canvas workflows
- Document save/load cycles
- Selection coordination
- Property updates

### Performance Tests
- Large document rendering (500+ nodes)
- Memory usage over time
- Bundle size validation
- FPS under load

## Rollback Strategy

1. **Feature Flag**: `designer.canvas.unified` gates the new UI
2. **Fallback**: Properties-only panel if disabled
3. **Document Preservation**: All document state preserved
4. **VSIX Revert**: Documented rollback path

## Success Metrics

### Performance Targets
- **Activation**: <1000ms (M1), <800ms (M2)
- **Initial Render**: <150ms (M1), <100ms (M2)
- **Frame Rate**: 60fps p95 during pan/zoom
- **Memory**: <100MB @ 1000 nodes (M1), <70MB (M2)
- **Bundle Size**: ≤2.5MB gzipped (target 2.0MB)

### Quality Targets
- **Accessibility**: Full keyboard navigation, SR support
- **Security**: CSP compliance, message validation
- **Reliability**: 8-hour memory stability
- **Usability**: Intuitive pan/zoom, smooth interactions

## Next Steps

1. **Start M1 Implementation**: Begin with unified canvas shell
2. **Set up Performance Monitoring**: Implement metrics collection
3. **Create Test Documents**: Generate test data for validation
4. **Establish CI/CD**: Automated testing and bundle size validation

This implementation plan provides a clear roadmap for delivering DESIGNER-022 with all acceptance criteria met and performance targets achieved.
