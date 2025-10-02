# Paths.Design - Design-in-IDE Tool

> A minimal, local-only design canvas that lives in your repo, renders in VS Code/Cursor, and round-trips to code via deterministic generation.

## Documentation Structure

This project specification has been organized into focused documents for better navigation:

### **[Overview](./docs/overview.md)**
- Project objectives and non-goals
- Core invariants and repo layout
- Roadmap and acceptance criteria

### **[Data Model](./docs/data-model.md)**
- Complete JSON Schema specification
- Node types and properties
- Example documents and merge strategies

### **[Design Tokens](./docs/tokens.md)**
- Token structure and reflection system
- CSS variable generation
- Failure modes and verification checks

### **[Code Generation](./docs/codegen.md)**
- Component mapping specifications
- Deterministic code generation
- Testing and CI gates

### **[VS Code Extension](./docs/vscode-extension.md)**
- Extension architecture and webview
- MCP integration for Cursor
- SVG import capabilities

### ⚛️ **[React-in-Canvas](./docs/react-canvas.md)**
- Advanced React component preview
- Design-time runtime and sandboxing
- Component contracts and round-tripping

### **[Monorepo Implementation](./docs/monorepo.md)**
- Complete package structure
- Implementation examples
- Quickstart and verification steps

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Generate demo component from example design
pnpm run generate

# Start token watcher (writes CSS variables)
pnpm run watch:tokens

# In VS Code: F5 to run extension, then Cmd+Shift+P → "Open Designer"
```

## 🎯 What We're Building

Designer is a **design-in-IDE** tool that brings visual design capabilities directly into your development workflow. Unlike traditional design tools that live in separate applications, Designer integrates seamlessly with your existing code repository and development environment.

### 🏗️ Core Philosophy

**"Design lives with code, not separate from it"**

- **📁 Repo-native**: Design files (`design/`) live alongside your source code
- **🔄 Deterministic**: Same design input → identical code output, every time
- **🌐 Local-only**: No network required, works completely offline
- **🎯 IDE-integrated**: Native VS Code webview and Cursor MCP support
- **📊 Git-friendly**: Stable IDs, canonical JSON, and merge-aware diff strategies

### 🚀 Why This Matters

Traditional design tools create a **separation** between design and development:
- Designs live in proprietary formats (`.fig`, `.sketch`, `.xd`)
- Design-to-code handoff requires manual translation
- Design changes often break existing implementations
- No direct feedback loop between code changes and design updates

Designer **bridges this gap** by making design a first-class citizen in your development workflow.

### 🧩 Development Workflow

#### For Designers
1. **Create**: Design in VS Code webview with familiar tools (frames, text, styling)
2. **Style**: Use design tokens for consistent theming across components
3. **Generate**: One-click conversion to production-ready React components
4. **Iterate**: Edit designs, regenerate code, see changes instantly in your app

#### For Developers
1. **Import**: Generated components work immediately in your existing React app
2. **Customize**: Edit generated code while preserving design intent and relationships
3. **Maintain**: Design tokens keep styling in sync across all components
4. **Scale**: Component library grows naturally with your design system

#### For Teams
1. **Collaborate**: Design files in Git with meaningful, reviewable diffs
2. **Review**: Visual diff tools show design changes clearly in PRs
3. **Hand-off**: No more "implement this design" tickets - code generates automatically
4. **Consistency**: Shared tokens ensure design system compliance across the team

### 🎯 Implementation Priorities

#### **Phase 1: Foundation** (Current)
- ✅ **Schema & Validation**: Complete JSON Schema with TypeScript definitions
- ✅ **Basic Rendering**: Frame and text nodes in VS Code webview
- ✅ **Token System**: Design tokens → CSS variables reflection
- ✅ **Code Generation**: Deterministic React + CSS Modules output
- 🔄 **Extension Framework**: VS Code extension with webview integration

#### **Phase 2: Enhanced Workflow** (Next)
- **JSON Patch**: Efficient incremental updates for smooth webview performance
- **SVG Import**: Paste SVG graphics and auto-convert to vector nodes
- **Component Library**: Visual component palette with drag-and-drop insertion
- **Live Preview**: Real-time React component rendering in design canvas
- **Enhanced MCP**: Deeper Cursor integration with bidirectional sync

#### **Phase 3: Advanced Features** (Future)
- **CRDT Collaboration**: Optional real-time multi-user editing sessions
- **Visual Diff**: PR integration showing before/after design comparisons
- **Framework Adapters**: Vue, Svelte, Solid.js code generation
- **Plugin System**: Custom renderers and code generators for specialized needs
- **Asset Management**: Image optimization and delivery pipeline integration

## 🏗️ Architecture Overview

### Design Documents
JSON files that describe a complete design scene with:
- **Artboards**: Canvas pages with viewport dimensions
- **Nodes**: Frames, text, vectors, images, and component instances
- **Styles**: Token-aware styling with fills, strokes, shadows
- **Layout**: Flexbox and absolute positioning

### Design Tokens
Structured color, typography, and spacing values that:
- **Reflect to CSS**: Automatically generate `:root` variables
- **Round-trip**: Code changes update design preview instantly
- **Version**: Schema-validated with migration support

### Code Generation
Declarative mapping from design nodes to React components:
- **Deterministic**: Same input → identical output bytes
- **Extensible**: Plugin architecture for different frameworks
- **Testable**: Snapshot tests ensure output consistency

## v0.1 Scope

**Working**:
- Basic frame and text node rendering in VS Code webview
- Deterministic React + CSS Modules code generation
- Token reflection to CSS variables
- Schema validation and canonical JSON formatting

**v0.2 Roadmap**:
- JSON Patch for efficient webview updates
- SVG import and vector node support
- Enhanced Cursor MCP integration

## 🏗️ Development Methodology

### CAWS (Coding Agent Workflow System)

Drawing from the proven patterns of the [Animate project](https://github.com/darianrosebrook/animate), Designer follows the **CAWS** engineering methodology:

#### **Core Principles**
- **🎯 Plan First**: Every feature begins with a working specification (YAML) defining scope, risks, and acceptance criteria
- **🔒 Contract-First**: APIs and schemas defined before implementation with comprehensive test coverage
- **🧪 Test-Driven**: Property-based testing with deterministic fixtures and chaos engineering
- **📊 Risk Tiering**: Features classified by impact (Tier 1: core engine, Tier 2: features, Tier 3: UI/quality)

#### **Quality Gates**
- **70% mutation score** for Tier 1 features (core rendering, data models)
- **Contract tests** must pass before implementation begins
- **Golden frame testing** for visual output validation
- **Accessibility compliance** (WCAG 2.1 AA) from day one

#### **Working Spec Structure**
```yaml
id: DESIGNER-001
title: "Advanced Canvas Selection System"
risk_tier: 2
scope:
  in: ["canvas hit detection", "multi-select", "bounding box"]
  out: ["advanced editing tools", "plugin APIs"]
