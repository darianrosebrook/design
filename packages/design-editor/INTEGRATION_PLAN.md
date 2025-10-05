# Design Editor Integration Plan

## Overview

The `design-editor` package was originally built as a mock playground for testing the interface. Now we need to integrate it with the broader design API ecosystem to create a fully functional design tool.

## Current Architecture vs Target Architecture

### Current (Mock)
- **Data Model**: Custom `CanvasObject` types in `lib/types.ts`
- **Operations**: In-memory state management in `lib/canvas-context.tsx`
- **Rendering**: Custom React components in `components/`
- **Persistence**: None (in-memory only)
- **Collaboration**: None
- **Component Discovery**: None

### Target (Integrated)
- **Data Model**: `CanvasDocument` & `Node` types from `@paths-design/canvas-schema`
- **Operations**: `canvas-engine` operations (CRUD, patches, hit-testing)
- **Rendering**: `canvas-renderer-dom` for DOM-based rendering
- **Persistence**: Document save/load with schema validation
- **Collaboration**: `websocket-server` for real-time sync
- **Component Discovery**: `component-indexer` for design system integration

## Integration Roadmap

### Phase 1: Data Model Migration

#### 1.1 Replace CanvasObject with Node Types
```typescript
// BEFORE (lib/types.ts)
export interface CanvasObject {
  id: string;
  type: 'rectangle' | 'text' | 'frame';
  x: number;
  y: number;
  width: number;
  height: number;
  // ... custom properties
}

// AFTER (imports from @paths-design/canvas-schema)
import { NodeType, CanvasDocumentType } from '@paths-design/canvas-schema';
```

#### 1.2 Update Canvas Context
```typescript
// BEFORE (lib/canvas-context.tsx)
interface CanvasContextType {
  objects: CanvasObject[];
  // ...
}

// AFTER
interface CanvasContextType {
  document: CanvasDocumentType;
  operations: {
    createNode: (parentPath: NodePath, nodeData: Partial<NodeType>) => Promise<void>;
    updateNode: (nodeId: string, updates: Partial<NodeType>) => Promise<void>;
    deleteNode: (nodeId: string) => Promise<void>;
    moveNode: (nodeId: string, newParentPath: NodePath) => Promise<void>;
  };
  // ...
}
```

#### 1.3 Add Document Management
```typescript
interface CanvasContextType {
  // ... existing
  document: CanvasDocumentType;
  saveDocument: () => Promise<void>;
  loadDocument: (documentId: string) => Promise<void>;
  createNewDocument: (name: string) => Promise<void>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}
```

### Phase 2: Operation Engine Integration

#### 2.1 Replace Direct State Mutations
```typescript
// BEFORE (direct state updates)
const updateObject = (id: string, updates: Partial<CanvasObject>) => {
  setObjects(prev => prev.map(obj =>
    obj.id === id ? { ...obj, ...updates } : obj
  ));
};

// AFTER (engine operations)
import { updateNode } from '@paths-design/canvas-engine';

const updateObject = async (id: string, updates: Partial<NodeType>) => {
  const result = await updateNode(document, id, updates);
  if (result.success) {
    setDocument(result.data.document);
    // Apply patches for undo/redo
    applyPatches(result.data.patches);
  }
};
```

#### 2.2 Add Patch-Based Undo/Redo
```typescript
const [patches, setPatches] = useState<DocumentPatch[]>([]);
const [currentPatchIndex, setCurrentPatchIndex] = useState(-1);

const applyPatches = (newPatches: DocumentPatch[]) => {
  setPatches(prev => [...prev.slice(0, currentPatchIndex + 1), ...newPatches]);
  setCurrentPatchIndex(prev => prev + newPatches.length);
};

const undo = () => {
  if (currentPatchIndex >= 0) {
    const reversePatch = patches[currentPatchIndex];
    // Apply reverse operation
    setCurrentPatchIndex(prev => prev - 1);
  }
};
```

### Phase 3: Renderer Integration

#### 3.1 Replace Custom Components with DOM Renderer
```typescript
// BEFORE (custom React components)
import { RectangleComponent } from './components/RectangleComponent';
import { TextComponent } from './components/TextComponent';

// AFTER (DOM renderer)
import { CanvasDOMRenderer } from '@paths-design/canvas-renderer-dom';

const CanvasArea = () => {
  const { document } = useCanvas();

  return (
    <CanvasDOMRenderer
      document={document}
      onNodeSelect={(nodeId) => setSelectedId(nodeId)}
      onNodeUpdate={(nodeId, updates) => updateObject(nodeId, updates)}
      selection={selectedId}
      zoom={zoom}
      viewport={{ x: viewportX, y: viewportY }}
    />
  );
};
```

#### 3.2 Update Component Props
The `CanvasDOMRenderer` will handle:
- Node rendering based on type
- Selection states
- Hit testing
- Event handling
- Zoom and pan transformations

### Phase 4: Properties Panel Integration

#### 4.1 Replace Custom Property Editors
```typescript
// BEFORE (custom property panels)
import { PropertiesPanel } from './components/PropertiesPanel';

// AFTER (integrated properties panel)
import { PropertiesPanel } from '@paths-design/properties-panel';

<PropertiesPanel
  selectedNodes={selectedNodes}
  onPropertyChange={(nodeId, property, value) =>
    updateObject(nodeId, { [property]: value })
  }
  availableComponents={componentLibrary}
/>
```

#### 4.2 Connect to Design Tokens
```typescript
import { useDesignTokens } from '@paths-design/design-tokens';

const PropertiesPanelWrapper = () => {
  const { tokens, updateToken } = useDesignTokens();

  return (
    <PropertiesPanel
      designTokens={tokens}
      onTokenUpdate={updateToken}
      // ... other props
    />
  );
};
```

