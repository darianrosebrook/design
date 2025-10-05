# Canvas Dev API

Similar to Figma's global `figma` object, our canvas exposes a development API to the browser window for debugging and testing.

## Access

In development mode, the API is automatically available at `window.canvas`:

```javascript
// Check if API is available
console.log(window.canvas);

// Log current canvas state
window.canvas.logState();

// Get objects
const objects = window.canvas.getObjects();

// Select a tool
window.canvas.selectTool(window.canvas.tools.RECTANGLE);

// Create and add a test object
const testObj = window.canvas.createTestObject("rectangle");
window.canvas.addObject(testObj);

// Zoom controls
window.canvas.zoomIn();
window.canvas.zoomOut();
window.canvas.zoomTo100();

// Selection
window.canvas.selectAll();
window.canvas.clearSelection();
```

## Current Methods (Mock Implementation)

### State Getters
- `getObjects()` - Get all canvas objects
- `getSelectedId()` - Get currently selected object ID
- `getSelectedIds()` - Get all selected object IDs
- `getActiveTool()` - Get current active tool
- `getZoom()` - Get current zoom level
- `getViewport()` - Get viewport position {x, y}
- `getCursor()` - Get cursor position {x, y}

### State Setters
- `setObjects(objects)` - Replace all objects
- `setSelectedId(id)` - Select a specific object
- `setSelectedIds(ids)` - Set multiple selections
- `setActiveTool(tool)` - Change active tool
- `setZoom(zoom)` - Set zoom level
- `setViewport(x, y)` - Set viewport position

### Utilities
- `selectAll()` - Select all objects
- `clearSelection()` - Clear all selections
- `zoomIn()` / `zoomOut()` / `zoomToFit()` / `zoomTo100()` - Zoom controls

### Object Manipulation
- `addObject(object)` - Add a new object to canvas
- `updateObject(id, updates)` - Update an existing object
- `deleteObject(id)` - Delete an object
- `duplicateObject(id)` - Duplicate an object
- `bringForward(id)` / `sendBackward(id)` - Change object layering

### Development Tools
- `logState()` - Log current canvas state to console
- `createTestObject(type?)` - Create a test object for development

### Constants
- `tools` - Available tools (SELECT, HAND, SCALE, FRAME, TEXT, IMAGE, RECTANGLE, ELLIPSE, LINE, POLYGON)
- `backgrounds` - Available backgrounds (SOLID, DOT_GRID, SQUARE_GRID)

---

## Future API Surface (Post-Integration)

Once integrated with the design API ecosystem, these additional methods will be available:

### Document Management
- `getDocument()` - Get current CanvasDocument
- `saveDocument()` - Save document with validation
- `loadDocument(id)` - Load document by ID
- `createDocument(name)` - Create new document

### Node Operations (Engine-Based)
- `createNode(parentPath, nodeData)` - Create node using canvas-engine
- `updateNode(nodeId, updates)` - Update node with patches
- `deleteNode(nodeId)` - Delete node with undo support
- `moveNode(nodeId, newParentPath)` - Move node in hierarchy

### Advanced Operations
- `findNode(nodeId)` - Find node with path information
- `getNodeAtPoint(x, y)` - Hit testing using canvas-engine

### Undo/Redo System
- `undo()` - Undo last operation
- `redo()` - Redo last operation
- `canUndo` / `canRedo` - Check availability

### Component System
- `getComponents()` - Get available component library
- `createComponentInstance(componentId, position)` - Create component instance

### Collaboration (Future)
- `getCollaborators()` - Get active collaborators
- `sendMessage(message)` - Send chat message

## Example Usage

### Current API (Mock)

```javascript
// Create a rectangle and add it to canvas
const rect = window.canvas.createTestObject("rectangle");
window.canvas.addObject(rect);

// Switch to rectangle tool
window.canvas.selectTool(window.canvas.tools.RECTANGLE);

// Select all objects
window.canvas.selectAll();

// Zoom to fit
window.canvas.zoomToFit();

// Check current state
window.canvas.logState();
```

### Future API (Post-Integration)

```javascript
// Document management
const doc = window.canvas.getDocument();
await window.canvas.saveDocument();

// Node operations with canvas-engine
await window.canvas.createNode(['artboards', 0, 'children'], {
  type: 'frame',
  name: 'New Frame',
  frame: { x: 100, y: 100, width: 200, height: 200 }
});

// Advanced operations
const node = window.canvas.findNode('some-node-id');
const hitNode = window.canvas.getNodeAtPoint(150, 200);

// Undo/Redo
if (window.canvas.canUndo) {
  window.canvas.undo();
}

// Component system
const components = window.canvas.getComponents();
await window.canvas.createComponentInstance('button-component', { x: 50, y: 50 });
```

## Notes

- Only available in development mode (`NODE_ENV === "development"`)
- Automatically exposed to `window.canvas` when canvas loads
- Safe for production builds (completely disabled)
- Useful for debugging, testing, and rapid prototyping
