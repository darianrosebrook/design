# BYODS Integration with VSCode Extension

This document outlines how the Bring Your Own Design System (BYODS) architecture integrates with our VSCode extension environment, including security considerations, package management, and UI coordination.

## Current VSCode Extension Architecture

### Extension Structure
```
packages/vscode-ext/
├── src/
│   ├── index.ts                 # Main extension activation
│   ├── canvas-webview/
│   │   ├── canvas-webview-provider.ts
│   │   └── selection-coordinator.ts
│   ├── properties-panel-webview.ts
│   └── welcome-view.ts
└── webviews/canvas/
    ├── components/
    │   ├── AppShell.tsx        # Main webview layout
    │   ├── CanvasArea.tsx      # Canvas rendering
    │   ├── PropertiesPanel.tsx # VSCode-specific properties panel
    │   └── library-section.tsx # Component library (needs BYODS integration)
    └── lib/
        ├── canvas-context.tsx  # Canvas state management
        └── types.ts           # VSCode-specific types
```

### Current Flow
1. **Extension Host**: Manages file system, commands, webviews
2. **Canvas Webview**: Renders design canvas in isolated context
3. **Properties Panel**: Separate webview for property editing
4. **File System**: Secure access via FileSystemService

## BYODS Integration Points

### 1. **Package Registry & CCD Management**

**Current**: Static component index loading
```typescript
// packages/vscode-ext/src/index.ts
private async loadComponentIndex(): Promise<void> {
  const componentIndex = JSON.parse(result.data!) as ComponentIndex;
  this.componentIndex = componentIndex;
  this.propertiesService.setComponentIndex(componentIndex);
}
```

**BYODS Enhancement**: Dynamic CCD registry
```typescript
// New BYODS service in extension host
class BYODSService {
  private ccdRegistry = new CCDRegistryImpl();
  private packageCache = new Map<string, string>();

  async installPackage(packageName: string): Promise<void> {
    // 1. Validate package security (allowlist)
    // 2. Download and cache package
    // 3. Extract CCDs using static analysis
    // 4. Register CCDs in registry
    // 5. Notify webviews of new components
  }

  async loadCCD(packageName: string, componentName: string): Promise<ComponentCapabilityDescriptor> {
    return this.ccdRegistry.get(componentName);
  }
}
```

### 2. **Webview Security & Sandboxing**

**Current**: Webviews run in isolated contexts
```typescript
// packages/vscode-ext/src/canvas-webview/canvas-webview-provider.ts
private getWebviewOptions(): vscode.WebviewOptions {
  return {
    enableScripts: true,
    localResourceRoots: [this.context.extensionUri],
    enableForms: true,
  };
}
```

**BYODS Enhancement**: Enhanced sandboxing for third-party components
```typescript
private getBYODSWebviewOptions(): vscode.WebviewOptions {
  return {
    enableScripts: true,
    localResourceRoots: [
      this.context.extensionUri,
      this.byodsService.getPackageCacheUri()
    ],
    // CSP for BYODS components
    contentSecurityPolicy: `
      default-src 'none';
      script-src 'unsafe-inline' ${this.getWebviewUri()};
      style-src 'unsafe-inline' ${this.getWebviewUri()};
      img-src ${this.getWebviewUri()} data:;
      connect-src 'none';  // Block network access
      frame-src 'none';    // Block iframes
    `,
  };
}
```

### 3. **Component Library Integration**

**Current**: Static component library
```typescript
// packages/vscode-ext/webviews/canvas/components/library-section.tsx
// Currently shows hardcoded components
```

**BYODS Enhancement**: Dynamic component browser
```typescript
function BYODSComponentLibrary() {
  const [availablePackages, setAvailablePackages] = useState<string[]>([]);
  const [installedCCDs, setInstalledCCDs] = useState<ComponentCapabilityDescriptor[]>([]);

  // Load available packages from registry
  useEffect(() => {
    vscode.postMessage({ type: 'getAvailablePackages' });
  }, []);

  // Install package handler
  const installPackage = async (packageName: string) => {
    await vscode.postMessage({
      type: 'installBYODSPackage',
      packageName
    });
  };

  // Drag CCD component to canvas
  const onDragStart = (ccd: ComponentCapabilityDescriptor) => {
    // Set drag data with CCD reference
    event.dataTransfer.setData('application/vnd.designer.ccd', JSON.stringify({
      package: ccd.package,
      component: ccd.component,
      ccd: ccd
    }));
  };
}
```

