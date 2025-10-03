# Semantic Patterns — Component Contracts & Semantic Keys (v1.0)

> **IMPLEMENTATION COMPLETE**: This document has been updated to reflect the actual implementation approach using **component contracts** and **semantic keys** rather than pure manifest-based patterns. The system enables deterministic, accessible UI generation through semantic key mapping and component contract definitions.

---

## 0. Principles (Updated for Implementation)

* **Semantic keys first.** Use stable semantic identifiers (`hero.title`, `cta.primary`) for node identification.
* **Component contracts over heuristics.** Component index defines the ground truth for semantic → component mapping.
* **Determinism.** Same IR → same JSX/HTML; attribute order canonicalized; semantic key stability.
* **Accessibility built-in.** Semantic HTML generation with ARIA support; WCAG validation during augmentation.
* **Bidirectional editing.** Design ↔ Dev synchronization through MCP tools and semantic key preservation.

**Implementation Learnings:**
- Component contracts proved more practical than pure manifest patterns for React ecosystems
- Semantic keys provide better stability than complex pattern matching
- Built-in accessibility validation during augmentation catches issues early
- MCP integration enables true collaborative design-dev workflows

---

## 1. Component Contract Shape (JSON) - **IMPLEMENTED**

**Updated for Component Contract Approach:**

```jsonc
{
  "$schema": "https://paths.design.dev/schemas/component-contract-1.0.json",
  "version": "1.0.0",
  "components": {
    "Button": {
      "id": "01JF2Q15H0C3YV2TE8EH8X7MTG",
      "name": "Button",
      "modulePath": "src/ui/Button.tsx",
      "export": "Button",
      "category": "ui",
      "tags": ["interactive", "form"],
      "semanticKeys": {
        "cta.primary": {
          "description": "Primary call-to-action button",
          "priority": 10,
          "propDefaults": {
            "variant": "primary",
            "size": "large"
          }
        },
        "cta.secondary": {
          "description": "Secondary call-to-action button",
          "priority": 9,
          "propDefaults": {
            "variant": "secondary",
            "size": "medium"
          }
        },
        "form.submit": {
          "description": "Form submission button",
          "priority": 8,
          "propDefaults": {
            "variant": "primary",
            "size": "medium",
            "type": "submit"
          }
        }
      },
      "props": [
        {
          "name": "variant",
          "type": "\"primary\" | \"secondary\" | \"danger\"",
          "required": false,
          "defaultValue": "primary",
          "description": "Visual style variant",
          "design": {
            "control": "select",
            "options": ["primary", "secondary", "danger"]
          },
          "passthrough": {
            "attributes": ["data-variant"],
            "cssVars": ["--button-variant"]
          }
        },
        {
          "name": "size",
          "type": "\"small\" | \"medium\" | \"large\"",
          "required": false,
          "defaultValue": "medium",
          "design": {
            "control": "select",
            "options": ["small", "medium", "large"]
          },
          "passthrough": {
            "attributes": ["data-size"],
            "cssVars": ["--button-size"]
          }
        },
        {
          "name": "disabled",
          "type": "boolean",
          "required": false,
          "defaultValue": false,
          "design": {
            "control": "boolean"
          },
          "passthrough": {
            "attributes": ["disabled", "aria-disabled"],
            "events": []
          }
        }
      ],
      "variants": [
        { "name": "primary" },
        { "name": "secondary" },
        { "name": "danger" }
      ],
      "examples": [
        "<Button variant=\"primary\" size=\"large\">Get Started</Button>",
        "<Button variant=\"secondary\" size=\"medium\" disabled>Disabled</Button>"
      ]
    }
  }
}
```

**Implementation Learnings:**

* **Component contracts** proved more practical than pure manifest patterns for React ecosystems
* **Semantic keys** provide the stable identification that was originally planned for manifests
* **Passthrough configuration** enables proper designer → engineer attribute mapping
* **Property-based testing** with fast-check validates contract integrity

---

## 2. Implemented Semantic Patterns (v1.0)

**Updated for Component Contract Implementation:**

### 2.1 Button Pattern (✅ IMPLEMENTED)

* **Semantic Keys**: `cta.primary`, `cta.secondary`, `form.submit`
* **Component Contract**: Maps to `Button` component with variant/size defaults
* **HTML Emission**: `<button>` with proper ARIA attributes
* **Accessibility**: Built-in focus management and ARIA support

**Example Usage:**
```json
{
  "type": "frame",
  "name": "Get Started Button",
  "semanticKey": "cta.primary",
  "frame": { "x": 32, "y": 120, "width": 200, "height": 48 }
}
```
→ Generates: `<Button variant="primary" size="large">Get Started</Button>`

### 2.2 Hero Section Pattern (✅ IMPLEMENTED)

