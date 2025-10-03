# Component System API

API for creating, managing, and using reusable visual components in Designer.

## 📋 Overview

The Component System API provides:

- **Component Definition**: Create reusable component definitions from canvas nodes
- **Component Libraries**: Manage collections of reusable components
- **Component Instances**: Create instances of components with property overrides
- **Property Management**: Define and customize component properties
- **Component Validation**: Ensure component definitions are valid and complete

## 🚀 Quick Start

```typescript
import {
  createComponentFromNode,
  createComponentInstance,
  createEmptyComponentLibrary,
  validateComponentLibrary
} from '@paths-design/canvas-schema';

// Create component from canvas node
const component = createComponentFromNode(
  canvasNode,
  'Button',
  'A reusable button component',
  'ui',
  ['interactive', 'form']
);

// Create component library
const library = createEmptyComponentLibrary('My Components');

// Validate library
const validation = validateComponentLibrary(library);
console.log('Library valid:', validation.success);
```

## 🧩 Component Definition

### Creating Components
```typescript
import { createComponentFromNode, ComponentDefinition } from '@paths-design/canvas-schema';

// Create component from existing canvas node
const sourceNode: FrameNode = {
  id: 'source-button',
  type: 'frame',
  name: 'Button',
  frame: { x: 0, y: 0, width: 120, height: 40 },
  style: { fills: [{ type: 'solid', color: '#007acc' }] },
  children: [/* button content */]
};

const component: ComponentDefinition = createComponentFromNode(
  sourceNode,
  'Button',
  'A reusable button component',
  'ui', // category
  ['interactive', 'form'] // tags
);

console.log('Component ID:', component.id);
console.log('Available properties:', Object.keys(component.properties));
```

### Component Properties
```typescript
// Component properties are automatically extracted from source nodes
const component = createComponentFromNode(textNode, 'Text Component');

// Properties include:
// - text: string (from text node content)
// - layout: object (from frame layout)
// - style properties: fills, strokes, etc.

// Access properties
const textProp = component.properties.text;
console.log('Text property:', {
  type: textProp.type,           // 'string'
  defaultValue: textProp.defaultValue, // Original text
  required: textProp.required,   // true for text content
  description: textProp.description // 'Text content'
});
```

### Component Metadata
```typescript
interface ComponentDefinition {
  id: string;              // Unique ULID
  name: string;            // Human-readable name
  description?: string;    // Optional description
  category?: string;       // Organizational category
  tags: string[];          // Searchable tags
  version: string;         // Component version
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
  rootNode: Node;          // Visual representation
  properties: Record<string, ComponentProperty>;
}

interface ComponentProperty {
  type: string;            // 'string', 'number', 'boolean', 'object', etc.
  defaultValue: any;       // Default value for the property
  description?: string;    // Human-readable description
  required: boolean;       // Whether property is required
}
```

## 📚 Component Libraries

### Creating Libraries
```typescript
import { createEmptyComponentLibrary, ComponentLibrary } from '@paths-design/canvas-schema';

// Create empty library
const library: ComponentLibrary = createEmptyComponentLibrary('Design System');

// Library structure
console.log('Library:', {
  id: library.id,
  name: library.name,
  version: library.version,
  componentCount: library.components.length,
  createdAt: library.createdAt
});
```

### Library Validation
```typescript
import { validateComponentLibrary } from '@paths-design/canvas-schema';

const validation = validateComponentLibrary(library);

if (validation.success) {
  console.log('Library is valid');
  // Use validation.data for type-safe access
} else {
  console.error('Library validation errors:', validation.errors);
}
```

### Library Management
```typescript
// Add component to library
library.components.push(component);
library.updatedAt = new Date().toISOString();

// Save library to file
const libraryJson = JSON.stringify(library, null, 2);
await vscode.workspace.fs.writeFile(
  vscode.Uri.file('design/components.json'),
  Buffer.from(libraryJson, 'utf8')
);

// Load library from file
const content = await vscode.workspace.fs.readFile(uri);
const loadedLibrary = JSON.parse(content.toString());
const validation = validateComponentLibrary(loadedLibrary);
```

