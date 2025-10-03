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

### 2.1 Button

* **ID**: `pattern.button`
* **Nodes**: `button`
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