* **Semantic Keys**: `hero.section`, `hero.title`, `hero.subtitle`
* **HTML Emission**: `<header>` + `<h1>` with semantic roles
* **Layout**: Flex-based responsive layout
* **Accessibility**: Proper heading hierarchy and landmark roles

### 2.3 Navigation Pattern (✅ IMPLEMENTED)

* **Semantic Keys**: `nav.container`, `nav.items[0]`, `nav.items[1]`
* **HTML Emission**: `<nav>` + `<a>` elements with proper ARIA
* **Keyboard**: Arrow key navigation support
* **Accessibility**: Navigation landmark and link roles

### 2.4 Form Patterns (✅ IMPLEMENTED)

* **Semantic Keys**: `form.input.field`, `form.input.label`, `form.submit`
* **HTML Emission**: `<input>` + `<label>` with proper associations
* **Accessibility**: Form labeling and validation states
* **Validation**: Required field indicators

### 2.5 Card Pattern (✅ IMPLEMENTED)

* **Semantic Keys**: `card.container`, `card.header`, `card.body`
* **HTML Emission**: `<article>` with semantic sections
* **Layout**: Flexible content organization
* **Accessibility**: Article landmark role

### 2.6 List Pattern (✅ IMPLEMENTED)

* **Semantic Keys**: `list.items[0]`, `list.container`
* **HTML Emission**: `<ul>` + `<li>` with proper semantics
* **Accessibility**: List/listitem roles

**Implementation Learnings:**
- **Component contracts** work better than pure manifest patterns for React ecosystems
- **Semantic keys** provide the stable identification originally planned for manifests
- **Built-in pattern inference** reduces need for complex manifest definitions
- **Accessibility validation** during augmentation catches issues early

---

## 3. Editor Guided Flow (Updated for Implementation)

1. **Choose Semantic Key** → Designer selects from available semantic patterns or creates custom keys.
2. **Component Mapping** → System maps semantic keys to appropriate React components with defaults.
3. **Property Configuration** → Designer sets component properties through semantic key-aware interface.
4. **Accessibility Review** → System validates WCAG compliance and semantic correctness.
5. **Code Generation** → Produces semantic HTML with proper ARIA attributes.

**Implementation Reality:**
- Semantic key selection is more intuitive than complex pattern matching
- Component contracts provide clear mapping from design intent to implementation
- Built-in validation catches accessibility issues during design, not after

---

## 4. Emission Rules (Component Contract Priority)

* **Component contracts first.** If a semantic key maps to a component contract, use it with prop defaults.
* **Semantic HTML fallback.** Generate appropriate semantic elements (`<button>`, `<nav>`, `<article>`) when no contract exists.
* **ARIA enhancement.** Add ARIA attributes for accessibility even when using semantic HTML.
* **Attribute canonicalization.** Maintain consistent attribute ordering for deterministic output.

**Implementation Benefits:**
- Component contracts provide explicit design → code mapping
- Semantic HTML generation reduces need for complex ARIA role assignments
- Built-in accessibility validation ensures WCAG compliance

---

## 5. Validation Matrix (Updated for Implementation)

| Pattern Category | Semantic Key Examples | Component Contract | HTML Emission | Accessibility Check |
| ---------------- | --------------------- | ------------------ | -------------- | ------------------- |
| Call-to-Action | `cta.primary`, `cta.secondary` | Button component | `<button>` with ARIA | Focus management, ARIA labels |
| Navigation | `nav.container`, `nav.items[0]` | Navigation component | `<nav>` + `<a>` | Landmark roles, link context |
| Hero Content | `hero.title`, `hero.subtitle` | Typography component | `<h1>` + `<p>` | Heading hierarchy |
| Form Elements | `form.input.field`, `form.submit` | Input/Button components | `<input>` + `<label>` | Form associations, validation states |
| Content Sections | `card.container`, `content.section` | Article/Card components | `<article>` + `<section>` | Landmark roles, semantic structure |

**Implementation Learnings:**
- Component contracts eliminate need for complex validation matrices
- Semantic key validation is simpler and more reliable than pattern matching
- Built-in accessibility validation during augmentation is more effective

---

## 6. Roadmap (Updated for Implementation)

* **v1.0: ✅ COMPLETE** - Semantic key system with component contracts and MCP integration
* **v1.1: Future** - Advanced pattern inference for complex UI patterns (Tabs, Dialogs, etc.)
* **v1.2: Future** - Enhanced component discovery and automatic contract generation
* **v1.3: Future** - Real-time collaborative editing with CRDT support
* **v2.0: Future** - Full pattern manifest system for complex multi-component patterns

---

## 7. Implementation Benefits

