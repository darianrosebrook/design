# BYODS (Bring Your Own Design System) Integration

This document outlines how the BYODS architecture can be integrated with our existing designer system using Component Capability Descriptors (CCDs).

## Current System Overview

Our designer already has:
- **Component Discovery**: TypeScript AST analysis for component prop extraction
- **Pattern Manifests**: Complex UI pattern definitions with relationships
- **Properties Panel**: Dynamic property editor system
- **Canvas Rendering**: Safe component instantiation within Shadow DOM

## BYODS Integration Points

### 1. Enhanced Component Discovery (`packages/component-discovery/`)

**Current**: Basic prop extraction from TypeScript
**BYODS Enhancement**: CCD-aware discovery with semantic metadata

```typescript
// Enhanced component discovery result
export interface DiscoveredComponent {
  name: string;
  filePath: string;
  exportName: string;
  type: "react" | "vue" | "svelte" | "html";
  props: ComponentProp[];
  semanticKeys?: string[];
  usage: ComponentUsage;
  confidence: number;
  suggestions: string[];
  // BYODS addition
  ccd?: ComponentCapabilityDescriptor;
}
```

### 2. CCD Registry (`packages/properties-panel/src/property-registry.ts`)

**Purpose**: Central registry for managing third-party component metadata

```typescript
export class CCDRegistryImpl implements CCDRegistry {
  // Register CCDs from packages or source analysis
  register(ccd: ComponentCapabilityDescriptor): void

  // Generate property sections dynamically from CCDs
  generatePropertySections(ccd: ComponentCapabilityDescriptor): PropertySection[]

  // Load CCDs from npm packages
  loadFromPackage(packageName: string): Promise<ComponentCapabilityDescriptor[]>
}
```

### 3. Enhanced Properties Panel (`packages/design-editor/ui/assemblies/PropertiesPanel/`)

**Current**: Static property definitions
**BYODS Enhancement**: CCD-driven dynamic property generation

```tsx
// Properties panel with CCD support
export function PropertiesPanel() {
  const { ccdRegistry } = useCanvas();

  // For CCD-backed components, generate properties dynamically
  const sections = useMemo(() => {
    if (ccdRegistry && selectedComponent?.ccd) {
      return ccdRegistry.generatePropertySections(selectedComponent.ccd);
    }
    return PropertyRegistry.getSectionsForNodeType(nodeType);
  }, [selectedComponent, ccdRegistry]);
}
```

## Implementation Strategy

### Phase 1: CCD Infrastructure ✅

1. **CCD Type Definitions**: Added to `component-discovery` and `properties-panel`
2. **CCD Registry**: Basic implementation with property generation
3. **Type Extensions**: Enhanced existing interfaces for CCD compatibility

### Phase 2: Package Ingestion (Next)

```typescript
// CLI command for ingesting design system packages
pnpm pencil ingest @radix-ui/react-dialog

// 1. Resolve package with esbuild
// 2. Extract component metadata with react-docgen-typescript
// 3. Generate CCD JSON files
// 4. Validate against CCD schema
// 5. Register in CCD registry
```

### Phase 3: Sandboxed Rendering (Future)

**Current**: Canvas renders components directly
**BYODS Enhancement**: Isolated rendering environment

```typescript
// Sandboxed component renderer
export class BYODSSandbox {
  // Create ShadowRoot for component isolation
  renderComponent(ccd: ComponentCapabilityDescriptor, props: any) {
    // 1. Load component bundle in Web Worker
    // 2. Wrap with CCD-defined providers
    // 3. Render in ShadowRoot with CSP
    // 4. Intercept portals for canvas overlay
  }
}
```

### Phase 4: Code Generation (Future)

**Current**: Basic JSX emission
**BYODS Enhancement**: CCD-driven code generation