## 🎨 Component Instances

### Creating Instances
```typescript
import { createComponentInstance } from '@paths-design/canvas-schema';

// Create instance with default properties
const instance = createComponentInstance(
  component,
  { x: 100, y: 100, width: 120, height: 40 }
);

// Instance structure
console.log('Component instance:', {
  id: instance.id,
  type: instance.type,        // 'component'
  componentKey: instance.componentKey, // References component definition
  frame: instance.frame,      // Position and size
  props: instance.props       // Property overrides
});
```

### Property Overrides
```typescript
// Create instance with custom properties
const customInstance = createComponentInstance(
  component,
  { x: 200, y: 200, width: 150, height: 50 },
  {
    text: 'Custom Button Text',
    variant: 'primary',
    size: 'large'
  }
);

// Property overrides are stored in props
console.log('Custom properties:', customInstance.props);
```

### Instance Validation
```typescript
// Component instances are validated as regular nodes
import { validateDocument } from '@paths-design/canvas-schema';

const documentWithInstance: CanvasDocument = {
  schemaVersion: "0.1.0",
  id: generateULID(),
  name: "Document with Components",
  artboards: [{
    id: generateULID(),
    name: "Main",
    frame: { x: 0, y: 0, width: 1920, height: 1080 },
    children: [customInstance]
  }]
};

const validation = validateDocument(documentWithInstance);
console.log('Document with component valid:', validation.success);
```

## 🔧 Advanced Usage

### Custom Property Types
```typescript
// Define component with custom property types
const advancedComponent = createComponentFromNode(sourceNode, 'Card');

// Manually add custom properties
advancedComponent.properties.customColor = {
  type: 'color',
  defaultValue: '#ffffff',
  description: 'Background color',
  required: false
};

advancedComponent.properties.animation = {
  type: 'select',
  defaultValue: 'none',
  description: 'Animation type',
  required: false
};
```

### Component Versioning
```typescript
// Update component version when making changes
component.version = '2.0.0';
component.updatedAt = new Date().toISOString();

// Create new version of component
const updatedComponent = {
  ...component,
  id: generateULID(), // New ID for new version
  version: '2.0.0',
  createdAt: new Date().toISOString()
};

// Keep old version for backward compatibility
library.components.push(updatedComponent);
```

### Component Categories and Tags
```typescript
// Organize components with categories and tags
const uiComponents = library.components.filter(c => c.category === 'ui');
const formComponents = library.components.filter(c => c.tags.includes('form'));
const interactiveComponents = library.components.filter(c =>
  c.tags.includes('interactive')
);

// Search components
function findComponentsByTag(library: ComponentLibrary, tag: string) {
  return library.components.filter(c => c.tags.includes(tag));
}

const buttons = findComponentsByTag(library, 'button');
const inputs = findComponentsByTag(library, 'input');
```

## 📋 Best Practices

### Component Design
- **Keep components focused** - Single responsibility principle
- **Extract meaningful properties** - Only expose properties that should be customizable
- **Provide good defaults** - Make components usable out of the box
- **Include comprehensive descriptions** - Help users understand component purpose

### Library Organization
- **Use consistent categories** - Group related components together
- **Apply relevant tags** - Make components discoverable
- **Version components** - Track changes and maintain compatibility
- **Validate libraries** - Ensure all components are valid

### Instance Management
- **Use semantic keys** - For stable component identification
- **Override selectively** - Only override properties that need customization
- **Validate instances** - Ensure component instances are valid nodes
- **Handle property dependencies** - Some properties may depend on others

## 🚨 Error Handling

### Component Creation Errors
```typescript
try {
  const component = createComponentFromNode(node, 'My Component');
} catch (error) {
  if (error.message.includes('Invalid node type')) {
    console.error('Cannot create component from this node type');
  } else {
    console.error('Component creation failed:', error.message);
  }
}
```

