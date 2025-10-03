# @paths-design/design-system

Design system components and primitives for the Designer application, built following the layered component methodology.

## Overview

This design system implements the **four-layer component architecture** outlined in the [Component Standards](docs/component-standards):

- **Primitives**: Basic building blocks (Button, Input, etc.)
- **Compounds**: Grouped primitives with shared behavior (TextField)
- **Composers**: State orchestration and context management (PropertiesPanel)
- **Assemblies**: Application-specific flows (full page layouts)

## Architecture Philosophy

### The Four Layers

#### 1. Primitives (Ground Floor)
Irreducible building blocks that encode standards into the system.

```tsx
import { Button } from '@paths-design/design-system';

<Button variant="primary" onClick={handleClick}>
  Save Changes
</Button>
```

**Characteristics**:
- Stable, accessible, and consistent
- Single responsibility (clickable element)
- Token-driven styling
- Comprehensive prop interface

#### 2. Compounds (Conventions)
Bundle primitives into predictable, reusable groupings.

```tsx
import { TextField } from '@paths-design/design-system';

<TextField
  label="Email Address"
  type="email"
  value={email}
  onChange={setEmail}
  helperText="We'll never share your email"
  required
/>
```

**Characteristics**:
- Codify conventions and reduce decision-making
- Safe variations and predictable behavior
- Clear composition boundaries

#### 3. Composers (Orchestration)
Orchestrate state, interaction, and context across multiple children.

```tsx
import { PropertiesPanel } from '@paths-design/design-system';

<PropertiesPanel
  selection={currentSelection}
  onPropertyChange={handlePropertyChange}
/>
```

**Characteristics**:
- State orchestration and context management
- Slot-based composition patterns
- Complex interaction handling

#### 4. Assemblies (Application Flows)
Application-specific flows encoded as components.

```tsx
// Full page layouts, wizards, dashboards
<DesignEditor>
  <CanvasArea />
  <PropertiesPanel />
  <Toolbar />
</DesignEditor>
```

## Design Tokens

The system uses a comprehensive token system for consistent theming:

```json
{
  "color": {
    "background": { "primary": "#0B0B0B", "secondary": "#111317" },
    "text": { "primary": "#E6E6E6", "secondary": "#A3A3A3" },
    "interactive": { "primary": "#4F46E5", "primaryHover": "#4338CA" }
  },
  "space": { "xs": 4, "sm": 8, "md": 12, "lg": 16 },
  "type": { "family": { "sans": "Inter, sans-serif" } },
  "radius": { "none": 0, "sm": 4, "md": 6, "lg": 8 }
}
```

## Component Library

### Primitives

#### Button
```tsx
<Button
  variant="primary"     // primary | secondary | destructive
  size="md"            // sm | md | lg
  disabled={false}
  onClick={handleClick}
>
  Click me
</Button>
```

#### Input
```tsx
<Input
  type="text"
  value={value}
  onChange={setValue}
  placeholder="Enter text..."
  disabled={false}
/>
```

### Compounds

#### TextField
```tsx
<TextField
  label="Full Name"
  type="text"
  value={name}
  onChange={setName}
  helperText="Enter your full name"
  error={errors.name}
  required
/>
```

### Composers

#### PropertiesPanel
```tsx
<PropertiesPanel
  selection={currentSelection}
  onPropertyChange={handlePropertyChange}
/>
```

## Usage Guidelines

### When to Use Each Layer

**Use Primitives When**:
- You need a basic building block
- The component has a single, clear purpose
- You want maximum reusability

**Use Compounds When**:
- You need to combine related primitives
- There's a common pattern that should be standardized
- You want to reduce repeated decision-making

**Use Composers When**:
- You need to orchestrate multiple components
- There's complex state or context to manage
- The component handles user flows or interactions

**Use Assemblies When**:
- You're building application-specific layouts
- The component represents a complete user journey
- It combines multiple composers and compounds

### Composition Patterns

#### Slotting & Substitution
```tsx
// Allow replacing sub-components
<Modal>
  <Modal.Header>
    <Modal.Title>Custom Title</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <CustomContent />
  </Modal.Body>
</Modal>
```

#### Headless Abstractions
```tsx
// Separate logic from presentation
const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  // ... modal logic
  return { isOpen, open, close };
};

const Modal = ({ children, isOpen, ...props }) => {
  return isOpen ? <div {...props}>{children}</div> : null;
};
```

#### Contextual Orchestration
```tsx
// Provide context to children
<FieldContext.Provider value={{ error, touched }}>
  <Field>
    <Input />
    <Field.Error />
  </Field>
</FieldContext.Provider>
```

## Development

### Adding New Components

1. **Determine the Layer**:
   - Is it a basic building block? → Primitive
   - Does it combine related elements? → Compound
   - Does it orchestrate complex interactions? → Composer
   - Is it application-specific? → Assembly

2. **Follow the Standards**:
   - Use design tokens for all styling
   - Implement proper accessibility
   - Add comprehensive TypeScript types
   - Write tests for all functionality

3. **Document Thoroughly**:
   - Add JSDoc comments
   - Include usage examples
   - Document all props and variants

### Testing Strategy

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Test Coverage Requirements**:
- Primitives: 90%+ coverage
- Compounds: 85%+ coverage
- Composers: 80%+ coverage
- Assemblies: 70%+ coverage

### Performance Requirements

- **Render Time**: <100ms for complex components
- **Bundle Size**: Keep primitives lightweight
- **Memory Usage**: No leaks in long-running components
- **Accessibility**: WCAG 2.1 AA compliance

## Migration from Legacy Components

If you're migrating from the original properties panel implementation:

1. **Identify the Layer**: Most UI components are either compounds or composers
2. **Extract Primitives**: Break down complex components into reusable parts
3. **Use Design Tokens**: Replace hardcoded values with token references
4. **Add Accessibility**: Ensure all interactive elements are accessible
5. **Write Tests**: Comprehensive test coverage for reliability

## Standards Compliance

All components in this system must:

- ✅ Use design tokens for all styling
- ✅ Implement proper accessibility (ARIA, keyboard navigation)
- ✅ Have comprehensive TypeScript types
- ✅ Follow the layered component methodology
- ✅ Include thorough documentation
- ✅ Have test coverage meeting minimum requirements
- ✅ Support dark/light theme switching
- ✅ Be responsive and work on different screen sizes

## Contributing

1. **Follow Existing Patterns**: Use the established component structure
2. **Add Tests**: Every component needs comprehensive tests
3. **Document Thoroughly**: Include examples and API documentation
4. **Review Process**: All components go through design and code review
5. **Performance**: Ensure components meet performance requirements

This design system provides the foundation for consistent, accessible, and maintainable UI components throughout the Designer application.