### Phase 5: Component Library Integration

#### 5.1 Add Component Discovery
```typescript
import { componentIndexer } from '@paths-design/component-indexer';

const useComponentLibrary = () => {
  const [components, setComponents] = useState<ComponentDefinition[]>([]);

  useEffect(() => {
    const loadComponents = async () => {
      const index = await componentIndexer.buildIndex('./src/components');
      setComponents(index.components);
    };
    loadComponents();
  }, []);

  return components;
};
```

#### 5.2 Component Drag & Drop
```typescript
const handleComponentDrop = async (componentId: string, position: Point) => {
  const component = components.find(c => c.id === componentId);
  if (component) {
    const instance = createComponentInstance(component, {
      x: position.x,
      y: position.y,
      width: component.rootNode.frame.width,
      height: component.rootNode.frame.height,
    });

    await createNode(document, ['artboards', 0, 'children'], instance);
  }
};
```

### Phase 6: Collaboration & Persistence

#### 6.1 WebSocket Integration
```typescript
import { useWebSocket } from '@paths-design/websocket-server';

const CollaborationProvider = ({ children }: { children: ReactNode }) => {
  const { document, sendOperation, onRemoteOperation } = useWebSocket();

  // Sync local operations to remote
  const handleLocalOperation = (operation: Operation) => {
    sendOperation(operation);
  };

  // Handle remote operations
  onRemoteOperation((operation) => {
    applyRemoteOperation(operation);
  });

  return <>{children}</>;
};
```

#### 6.2 Document Persistence
```typescript
const DocumentManager = {
  save: async (document: CanvasDocumentType) => {
    const validated = validateDocument(document);
    if (!validated.success) throw new Error('Invalid document');

    await fetch('/api/documents', {
      method: 'POST',
      body: JSON.stringify(validated.data),
    });
  },

  load: async (documentId: string): Promise<CanvasDocumentType> => {
    const response = await fetch(`/api/documents/${documentId}`);
    const doc = await response.json();
    const validated = validateDocument(doc);

    if (!validated.success) throw new Error('Invalid document');
    return validated.data;
  },
};
```

## API Surface for Design Editor

Once integrated, the design editor will expose these methods via the dev API:

### Document Management
- `canvas.getDocument()` - Get current document
- `canvas.saveDocument()` - Save to persistence
- `canvas.loadDocument(id)` - Load document
- `canvas.createDocument(name)` - Create new document

### Node Operations
- `canvas.createNode(parentPath, nodeData)` - Create new node
- `canvas.updateNode(nodeId, updates)` - Update existing node
- `canvas.deleteNode(nodeId)` - Delete node
- `canvas.moveNode(nodeId, newParentPath)` - Move node in hierarchy

### Selection & Navigation
- `canvas.selectNode(nodeId)` - Select specific node
- `canvas.selectAll()` - Select all nodes
- `canvas.clearSelection()` - Clear selection
- `canvas.findNode(nodeId)` - Find node by ID
- `canvas.getNodeAtPoint(x, y)` - Hit testing

### Viewport & Zoom
- `canvas.zoomToFit()` - Fit all content
- `canvas.zoomToSelection()` - Zoom to selected nodes
- `canvas.setZoom(level)` - Set zoom level
- `canvas.panTo(x, y)` - Pan viewport

### Undo/Redo
- `canvas.undo()` - Undo last operation
- `canvas.redo()` - Redo last operation
- `canvas.canUndo()` / `canvas.canRedo()` - Check availability

### Components
- `canvas.getComponents()` - Get available components
- `canvas.createComponentInstance(componentId, position)` - Create component instance

### Collaboration
- `canvas.getCollaborators()` - Get active collaborators
- `canvas.sendMessage(message)` - Send chat message

## Migration Steps

### Step 1: Type System Migration
1. Update imports to use `@paths-design/canvas-schema` types
2. Replace `CanvasObject` with `NodeType`
3. Update all component props and state

### Step 2: Context Refactor
1. Replace `CanvasProvider` with document-centric state
2. Add operation methods using `canvas-engine`
3. Implement patch-based undo/redo system

### Step 3: Renderer Swap
1. Remove custom React components for canvas objects
2. Integrate `CanvasDOMRenderer`
3. Update event handling to work with renderer

### Step 4: Properties Integration
1. Replace custom property panels with `@paths-design/properties-panel`
2. Connect to design tokens system
3. Add component property editing

### Step 5: Component System
1. Integrate `component-indexer` for discovery
2. Add drag-and-drop from component library
3. Implement component instance management

### Step 6: Persistence & Collaboration
1. Add document save/load with validation
2. Integrate WebSocket server for real-time sync
3. Add conflict resolution for collaborative editing

## Benefits of Integration

1. **Type Safety**: Full TypeScript coverage with Zod validation
2. **Performance**: Optimized operations with observability
3. **Scalability**: Handles large documents with performance budgets
4. **Collaboration**: Real-time multi-user editing
5. **Persistence**: Robust document storage with migration support
6. **Extensibility**: Plugin architecture for custom tools/features
7. **Consistency**: Unified data model across all tools

## Testing Strategy

- **Unit Tests**: Test individual operations and components
- **Integration Tests**: Test full editor workflows
- **Performance Tests**: Ensure operations meet performance budgets
- **Collaboration Tests**: Test multi-user scenarios
- **Migration Tests**: Ensure document compatibility across versions

This integration will transform the design editor from a mock playground into a fully-featured design tool that leverages the entire design API ecosystem.