### 4. **Canvas Rendering with BYODS**

**Current**: Direct component rendering
```typescript
// packages/design-editor/ui/assemblies/CanvasArea/canvas-area.tsx
const renderObject = (obj: CanvasObject) => {
  switch (obj.type) {
    case "rectangle": return <div>...</div>;
    case "component": return <ComponentRenderer {...obj} />;
  }
};
```

**BYODS Enhancement**: CCD-aware rendering
```typescript
const renderBYODSComponent = (ccd: ComponentCapabilityDescriptor, props: any) => {
  // 1. Check CCD safety settings
  if (ccd.safety?.effects === 'forbid-network') {
    // Strip network-related props
  }

  // 2. Load component bundle from cache
  const ComponentBundle = await loadComponentBundle(ccd);

  // 3. Wrap with CCD-defined providers
  return (
    <BYODSSandbox ccd={ccd}>
      {ccd.providers?.map(provider => (
        <ProviderWrapper provider={provider}>
          <ComponentBundle {...props} />
        </ProviderWrapper>
      )) || <ComponentBundle {...props} />}
    </BYODSSandbox>
  );
};
```

### 5. **Properties Panel BYODS Integration**

**Current**: VSCode-specific properties panel
```typescript
// packages/vscode-ext/webviews/canvas/components/properties-panel.tsx
// Hardcoded sections and manual property rendering
```

**BYODS Enhancement**: CCD-driven properties
```typescript
function BYODSPropertiesPanel() {
  const [selectedCCD, setSelectedCCD] = useState<ComponentCapabilityDescriptor | null>(null);

  // When component selected, load its CCD
  useEffect(() => {
    if (selectedComponent?.ccd) {
      vscode.postMessage({
        type: 'loadCCD',
        componentId: selectedComponent.id
      });
    }
  }, [selectedComponent]);

  // Render CCD-generated sections
  return selectedCCD ? (
    <CCDPropertySections ccd={selectedCCD} />
  ) : (
    <LegacyPropertiesPanel />
  );
}
```

## Security & Safety Architecture

### 1. **Package Validation Pipeline**
```typescript
class PackageValidator {
  // Validate package before installation
  async validate(packageName: string): Promise<ValidationResult> {
    // 1. Check against allowlist
    // 2. Scan for malicious code patterns
    // 3. Analyze dependencies for vulnerabilities
    // 4. Verify CCD generation is safe
  }
}
```

### 2. **Runtime Sandboxing**
```typescript
class BYODSSandbox extends React.Component<{
  ccd: ComponentCapabilityDescriptor,
  children: React.ReactNode
}> {
  private shadowRoot: ShadowRoot;

  componentDidMount() {
    this.shadowRoot = this.container.attachShadow({ mode: 'open' });

    // Inject CCD-defined stylesheets
    if (this.props.ccd.theming?.tokens) {
      this.injectThemeTokens();
    }

    // Setup portal interception for dialogs/modals
    this.interceptPortals();
  }

  private interceptPortals() {
    // Intercept createPortal calls and render in canvas overlay
  }
}
```

### 3. **Network & Side Effect Blocking**
```typescript
// Webview CSP headers
const csp = `
  default-src 'none';
  script-src 'unsafe-inline' ${webviewUri} ${byodsBundleUri};
  style-src 'unsafe-inline' ${webviewUri};
  img-src ${webviewUri} data:;
  connect-src 'none';  // Block fetch/XMLHttpRequest
  frame-src 'none';    // Block iframes
  object-src 'none';   // Block embeds/plugins
`;

// Runtime effect blocking
class EffectInterceptor {
  static intercept() {
    // Block fetch, WebSocket, timers based on CCD safety settings
    window.fetch = () => Promise.reject(new Error('Network access disabled'));
    window.WebSocket = () => { throw new Error('WebSocket disabled'); };
  }
}
```

## Package Management Flow