### Library Validation Errors
```typescript
const validation = validateComponentLibrary(library);

if (!validation.success) {
  validation.errors?.forEach(error => {
    console.error(`Library error: ${error}`);
  });

  // Fix common issues
  if (validation.errors?.some(e => e.includes('missing id'))) {
    library.id = generateULID();
  }
}
```

### Instance Creation Errors
```typescript
try {
  const instance = createComponentInstance(component, position, overrides);
} catch (error) {
  if (error.message.includes('Invalid position')) {
    console.error('Component position is invalid');
  } else if (error.message.includes('Invalid property')) {
    console.error('Property override is not valid for this component');
  } else {
    console.error('Instance creation failed:', error.message);
  }
}
```

## 📚 Examples

### Complete Component Workflow
```typescript
import {
  createEmptyComponentLibrary,
  createComponentFromNode,
  createComponentInstance,
  validateComponentLibrary
} from '@paths-design/canvas-schema';

// 1. Create component library
const library = createEmptyComponentLibrary('Design System');

// 2. Create components from canvas nodes
const buttonNode = findNodeByName(document, 'Primary Button');
const inputNode = findNodeByName(document, 'Text Input');

const buttonComponent = createComponentFromNode(
  buttonNode,
  'Button',
  'Primary action button',
  'ui',
  ['interactive', 'primary']
);

const inputComponent = createComponentFromNode(
  inputNode,
  'Input',
  'Text input field',
  'forms',
  ['input', 'form']
);

// 3. Add components to library
library.components.push(buttonComponent, inputComponent);
library.updatedAt = new Date().toISOString();

// 4. Validate library
const validation = validateComponentLibrary(library);
if (validation.success) {
  console.log('Library created successfully');
} else {
  console.error('Library validation failed');
}

// 5. Use components in documents
const buttonInstance = createComponentInstance(
  buttonComponent,
  { x: 100, y: 100, width: 120, height: 40 },
  { text: 'Submit' }
);

const inputInstance = createComponentInstance(
  inputComponent,
  { x: 100, y: 160, width: 200, height: 32 },
  { placeholder: 'Enter your name' }
);
```

### Component Property Extraction
```typescript
// Components automatically extract properties from source nodes
const textNode: TextNode = {
  type: 'text',
  text: 'Hello World',
  textStyle: { size: 16, family: 'Inter' }
};

// Creates component with 'text' property
const textComponent = createComponentFromNode(textNode, 'Text');

// Properties available:
// textComponent.properties.text -> { type: 'string', defaultValue: 'Hello World', ... }

const frameNode: FrameNode = {
  type: 'frame',
  layout: { direction: 'vertical', gap: 16 }
};

// Creates component with 'layout' property
const frameComponent = createComponentFromNode(frameNode, 'Container');
// Properties available:
// frameComponent.properties.layout -> { type: 'object', defaultValue: { direction: 'vertical', gap: 16 }, ... }
```

## 🎯 API Reference

### Core Functions
- `createEmptyComponentLibrary(name: string): ComponentLibrary` - Create new library
- `createComponentFromNode(node: Node, name: string, description?: string, category?: string, tags?: string[]): ComponentDefinition` - Create component from node
- `createComponentInstance(definition: ComponentDefinition, position: Rect, overrides?: Record<string, any>): ComponentInstanceNode` - Create component instance
- `validateComponentLibrary(library: unknown): ValidationResult<ComponentLibrary>` - Validate library

### Types
- `ComponentDefinition` - Component definition interface
- `ComponentLibrary` - Component library interface
- `ComponentProperty` - Component property definition
- `ComponentInstanceNode` - Component instance node type

### Utility Functions
- `generateULID(): string` - Generate unique IDs for components
- `canonicalizeDocument(obj: any): string` - Serialize with consistent formatting

---

*Component development? → [Performance Monitoring API](./performance.md)*
