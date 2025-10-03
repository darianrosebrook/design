# @paths-design/properties-panel

Interactive properties panel for the Designer canvas editor.

## Overview

The Properties Panel provides a user-friendly interface for editing design element properties in the Designer VS Code extension. It supports real-time property editing with immediate visual feedback in the canvas.

## Features

- **🎯 Smart Property Display** - Shows only relevant properties for selected node types
- **⚡ Real-time Sync** - Changes reflect immediately in the canvas
- **📐 Layout Controls** - Position, size, rotation, alignment, and constraints
- **🎨 Appearance Controls** - Opacity, corner radius, styling options
- **📝 Typography Controls** - Font family, size, weight, line height, letter spacing
- **🔄 Mixed Selection Support** - Handles multiple selected elements gracefully
- **♿ Accessibility** - Full keyboard navigation and screen reader support
- **📱 Responsive Design** - Works on different screen sizes

## Architecture

### Core Components

- **PropertiesPanel** - Main container component
- **PropertySection** - Groups related properties (Layout, Appearance, etc.)
- **PropertyEditor** - Individual property input controls
- **PropertiesService** - State management and canvas communication
- **PropertyRegistry** - Property definitions and node type compatibility

### Data Flow

```
Canvas Selection → PropertiesService → PropertiesPanel → PropertyEditor → Canvas Update
```

## Usage

### Basic Integration

```tsx
import { PropertiesPanel } from '@paths-design/properties-panel';

function DesignerEditor() {
  const [selection, setSelection] = useState({ selectedNodeIds: [], focusedNodeId: null });

  return (
    <PropertiesPanel
      documentId="current-doc"
      selection={selection}
      onPropertyChange={(event) => {
        // Handle property changes
        console.log('Property changed:', event);
      }}
      onSelectionChange={setSelection}
    />
  );
}
```

### With Canvas Integration

```tsx
import { PropertiesService } from '@paths-design/properties-panel';
import type { CanvasDocumentType } from '@paths-design/canvas-schema';

function CanvasEditor() {
  const service = PropertiesService.getInstance();

  // Set canvas document
  useEffect(() => {
    service.setNodes(document.artboards.flatMap(artboard => artboard.children));
  }, [document]);

  // Handle selection changes from canvas
  useEffect(() => {
    service.setSelection(selection);
  }, [selection]);

  return (
    <PropertiesPanel
      selection={service.getSelection()}
      onPropertyChange={(event) => {
        // Property change will be handled by the service
        // Canvas will be updated automatically
      }}
    />
  );
}
```

## Property Sections

### Layout Section
- **Position**: X, Y coordinates
- **Size**: Width, height with aspect ratio constraints
- **Transform**: Rotation angle
- **Alignment**: Horizontal and vertical alignment within parent
- **Constraints**: Responsive behavior rules

### Appearance Section
- **Opacity**: Transparency level (0-1)
- **Corner Radius**: Rounded corner radius (frames and vectors)

### Text Section (Text Nodes Only)
- **Content**: Text content with multi-line support
- **Typography**: Font family, size, weight
- **Spacing**: Line height, letter spacing
- **Color**: Text color picker

## API Reference

### PropertiesService

Singleton service for managing properties panel state.

```typescript
class PropertiesService {
  static getInstance(): PropertiesService

  setNodes(nodes: NodeType[]): void
  setSelection(selection: SelectionState): void
  getNodeProperty(nodeId: string, propertyKey: string): PropertyValue | undefined
  setNodeProperty(nodeId: string, propertyKey: string, value: PropertyValue): boolean
  getMixedPropertyValue(propertyKey: string): PropertyValue | 'mixed'

  onPropertyChange(callback: PropertyChangeCallback): () => void
  onSelectionChange(callback: SelectionChangeCallback): () => void
}
```

### Property Types

```typescript
interface PropertyDefinition {
  key: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'rect' | 'color' | 'select' | 'multiselect'
  category: string
  description?: string
  min?: number
  max?: number
  step?: number
  precision?: number
  options?: Array<{ label: string; value: string }>
}

interface PropertySection {
  id: string
  label: string
  icon?: string
  properties: PropertyDefinition[]
  collapsible?: boolean
  defaultCollapsed?: boolean
}
```

## Testing

```bash
npm test          # Run all tests
npm run test:watch # Run tests in watch mode
```

The test suite covers:
- Property registry and node type compatibility
- Property utilities (get/set/validate/format)
- Properties service state management
- Integration workflows
- Error handling and edge cases

## Performance

- **Panel Render**: <100ms for typical selections
- **Property Sync**: <50ms round-trip to canvas
- **Memory Usage**: <20MB for typical usage
- **Responsive**: Handles 100+ properties without performance degradation

## Security

- Property values sanitized before display
- No arbitrary code execution from property data
- Respects workspace file boundaries
- Input validation prevents malicious data

## Development

### Adding New Property Types

1. Define the property in `PropertyRegistry`
2. Add compatibility rules for node types
3. Implement the property editor component
4. Add validation logic
5. Write tests

### Extending Property Sections

1. Create new section in `PropertyRegistry`
2. Define properties with appropriate types
3. Add section to component rendering
4. Update documentation

## VS Code Integration

The properties panel integrates with the VS Code extension via webview messaging:

- **Extension → Webview**: Document updates, selection changes
- **Webview → Extension**: Property changes, user interactions
- **Bidirectional**: Canvas and panel stay synchronized

## Browser Support

- Modern browsers with ES2020+ support
- CSS Grid and Flexbox support required
- Webview context in VS Code extension

## Contributing

1. Follow the existing code patterns
2. Add tests for new functionality
3. Update documentation
4. Ensure TypeScript compilation passes
5. Follow the CAWS specification process

## License

MIT - See LICENSE file for details.