### 1. **Package Discovery & Installation**
```bash
# VSCode command palette
> Designer: Install Design System Package

# User selects from curated list or enters npm package
# Extension validates and installs package
# Generates CCDs for components
# Updates component library
```

### 2. **CCD Caching & Distribution**
```typescript
// CCDs cached in extension storage
interface CCDCache {
  [packageName: string]: {
    version: string;
    ccds: ComponentCapabilityDescriptor[];
    bundleUri: string; // Cached component bundle
  };
}

// Distributed to webviews as needed
vscode.postMessage({
  type: 'updateCCDCache',
  cache: ccdCache
});
```

### 3. **Version Management**
```typescript
class PackageVersionManager {
  // Handle package updates and CCD regeneration
  async updatePackage(packageName: string): Promise<void> {
    // Check for updates
    // Re-analyze for CCD changes
    // Update cache and notify webviews
  }
}
```

## UI Coordination

### 1. **Component Library Panel**
```
┌─ Component Library ──────────────────┐
│ 📦 Installed Packages                 │
│ ├─ @radix-ui/react-button           │
│ │ ├─ Button (✓ CCD)                 │
│ │ └─ ButtonIcon (⚠️ No CCD)         │
│ ├─ @shadcn/ui                      │
│ │ ├─ Button                        │
│ │ ├─ Input                         │
│ │ └─ Card                          │
│ └─ + Install Package...             │
└─────────────────────────────────────┘
```

### 2. **Properties Panel with CCD**
```
┌─ Properties ────────────────────────┐
│ Button (@radix-ui/react-button)     │
│ ┌─ Properties ──────────────────┐   │
│ │ Variant: [solid ▼]             │   │
│ │ Size: [md ▼]                   │   │
│ │ Disabled: [☐]                  │   │
│ └─────────────────────────────────┘   │
│ ┌─ Events ────────────────────────┐   │
│ │ onClick: [Event Logger]         │   │
│ └─────────────────────────────────┘   │
│ ┌─ Theming ───────────────────────┐   │
│ │ color.primary → --btn-bg       │   │
│ │ color.text → --btn-fg          │   │
│ └─────────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 3. **Canvas with BYODS Components**
```
┌─ Canvas ────────────────────────────┐
│ ┌─ ShadowRoot (@radix-ui/themes) ─┐ │
│ │ ┌─ Button (Radix) ─────────────┐ │ │
│ │ │ [Click me]                   │ │ │
│ │ └──────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
│ ┌─ ShadowRoot (@shadcn/ui) ────────┐ │
│ │ ┌─ Card (Shadcn) ──────────────┐ │ │
│ │ │ ┌─ Title ──────────────────┐ │ │ │
│ │ │ │ Hello World              │ │ │ │
│ │ │ └─────────────────────────┘ │ │ │
│ │ └─────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

## Implementation Roadmap

### Phase 1: Infrastructure (Current Work)
- ✅ CCD type definitions
- ✅ CCD Registry implementation
- ✅ Property panel integration
- 🔄 Component library integration

### Phase 2: Package Management
- 📋 Package validation and installation
- 📋 CCD generation from npm packages
- 📋 VSCode command integration

### Phase 3: Runtime Sandboxing
- 📋 ShadowRoot component isolation
- 📋 Portal interception for overlays
- 📋 CSP implementation

### Phase 4: UI Polish
- 📋 Component browser interface
- 📋 CCD-driven property editors
- 📋 Drag & drop from library to canvas

### Phase 5: Advanced Features
- 📋 Hot reloading of updated packages
- 📋 Version conflict resolution
- 📋 Performance monitoring and optimization

## Key Technical Challenges

1. **VSCode Webview Limitations**: No direct npm access, CSP restrictions
2. **Bundle Size**: Large design system packages in webview context
3. **Security**: Preventing malicious code execution
4. **Performance**: Loading and caching large component bundles
5. **Version Management**: Handling package updates and compatibility

## Success Metrics

- **Security**: Zero successful malicious package installations
- **Performance**: Component loading < 500ms average
- **Compatibility**: 95% of popular design systems supported
- **Developer Experience**: 80% reduction in manual component configuration

This BYODS integration will transform our VSCode extension from a basic canvas editor into a universal design system development environment, allowing designers and developers to use any React component library seamlessly within the design workflow.