```typescript
// Enhanced code generator
export class BYODSCodeGenerator {
  generateComponentUsage(
    ccd: ComponentCapabilityDescriptor,
    props: Record<string, any>
  ): string {
    // Generate import statements
    // Apply CCD codegen rules
    // Emit JSX with proper attribute ordering
    // Handle controlled/uncontrolled patterns
  }
}
```

## Example: Radix Button Integration

### 1. CCD Definition (`demo-ccds/radix-button.json`)

```json
{
  "component": "Button",
  "package": "@radix-ui/react-slot",
  "props": [
    {
      "name": "variant",
      "kind": "enum",
      "values": ["solid", "ghost", "outline"],
      "defaultValue": "solid"
    },
    {
      "name": "size",
      "kind": "enum",
      "values": ["sm", "md", "lg"],
      "defaultValue": "md"
    }
  ],
  "providers": [
    {
      "import": { "specifier": "@radix-ui/themes", "namedExport": "Theme" },
      "props": { "appearance": "dark" }
    }
  ]
}
```

### 2. Auto-Generated Properties Panel

**From CCD → Property Sections**:
- **Properties**: variant (select), size (select), disabled (boolean)
- **Events**: onClick (event logger)
- **Theming**: color.primary, color.text, radius.default (advanced)

### 3. Canvas Rendering

```tsx
// Safe rendering with providers
<Theme appearance="dark">
  <Button variant="solid" size="md" disabled={false}>
    {children}
  </Button>
</Theme>
```

### 4. Code Emission

```tsx
import { Button } from "@/ui/Button";
import { Theme } from "@radix-ui/themes";

export default function MyComponent() {
  return (
    <Theme appearance="dark">
      <Button size="md" variant="solid">
        Click me
      </Button>
    </Theme>
  );
}
```

## Benefits for Our System

### 1. **Third-Party Component Support**
- **Radix UI**: Headless primitives with proper ARIA
- **shadcn/ui**: Tailwind-based components
- **Base Web**: Theme-provider heavy components
- **MUI**: Complex theming systems

### 2. **Enhanced Developer Experience**
- **Auto-generated Property Panels**: No manual property definitions
- **Type Safety**: CCDs provide runtime type information
- **Semantic Awareness**: ARIA roles and accessibility built-in
- **Theme Integration**: Automatic token binding

### 3. **Safety & Isolation**
- **Sandboxed Rendering**: Third-party components can't break the editor
- **CSP Compliance**: Network and timer restrictions
- **Portal Management**: Proper overlay handling

### 4. **Code Quality**
- **Deterministic Emission**: Consistent JSX output
- **Provider Orchestration**: Proper component wrapping
- **Import Optimization**: Only import what's needed

## Integration with Existing Features

### Pattern Manifests Synergy
```typescript
// CCDs can reference pattern manifests for complex interactions
interface ComponentCapabilityDescriptor {
  patterns?: string[]; // References to pattern manifest IDs
  relationships?: PatternRelationship[]; // From pattern manifests
}
```

### Component Discovery Enhancement
```typescript
// CCD-aware component discovery
const discovery = new ComponentDiscoveryEngine(ccdRegistry);
const result = await discovery.analyzeDocument(documentPath, sourcePaths);

// Results include CCD-backed component recommendations
```

### Properties Panel Evolution
```typescript
// Properties panel now supports both:
// 1. Static property definitions (current system)
// 2. CCD-generated properties (BYODS system)
const properties = ccdRegistry
  ? ccdRegistry.generatePropertySections(component.ccd)
  : PropertyRegistry.getSectionsForNodeType(nodeType);
```

## Next Steps

1. **Implement Package Ingestion CLI** (`pnpm pencil ingest`)
2. **Add Sandboxed Renderer** for third-party components
3. **Enhance Code Generator** with CCD rules
4. **Create CCD Schema Validator** and JSON Schema
5. **Add BYODS-specific UI** (package browser, CCD editor)
6. **Integrate with Existing Canvas** (ShadowRoot rendering, portal handling)

This BYODS architecture would make our designer a universal tool for any React design system, while maintaining the safety and developer experience we've built.