invariants:
  - "Canvas selections maintain 60fps responsiveness"
  - "Multi-select preserves layer hierarchy"
acceptance:
  - "User can drag-select multiple nodes"
  - "Selection state syncs between canvas and panel"
non_functional:
  perf: { canvas_interaction_ms: 16 }
  a11y: ["keyboard navigation", "screen reader support"]
```

### Milestone-Based Development

Following Animator's proven approach, Designer uses structured milestones:

#### **✅ Completed: Milestone 1 - Core Infrastructure**
- **Duration**: 7-12 days
- **Focus**: Development environment, build system, core architecture
- **Deliverables**: TypeScript + React setup, production build pipeline, 100% test coverage

#### **✅ Completed: Milestone 2 - Data Model Foundation**
- **Duration**: 13-18 days
- **Focus**: JSON Schema, node types, property system
- **Deliverables**: Immutable scene graph, validation, canonical serialization

#### **🚧 Current: Milestone 3 - Basic Rendering**
- **Duration**: 17-22 days
- **Focus**: VS Code webview, 2D canvas rendering, text/shapes
- **Deliverables**: Interactive canvas, basic node rendering, hit detection

#### **📋 Planned Milestones**
4. **Component System** - React component preview and prop editing
5. **Code Generation** - Deterministic React/CSS output
6. **Advanced Features** - SVG import, multi-select, transform tools
7. **Collaboration** - Optional CRDT support for multi-user editing

## 🧪 Quality Standards

### Testing Strategy
- **Property-based testing** with fast-check for schema invariants
- **Golden frame validation** for visual output consistency
- **Cross-platform rendering** tests across different GPUs/browsers
- **Performance budgets** with real-time monitoring (60fps target)

### Architecture Principles
- **Immutable data structures** with structural sharing for performance
- **Deterministic evaluation** - same inputs = identical outputs
- **Modular design** with clear separation of concerns
- **Security sandboxing** for all user inputs and expressions

### Documentation Discipline
- **Working specifications** for every feature with risk assessment
- **Contract documentation** (OpenAPI) for all public APIs
- **Migration guides** for breaking changes with rollback strategies
- **Non-functional specifications** (A11y, perf, security) for every component

## 🚀 What We're Building

Designer brings **professional design tools into the IDE**, solving the disconnect between design and development:

### **🎨 Visual Design in Code**
- **Canvas-based editing** with familiar design tool interactions
- **Live preview** of React components with prop manipulation
- **Design tokens** that sync between design and implementation
- **Code generation** that produces production-ready React/CSS

### **🔄 Seamless Workflow**
- **Repo-native artifacts** - design files live alongside code
- **Deterministic round-trip** - design ↔ code transformations are predictable
- **Merge-friendly** - stable IDs and canonical serialization for Git
- **IDE-integrated** - works within VS Code/Cursor without context switching

### **🏢 Production Ready**
- **Enterprise-grade** - security, performance, and accessibility first
- **Extensible** - plugin architecture for custom component libraries
- **Collaborative** - optional real-time editing with conflict resolution
- **Standards compliant** - follows WCAG, supports design systems

## Key Documents

- **[📋 Overview](./docs/overview.md)** - Project vision and scope
- **[🔧 Data Model](./docs/data-model.md)** - Complete schema and examples
- **[📦 Implementation](./docs/monorepo.md)** - Ready-to-run code examples

## Contributing

This is a working specification for a design tool. The implementation follows strict determinism and testing requirements:

- **No `any` types** in public APIs
- **Snapshot tests** for all code generation
- **Property-based testing** for schema invariants
- **A11y checks** for color contrast and focus management

---

*Built with the same discipline as [Animate](https://github.com/darianrosebrook/animate) - deterministic, testable, and architecture-first.*