### **For Designers**
- **Natural Expression**: Semantic keys feel intuitive and stable
- **Component Contracts**: Clear mapping from design intent to implementation
- **Visual Feedback**: Real-time accessibility validation
- **Collaborative**: Work seamlessly with developers

### **For Developers**
- **Clear Specifications**: Component contracts provide explicit requirements
- **Semantic Mapping**: Understand design purpose through semantic keys
- **Automated Generation**: Consistent code from design specifications
- **Testing Support**: Systematic augmentation for comprehensive testing

### **For Both**
- **Bidirectional Sync**: Changes flow naturally between design and code
- **Semantic Diffs**: PRs show "moved hero.title" instead of array index changes
- **Accessibility Built-in**: WCAG validation during the entire process
- **Test Coverage**: Systematic augmentation for edge case coverage

---

## 8. Usage Examples

### **Basic Canvas Document with Semantic Keys**
```json
{
  "schemaVersion": "0.1.0",
  "name": "Landing Page",
  "artboards": [{
    "children": [
      {
        "type": "frame",
        "name": "Hero Section",
        "semanticKey": "hero.section",
        "children": [
          {
            "type": "text",
            "name": "Title",
            "semanticKey": "hero.title",
            "text": "Build Amazing Interfaces"
          },
          {
            "type": "frame",
            "name": "CTA Button",
            "semanticKey": "cta.primary"
          }
        ]
      }
    ]
  }]
}
```

### **Component Index with Semantic Mapping**
```json
{
  "Button": {
    "semanticKeys": {
      "cta.primary": {
        "description": "Primary call-to-action button",
        "propDefaults": { "variant": "primary", "size": "large" }
      }
    }
  }
}
```

### **Generated React Component**
```jsx
// Semantic key mapping in action
export default function HeroSection() {
  return (
    <header className="hero-section">
      <h1 className="hero-title">Build Amazing Interfaces</h1>
      <Button variant="primary" size="large">Get Started</Button>
    </header>
  );
}
```

---

## 9. Architecture Overview

```
🎨 Design Agent ←→ Canvas Document ←→ MCP Server ←→ Dev Agent
     ↓                    ↓                    ↓                    ↓
Semantic Keys ←→ Component ←→ Bidirectional ←→ React Components
     ↓         Contracts    Sync              ↓
     ↓                    ↓                    ↓                    ↓
Accessibility ←→ Code Generation ←→ Testing ←→ Validation
Validation      & Optimization    Variants
```

**Key Systems:**
- **Semantic Key System**: Stable node identification with dot notation
- **Component Contracts**: Design intent → React component mapping
- **Data Augmentation**: Systematic testing with layout/token/prop variations
- **Accessibility Validation**: WCAG compliance built into the pipeline
- **Diff Visualization**: Human-readable change tracking for PRs
- **Bidirectional MCP**: Collaborative design-dev workflows

---

## 10. Production Status

**✅ IMPLEMENTATION COMPLETE**

The semantic key system is now production-ready with:

- ✅ **Complete Integration**: All systems connected and working together
- ✅ **Comprehensive Testing**: Property-based testing with fast-check
- ✅ **Accessibility Compliance**: Built-in WCAG validation
- ✅ **Developer Tools**: VS Code extension and Cursor MCP integration
- ✅ **Documentation**: Complete examples and usage guides

**🚀 Ready for production use** with semantic key-based design documents, component contract mapping, VS Code extension integration, and Cursor MCP adapter for collaborative workflows.
* **Role**: `button` (native `<button type="button">`)
* **State**: `pressed`, `disabled`, `busy`
* **Keyboard**: `Enter`/`Space` activate.
* **Emission**: `<button>` preferred; React `@/ui/Button` optional.
* **APG**: [https://www.w3.org/WAI/ARIA/apg/patterns/button/](https://www.w3.org/WAI/ARIA/apg/patterns/button/)

```json
{
  "name":"Button","id":"pattern.button","nodes":{
    "button":{"role":"button","state":{"pressed":false,"disabled":false,"busy":false}}
  },
  "emission":{"native":[{"node":"button","element":"button","attrs":{"type":"button"}}]},
  "apg":"https://www.w3.org/WAI/ARIA/apg/patterns/button/"
}
```

---

### 2.2 Dialog / Modal

* **ID**: `pattern.dialog`
* **Nodes**: `trigger`, `dialog`, `backdrop`, `title`, `description`
* **Roles**: `dialog` or `alertdialog` (prefer native `<dialog>` with `aria-modal`)
* **Relationships**: `trigger → controls → dialog`; `dialog → labelledby → title`, `describedby → description`
* **Keyboard**: `Esc` close; focus trap; initial focus.
* **Emission**: `<dialog open>` + script hooks; or React `@/ui/Dialog`.
* **APG**: [https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

```json
{
  "name":"Dialog","id":"pattern.dialog",
  "nodes":{
    "trigger":{"role":"button"},
    "dialog":{"role":"dialog","state":{"modal":true}},
    "title":{"role":"heading","level":2},
    "description":{}
  },
  "relationships":[
    {"from":"trigger","to":"dialog","type":"controls","required":true},
    {"from":"dialog","to":"title","type":"labelledby","required":true},
    {"from":"dialog","to":"description","type":"describedby","required":false}
  ],
  "emission":{
    "native":[{"node":"dialog","element":"dialog","attrs":{"open":true}}],
    "react":{"componentMap":{"dialog":"@/ui/Dialog"}}
  },
  "apg":"https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/"
}
```

---

### 2.3 Popover / Tooltip

* **ID**: `pattern.popover`
* **Nodes**: `anchor`, `popover`
* **Roles**: `tooltip` (for tooltip), otherwise no role for transient popover if purely presentational; use `dialog` if interactive complex content.
* **Relationships**: `anchor → controls → popover`; `popover` labelled by anchor or explicit label.
* **Keyboard**: Escape to close; arrow key navigation optional.
* **Emission**: `<div role="tooltip">` for tooltip; `<dialog>` for interactive popover.
* **APG**: [https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)

---

### 2.4 Tabs

(See full manifest above.)

---

### 2.5 Combobox

* **ID**: `pattern.combobox`
* **Nodes**: `combobox` (textbox), `listbox`, `option*`, `label`
* **Roles**: `combobox`, `listbox`, `option`
* **Relationships**: `combobox → controls → listbox`; `option → selected`; `label → for → combobox`
* **Keyboard**: Arrow keys navigate; Enter selects; Esc closes.
* **Emission**: Native `<input type="text">` + ARIA roles; React `@/ui/Combobox` optional.
* **APG**: [https://www.w3.org/WAI/ARIA/apg/patterns/combobox/](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

```json
{
  "name":"Combobox","id":"pattern.combobox",
  "nodes":{
    "combobox":{"role":"combobox","state":{"expanded":false}},
    "listbox":{"role":"listbox"},
    "option":{"role":"option","state":{"selected":false}},
    "label":{"role":"label"}
  },
  "relationships":[
    {"from":"label","to":"combobox","type":"for","required":true},
    {"from":"combobox","to":"listbox","type":"controls","required":true}
  ],
  "apg":"https://www.w3.org/WAI/ARIA/apg/patterns/combobox/"
}
```

---

### 2.6 Menu / Menubar

* **ID**: `pattern.menu`
* **Nodes**: `menubar?`, `menu`, `menuitem*`, `menuitemcheckbox?`, `menuitemradio?`
* **Roles**: `menubar`, `menu`, `menuitem*`
* **Relationships**: nested submenus via `menuitem → controls → menu`
* **Keyboard**: Arrow navigation per APG; typeahead; Esc.
* **Emission**: `<div role="menu">` structure or library component mapping.
* **APG**: [https://www.w3.org/WAI/ARIA/apg/patterns/menubar/](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) , /menu/

---

## 3. Editor Guided Flow (per pattern)

1. **Choose Pattern** → creates a scaffold of required nodes.
2. **Name & Link** → auto‑assign ids; wire `aria-controls`, `aria-labelledby`, `for`.
3. **Keyboard Model** → attach default handlers to host (captured in manifest).
4. **Review & Commit** → show preview and **a11y checklist** green/amber/red.

---

## 4. Emission Rules (native vs component)

* Prefer **native** HTML when possible; fall back to ARIA on generic containers only if needed.
* If a component contract exists in `design/components.index.json`, **instantiate** it and map states/props per `propMap`.
* Attribute order is canonicalized; boolean attrs emitted explicitly for snapshot stability.

---

## 5. Validation Matrix (examples)

| Pattern  | Must Have                                       | Reject If                                                    |
| -------- | ----------------------------------------------- | ------------------------------------------------------------ |
| Button   | role button OR native `<button>`                | `role="button"` on `<a>` without `href`; missing focus style |
| Dialog   | `aria-labelledby` present; initial focus target | backdrop missing for modal; focus trap disabled              |
| Tabs     | exactly one selected tab                        | tab without controlled panel                                 |
| Combobox | label bound; combobox controls listbox          | option text empty; no selected value in single‑select        |
| Menu     | arrow nav wired; typeahead optional             | menuitem with both checkbox and radio state                  |

---

## 6. Roadmap

* v0.2: Add **Disclosure/Accordion**, **Treeview**, **Slider** manifests; unit tests that replay APG keyboard tables.
* v0.3: Visual PR diffs include **semantics change summaries** (e.g., “button→link”).
* v1.0: Pattern SDK so teams can supply custom manifests + keyboard tables.
