/**
 * @fileoverview Pattern manifest system for complex UI patterns
 * @author @darianrosebrook
 */

import type { CanvasDocumentType, NodeType } from "@paths-design/canvas-schema";
import type { ComponentIndex } from "@paths-design/component-indexer";
import { ulid } from "ulidx";

/**
 * Pattern manifest schema
 */
export interface PatternManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  category:
    | "Actions"
    | "Containers"
    | "Display"
    | "Feedback"
    | "Forms"
    | "Inputs"
    | "Navigation"
    | "Textual"
    | "Data Visualization"
    | "Editing";
  layer: "primitives" | "compounds" | "composers" | "assemblies";
  tags: string[];

  // Pattern structure definition
  structure: PatternNodeDefinition[];

  // Required relationships between nodes
  relationships: PatternRelationship[];

  // Emission rules for different targets
  emission: {
    html?: PatternEmissionRule;
    react?: PatternEmissionRule;
    accessibility?: AccessibilityRule[];
  };

  // Validation rules
  validation: PatternValidationRule[];

  // Examples and usage
  examples: PatternExample[];
}

/**
 * Node definition within a pattern
 */
export interface PatternNodeDefinition {
  id: string;
  name: string;
  type: "frame" | "text" | "component" | "group";
  semanticKey?: string;
  required: boolean;
  multiple?: boolean; // Can have multiple instances
  properties?: Record<string, any>;
  children?: PatternNodeDefinition[];

  // Positioning hints
  position?: {
    relativeTo?: string; // Reference to another node
    offset?: { x: number; y: number };
    alignment?: "start" | "center" | "end";
  };
}

/**
 * Relationship between pattern nodes
 */
export interface PatternRelationship {
  from: string; // Node ID
  to: string; // Node ID
  type: "controls" | "labelledby" | "describedby" | "owns" | "parent";
  required: boolean;
  description: string;
}

/**
 * Emission rule for pattern rendering
 */
export interface PatternEmissionRule {
  target: "html" | "react" | "vue" | "svelte";
  template?: string; // Template string with placeholders
  component?: string; // Component name to use
  props?: Record<string, any>;
  children?: string; // Reference to child nodes
}

/**
 * Accessibility rule for pattern
 */
export interface AccessibilityRule {
  nodeId: string;
  rule:
    | "role"
    | "aria-label"
    | "aria-labelledby"
    | "aria-describedby"
    | "aria-controls";
  value: string | string[]; // Node reference or static value
  required: boolean;
}

/**
 * Pattern validation rule
 */
export interface PatternValidationRule {
  type: "required-child" | "relationship" | "property" | "structure";
  message: string;
  nodeId?: string;
  condition?: string;
}

/**
 * Pattern example
 */
export interface PatternExample {
  name: string;
  description: string;
  canvasDocument: CanvasDocumentType;
  generatedCode?: string;
  screenshot?: string;
}

/**
 * Pattern instance in a canvas document
 */
export interface PatternInstance {
  patternId: string;
  rootNodeId: string;
  nodeMappings: Map<string, string>; // Pattern node ID → Canvas node ID
  isComplete: boolean;
  validationErrors: string[];
}

/**
 * Pattern registry for managing available patterns
 */
export class PatternRegistry {
  private patterns: Map<string, PatternManifest> = new Map();
  private componentIndex?: ComponentIndex;

  constructor(componentIndex?: ComponentIndex) {
    this.componentIndex = componentIndex;
  }

  /**
   * Register a pattern manifest
   */
  register(pattern: PatternManifest): void {
    this.patterns.set(pattern.id, pattern);
  }

  /**
   * Get all registered patterns
   */
  getAll(): PatternManifest[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get pattern by ID
   */
  get(id: string): PatternManifest | undefined {
    return this.patterns.get(id);
  }

  /**
   * Get patterns by category
   */
  getByCategory(category: PatternManifest["category"]): PatternManifest[] {
    return this.getAll().filter((p) => p.category === category);
  }

  /**
   * Get patterns by layer
   */
  getByLayer(layer: PatternManifest["layer"]): PatternManifest[] {
    return this.getAll().filter((p) => p.layer === layer);
  }

  /**
   * Get patterns by status (from component standards)
   */
  getByStatus(status: "Planned" | "Built" | "DocOnly"): PatternManifest[] {
    // For now, all patterns are considered "Built" since they're implemented
    // In a real system, this would be tracked separately
    return this.getAll();
  }

  /**
   * Get patterns by tag
   */
  getByTag(tag: string): PatternManifest[] {
    return this.getAll().filter((p) => p.tags.includes(tag));
  }

  /**
   * Search patterns by name or description
   */
  search(query: string): PatternManifest[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Load built-in patterns
   */
  loadBuiltInPatterns(): void {
    // Register common UI patterns
    this.register(this.createTabsPattern());
    this.register(this.createDialogPattern());
    this.register(this.createAccordionPattern());
    this.register(this.createFormPattern());
    this.register(this.createCardPattern());
    this.register(this.createNavigationPattern());
  }

  /**
   * Create Tabs pattern manifest
   */
  private createTabsPattern(): PatternManifest {
    return {
      id: "pattern.tabs",
      name: "Tabs",
      description: "Tab navigation pattern with panels",
      version: "1.0.0",
      category: "Navigation",
      layer: "composers",
      tags: ["tabs", "navigation", "panels", "accessibility"],
      structure: [
        {
          id: "tablist",
          name: "Tab List",
          type: "frame",
          semanticKey: "tabs.tablist",
          required: true,
          properties: { role: "tablist" },
        },
        {
          id: "tab",
          name: "Tab",
          type: "frame",
          semanticKey: "tabs.tab",
          required: true,
          multiple: true,
          properties: { role: "tab" },
          position: { relativeTo: "tablist" },
        },
        {
          id: "tabpanel",
          name: "Tab Panel",
          type: "frame",
          semanticKey: "tabs.tabpanel",
          required: true,
          multiple: true,
          properties: { role: "tabpanel" },
        },
      ],
      relationships: [
        {
          from: "tab",
          to: "tabpanel",
          type: "controls",
          required: true,
          description: "Tab controls corresponding panel",
        },
        {
          from: "tablist",
          to: "tab",
          type: "owns",
          required: true,
          description: "Tab list owns individual tabs",
        },
      ],
      emission: {
        html: {
          target: "html",
          template: `
            <div class="tabs">
              <div role="tablist" class="tab-list">
                {{#tablist.children}}
                <button role="tab" aria-selected="{{selected}}" id="tab-{{id}}" aria-controls="panel-{{id}}">
                  {{text}}
                </button>
                {{/tablist.children}}
              </div>
              {{#tabpanel}}
              <div role="tabpanel" id="panel-{{id}}" aria-labelledby="tab-{{id}}" class="{{#if hidden}}hidden{{/if}}">
                {{children}}
              </div>
              {{/tabpanel}}
            </div>
          `,
        },
        react: {
          target: "react",
          component: "Tabs",
          props: {
            defaultValue: "{{firstTabId}}",
            orientation: "horizontal",
          },
        },
      },
      validation: [
        {
          type: "required-child",
          message: "Tab list must contain at least one tab",
          nodeId: "tablist",
          condition: "children.length >= 1",
        },
        {
          type: "relationship",
          message: "Each tab must control a corresponding panel",
          condition: "tab.length === tabpanel.length",
        },
      ],
      examples: [
        {
          name: "Simple Tabs",
          description: "Basic tabs with two panels",
          canvasDocument: this.createTabsExample(),
        },
      ],
    };
  }

  /**
   * Create Dialog pattern manifest
   */
  private createDialogPattern(): PatternManifest {
    return {
      id: "pattern.dialog",
      name: "Dialog",
      description: "Modal dialog pattern with backdrop and focus management",
      version: "1.0.0",
      category: "Containers",
      layer: "composers",
      tags: ["dialog", "modal", "overlay", "accessibility"],
      structure: [
        {
          id: "trigger",
          name: "Trigger Button",
          type: "frame",
          semanticKey: "dialog.trigger",
          required: true,
          properties: { role: "button" },
        },
        {
          id: "dialog",
          name: "Dialog Container",
          type: "frame",
          semanticKey: "dialog.container",
          required: true,
          properties: { role: "dialog", "aria-modal": true },
        },
        {
          id: "title",
          name: "Dialog Title",
          type: "text",
          semanticKey: "dialog.title",
          required: true,
          position: { relativeTo: "dialog", offset: { x: 24, y: 24 } },
        },
        {
          id: "content",
          name: "Dialog Content",
          type: "frame",
          semanticKey: "dialog.content",
          required: true,
          position: { relativeTo: "dialog", offset: { x: 24, y: 64 } },
        },
        {
          id: "close",
          name: "Close Button",
          type: "frame",
          semanticKey: "dialog.close",
          required: false,
          position: {
            relativeTo: "dialog",
            alignment: "end",
            offset: { x: -24, y: 24 },
          },
        },
      ],
      relationships: [
        {
          from: "trigger",
          to: "dialog",
          type: "controls",
          required: true,
          description: "Trigger button controls dialog visibility",
        },
        {
          from: "dialog",
          to: "title",
          type: "labelledby",
          required: true,
          description: "Dialog is labelled by title",
        },
        {
          from: "close",
          to: "dialog",
          type: "controls",
          required: false,
          description: "Close button controls dialog visibility",
        },
      ],
      emission: {
        html: {
          target: "html",
          template: `
            <button id="trigger-{{trigger.id}}" aria-controls="dialog-{{dialog.id}}">
              {{trigger.text}}
            </button>
            <div id="dialog-{{dialog.id}}" role="dialog" aria-modal="true" aria-labelledby="title-{{title.id}}" class="{{#if hidden}}hidden{{/if}}">
              <div class="dialog-overlay"></div>
              <div class="dialog-content">
                <h1 id="title-{{title.id}}">{{title.text}}</h1>
                {{content.children}}
                {{#if close}}
                <button id="close-{{close.id}}" aria-controls="dialog-{{dialog.id}}">Close</button>
                {{/if}}
              </div>
            </div>
          `,
        },
      },
      validation: [
        {
          type: "required-child",
          message: "Dialog must have a title",
          nodeId: "title",
        },
        {
          type: "relationship",
          message: "Dialog must be controlled by trigger button",
          condition: "trigger !== null",
        },
      ],
      examples: [],
    };
  }

  /**
   * Create Accordion pattern manifest
   */
  private createAccordionPattern(): PatternManifest {
    return {
      id: "pattern.accordion",
      name: "Accordion",
      description: "Collapsible content sections",
      version: "1.0.0",
      category: "Containers",
      layer: "compounds",
      tags: ["accordion", "collapsible", "disclosure"],
      structure: [
        {
          id: "accordion",
          name: "Accordion Container",
          type: "frame",
          semanticKey: "accordion.container",
          required: true,
        },
        {
          id: "item",
          name: "Accordion Item",
          type: "frame",
          semanticKey: "accordion.item",
          required: true,
          multiple: true,
        },
        {
          id: "trigger",
          name: "Item Trigger",
          type: "frame",
          semanticKey: "accordion.trigger",
          required: true,
          multiple: true,
        },
        {
          id: "panel",
          name: "Item Panel",
          type: "frame",
          semanticKey: "accordion.panel",
          required: true,
          multiple: true,
        },
      ],
      relationships: [
        {
          from: "trigger",
          to: "panel",
          type: "controls",
          required: true,
          description: "Trigger controls panel visibility",
        },
      ],
      emission: {
        html: {
          target: "html",
          template: `
            <div class="accordion">
              {{#accordion.children}}
              <div class="accordion-item">
                <button class="accordion-trigger" aria-expanded="{{expanded}}" aria-controls="panel-{{id}}">
                  {{trigger.text}}
                </button>
                <div id="panel-{{id}}" class="accordion-panel" aria-labelledby="trigger-{{id}}" {{#unless expanded}}hidden{{/unless}}>
                  {{panel.children}}
                </div>
              </div>
              {{/accordion.children}}
            </div>
          `,
        },
      },
      validation: [
        {
          type: "structure",
          message: "Each accordion item must have trigger and panel",
          condition:
            "item.length === trigger.length && trigger.length === panel.length",
        },
      ],
      examples: [],
    };
  }

  /**
   * Create Form pattern manifest
   */
  private createFormPattern(): PatternManifest {
    return {
      id: "pattern.form",
      name: "Form",
      description: "Form with fields, labels, and validation",
      version: "1.0.0",
      category: "Forms",
      layer: "composers",
      tags: ["form", "input", "validation"],
      structure: [
        {
          id: "form",
          name: "Form Container",
          type: "frame",
          semanticKey: "form.container",
          required: true,
        },
        {
          id: "field",
          name: "Form Field",
          type: "frame",
          semanticKey: "form.field",
          required: true,
          multiple: true,
        },
        {
          id: "label",
          name: "Field Label",
          type: "text",
          semanticKey: "form.label",
          required: true,
          multiple: true,
        },
        {
          id: "input",
          name: "Input Field",
          type: "component",
          semanticKey: "form.input",
          required: true,
          multiple: true,
        },
        {
          id: "submit",
          name: "Submit Button",
          type: "frame",
          semanticKey: "form.submit",
          required: true,
        },
      ],
      relationships: [
        {
          from: "label",
          to: "input",
          type: "labelledby",
          required: true,
          description: "Label describes input field",
        },
        {
          from: "form",
          to: "submit",
          type: "owns",
          required: true,
          description: "Form owns submit button",
        },
      ],
      emission: {
        html: {
          target: "html",
          template: `
            <form class="form">
              {{#form.children}}
              {{#if field}}
              <div class="form-field">
                {{#if label}}
                <label for="input-{{input.id}}">{{label.text}}</label>
                {{/if}}
                <input id="input-{{input.id}}" name="{{input.name}}" type="{{input.type}}" {{#if required}}required{{/if}} />
              </div>
              {{/if}}
              {{/form.children}}
              <button type="submit" class="form-submit">{{submit.text}}</button>
            </form>
          `,
        },
      },
      validation: [
        {
          type: "relationship",
          message: "Each input must have a corresponding label",
          condition: "label.length === input.length",
        },
      ],
      examples: [],
    };
  }

  /**
   * Create Card pattern manifest
   */
  private createCardPattern(): PatternManifest {
    return {
      id: "pattern.card",
      name: "Card",
      description: "Content card with optional header, body, and footer",
      version: "1.0.0",
      category: "Display",
      layer: "compounds",
      tags: ["card", "container", "layout"],
      structure: [
        {
          id: "card",
          name: "Card Container",
          type: "frame",
          semanticKey: "card.container",
          required: true,
        },
        {
          id: "header",
          name: "Card Header",
          type: "frame",
          semanticKey: "card.header",
          required: false,
          position: { relativeTo: "card", offset: { x: 0, y: 0 } },
        },
        {
          id: "body",
          name: "Card Body",
          type: "frame",
          semanticKey: "card.body",
          required: false,
          position: { relativeTo: "card", offset: { x: 0, y: 80 } },
        },
        {
          id: "footer",
          name: "Card Footer",
          type: "frame",
          semanticKey: "card.footer",
          required: false,
          position: { relativeTo: "card", alignment: "end" },
        },
      ],
      relationships: [],
      emission: {
        html: {
          target: "html",
          template: `
            <article class="card">
              {{#if header}}
              <header class="card-header">{{header.children}}</header>
              {{/if}}
              {{#if body}}
              <div class="card-body">{{body.children}}</div>
              {{/if}}
              {{#if footer}}
              <footer class="card-footer">{{footer.children}}</footer>
              {{/if}}
            </article>
          `,
        },
      },
      validation: [],
      examples: [],
    };
  }

  /**
   * Create Navigation pattern manifest
   */
  private createNavigationPattern(): PatternManifest {
    return {
      id: "pattern.navigation",
      name: "Navigation",
      description: "Navigation menu with links",
      version: "1.0.0",
      category: "Navigation",
      layer: "compounds",
      tags: ["navigation", "menu", "links"],
      structure: [
        {
          id: "nav",
          name: "Navigation Container",
          type: "frame",
          semanticKey: "nav.container",
          required: true,
        },
        {
          id: "link",
          name: "Navigation Link",
          type: "frame",
          semanticKey: "nav.link",
          required: true,
          multiple: true,
        },
        {
          id: "logo",
          name: "Logo/Brand",
          type: "frame",
          semanticKey: "nav.logo",
          required: false,
          position: { relativeTo: "nav", alignment: "start" },
        },
      ],
      relationships: [],
      emission: {
        html: {
          target: "html",
          template: `
            <nav class="navigation">
              {{#if logo}}
              <div class="nav-logo">{{logo.children}}</div>
              {{/if}}
              <ul class="nav-links">
                {{#nav.children}}
                {{#if link}}
                <li><a href="{{link.href}}" class="nav-link">{{link.text}}</a></li>
                {{/if}}
                {{/nav.children}}
              </ul>
            </nav>
          `,
        },
      },
      validation: [
        {
          type: "required-child",
          message: "Navigation must contain at least one link",
          nodeId: "link",
          condition: "children.filter(c => c.type === 'link').length >= 1",
        },
      ],
      examples: [],
    };
  }

  /**
   * Create example tabs canvas document
   */
  private createTabsExample(): CanvasDocumentType {
    return {
      schemaVersion: "0.1.0",
      id: "01JF2PZV9G2WR5C3W7P0YHNX9D",
      name: "Tabs Example",
      artboards: [
        {
          id: "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
          name: "Desktop",
          frame: { x: 0, y: 0, width: 800, height: 600 },
          children: [
            {
              id: "01JF2Q06GTS16EJ3A3F0KK9K3T",
              type: "frame",
              name: "Tabs Container",
              frame: { x: 32, y: 32, width: 736, height: 536 },
              semanticKey: "tabs.container",
              children: [
                {
                  id: "01JF2Q07GTS16EJ3A3F0KK9K3U",
                  type: "frame",
                  name: "Tab List",
                  frame: { x: 0, y: 0, width: 736, height: 48 },
                  semanticKey: "tabs.tablist",
                  children: [
                    {
                      id: "01JF2Q08GTS16EJ3A3F0KK9K3V",
                      type: "text",
                      name: "Tab 1",
                      frame: { x: 16, y: 12, width: 80, height: 24 },
                      text: "Overview",
                      semanticKey: "tabs.tab[0]",
                    },
                    {
                      id: "01JF2Q09GTS16EJ3A3F0KK9K3W",
                      type: "text",
                      name: "Tab 2",
                      frame: { x: 112, y: 12, width: 80, height: 24 },
                      text: "Details",
                      semanticKey: "tabs.tab[1]",
                    },
                  ],
                },
                {
                  id: "01JF2Q10GTS16EJ3A3F0KK9K3X",
                  type: "frame",
                  name: "Tab Panel 1",
                  frame: { x: 0, y: 48, width: 736, height: 488 },
                  semanticKey: "tabs.tabpanel[0]",
                  children: [
                    {
                      id: "01JF2Q11GTS16EJ3A3F0KK9K3Y",
                      type: "text",
                      name: "Overview Content",
                      frame: { x: 16, y: 16, width: 200, height: 32 },
                      text: "This is the overview panel content.",
                      semanticKey: "tabs.content[0]",
                    },
                  ],
                },
                {
                  id: "01JF2Q12GTS16EJ3A3F0KK9K3Z",
                  type: "frame",
                  name: "Tab Panel 2",
                  frame: { x: 0, y: 48, width: 736, height: 488 },
                  semanticKey: "tabs.tabpanel[1]",
                  children: [
                    {
                      id: "01JF2Q13GTS16EJ3A3F0KK9K40",
                      type: "text",
                      name: "Details Content",
                      frame: { x: 16, y: 16, width: 200, height: 32 },
                      text: "This is the details panel content.",
                      semanticKey: "tabs.content[1]",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
  }
}

/**
 * Pattern instance detector and validator
 */
export class PatternDetector {
  private registry: PatternRegistry;

  constructor(registry: PatternRegistry) {
    this.registry = registry;
  }

  /**
   * Detect pattern instances in a canvas document
   */
  detectPatterns(document: CanvasDocumentType): PatternInstance[] {
    const instances: PatternInstance[] = [];

    for (const pattern of this.registry.getAll()) {
      const patternInstances = this.detectPatternInstances(document, pattern);
      instances.push(...patternInstances);
    }

    return instances;
  }

  /**
   * Detect instances of a specific pattern
   */
  private detectPatternInstances(
    document: CanvasDocumentType,
    pattern: PatternManifest
  ): PatternInstance[] {
    const instances: PatternInstance[] = [];

    // Find potential root nodes for this pattern
    const potentialRoots = this.findPotentialPatternRoots(document, pattern);

    for (const rootNode of potentialRoots) {
      const instance = this.analyzePatternInstance(document, pattern, rootNode);
      if (instance) {
        instances.push(instance);
      }
    }

    return instances;
  }

  /**
   * Find potential root nodes for a pattern
   */
  private findPotentialPatternRoots(
    document: CanvasDocumentType,
    pattern: PatternManifest
  ): NodeType[] {
    const roots: NodeType[] = [];
    const self = this;

    function traverseNodes(nodes: NodeType[]): void {
      for (const node of nodes) {
        // Check if this node could be a pattern root
        if (self.nodeMatchesPatternRoot(node, pattern)) {
          roots.push(node);
        }

        // Recurse into children
        if ("children" in node && node.children) {
          traverseNodes(node.children);
        }
      }
    }

    document.artboards.forEach((artboard: any) => {
      traverseNodes(artboard.children);
    });

    return roots;
  }

  /**
   * Check if a node matches a pattern root
   */
  private nodeMatchesPatternRoot(
    node: NodeType,
    pattern: PatternManifest
  ): boolean {
    // Simple heuristic: check if node has required semantic keys or structure
    const semanticKey = (node as any).semanticKey;
    if (
      semanticKey &&
      pattern.structure.some((s) => s.semanticKey === semanticKey)
    ) {
      return true;
    }

    // Check structure-based matching
    if (node.type === "frame" && "children" in node) {
      const children = node.children || [];
      return pattern.structure.some((struct) => {
        return children.some((child: any) => child.type === struct.type);
      });
    }

    return false;
  }

  /**
   * Analyze a potential pattern instance
   */
  private analyzePatternInstance(
    document: CanvasDocumentType,
    pattern: PatternManifest,
    rootNode: NodeType
  ): PatternInstance | null {
    const nodeMappings = new Map<string, string>();
    const validationErrors: string[] = [];

    // Try to map pattern nodes to canvas nodes
    const isValid = this.mapPatternNodes(
      pattern,
      rootNode,
      nodeMappings,
      validationErrors
    );

    if (!isValid) {
      return null;
    }

    return {
      patternId: pattern.id,
      rootNodeId: rootNode.id,
      nodeMappings,
      isComplete: validationErrors.length === 0,
      validationErrors,
    };
  }

  /**
   * Map pattern node definitions to actual canvas nodes
   */
  private mapPatternNodes(
    pattern: PatternManifest,
    rootNode: NodeType,
    nodeMappings: Map<string, string>,
    validationErrors: string[]
  ): boolean {
    // Simple mapping based on semantic keys and structure
    const nodes = this.getAllNodesInSubtree(rootNode);

    // Map by semantic keys first
    for (const patternNode of pattern.structure) {
      if (patternNode.semanticKey) {
        const matchingNode = nodes.find(
          (node) => (node as any).semanticKey === patternNode.semanticKey
        );
        if (matchingNode) {
          nodeMappings.set(patternNode.id, matchingNode.id);
        } else if (patternNode.required) {
          validationErrors.push(
            `Required node "${patternNode.name}" with semantic key "${patternNode.semanticKey}" not found`
          );
          return false;
        }
      }
    }

    // Map by structure for remaining nodes
    const unmappedPatternNodes = pattern.structure.filter(
      (pn) => !nodeMappings.has(pn.id)
    );

    for (const patternNode of unmappedPatternNodes) {
      const matchingNode = nodes.find((node) => node.type === patternNode.type);
      if (matchingNode) {
        nodeMappings.set(patternNode.id, matchingNode.id);
      } else if (patternNode.required) {
        validationErrors.push(
          `Required node "${patternNode.name}" of type "${patternNode.type}" not found`
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Get all nodes in a subtree
   */
  private getAllNodesInSubtree(rootNode: NodeType): NodeType[] {
    const nodes: NodeType[] = [rootNode];

    function traverse(node: NodeType): void {
      if ("children" in node && node.children) {
        nodes.push(...node.children);
        node.children.forEach(traverse);
      }
    }

    traverse(rootNode);
    return nodes;
  }
}

/**
 * Pattern generator for creating canvas documents from pattern specifications
 */
export class PatternGenerator {
  private registry: PatternRegistry;

  constructor(registry: PatternRegistry) {
    this.registry = registry;
  }

  /**
   * Generate a canvas document from a pattern specification
   */
  generateFromPattern(
    patternId: string,
    spec: {
      name: string;
      position?: { x: number; y: number };
      properties?: Record<string, any>;
    }
  ): CanvasDocumentType {
    const pattern = this.registry.get(patternId);
    if (!pattern) {
      throw new Error(`Pattern "${patternId}" not found`);
    }

    // Create basic canvas document
    const document: CanvasDocumentType = {
      schemaVersion: "0.1.0",
      id: ulid(),
      name: spec.name,
      artboards: [
        {
          id: ulid(),
          name: "Main",
          frame: { x: 0, y: 0, width: 1440, height: 1024 },
          children: [],
        },
      ],
    };

    // Generate pattern nodes
    const patternNodes = this.generatePatternNodes(pattern, spec);

    // Add to artboard
    document.artboards[0].children.push(...patternNodes);

    return document;
  }

  /**
   * Generate nodes for a pattern
   */
  private generatePatternNodes(
    pattern: PatternManifest,
    spec: {
      position?: { x: number; y: number };
      properties?: Record<string, any>;
    }
  ): NodeType[] {
    const nodes: NodeType[] = [];
    const position = spec.position || { x: 0, y: 0 };

    for (const nodeDef of pattern.structure) {
      const node: any = {
        id: ulid(),
        type: nodeDef.type,
        name: nodeDef.name,
        visible: true,
        frame: {
          x: position.x,
          y: position.y,
          width: nodeDef.type === "frame" ? 300 : 200,
          height: nodeDef.type === "frame" ? 100 : 40,
        },
        semanticKey: nodeDef.semanticKey,
        ...(nodeDef.properties && { ...nodeDef.properties }),
      };

      // Add children array for container types
      if (nodeDef.type === "frame" || nodeDef.type === "group") {
        node.children = [];
      }

      // Add text content for text nodes
      if (nodeDef.type === "text") {
        node.text = nodeDef.name;
      }

      nodes.push(node);
    }

    return nodes;
  }
}

/**
 * Pattern validator for checking pattern compliance
 */
export class PatternValidator {
  private registry: PatternRegistry;

  constructor(registry: PatternRegistry) {
    this.registry = registry;
  }

  /**
   * Validate pattern instances in a document
   */
  validatePatterns(document: CanvasDocumentType): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const detector = new PatternDetector(this.registry);
    const instances = detector.detectPatterns(document);

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    for (const instance of instances) {
      const pattern = this.registry.get(instance.patternId);
      if (!pattern) {
        continue;
      }

      // Check required nodes
      for (const nodeDef of pattern.structure) {
        if (nodeDef.required && !instance.nodeMappings.has(nodeDef.id)) {
          errors.push(
            `Missing required node "${nodeDef.name}" in ${pattern.name} pattern`
          );
        }
      }

      // Check relationships
      for (const relationship of pattern.relationships) {
        if (relationship.required) {
          const fromNode = instance.nodeMappings.get(relationship.from);
          const toNode = instance.nodeMappings.get(relationship.to);

          if (!fromNode || !toNode) {
            errors.push(
              `Missing relationship ${relationship.from} → ${relationship.to} in ${pattern.name} pattern`
            );
          }
        }
      }

      // Generate suggestions
      if (instance.validationErrors.length > 0) {
        warnings.push(...instance.validationErrors);
      }

      // Suggest improvements
      if (!instance.isComplete) {
        suggestions.push(
          `Complete ${pattern.name} pattern by adding missing required nodes`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }
}

/**
 * Convenience function for creating pattern registry
 */
export function createPatternRegistry(
  componentIndex?: ComponentIndex
): PatternRegistry {
  const registry = new PatternRegistry(componentIndex);
  registry.loadBuiltInPatterns();
  return registry;
}

/**
 * Convenience function for pattern detection
 */
export function detectPatterns(
  document: CanvasDocumentType,
  componentIndex?: ComponentIndex
): PatternInstance[] {
  const registry = createPatternRegistry(componentIndex);
  const detector = new PatternDetector(registry);
  return detector.detectPatterns(document);
}

/**
 * Convenience function for pattern generation
 */
export function generatePattern(
  patternId: string,
  spec: {
    name: string;
    position?: { x: number; y: number };
    properties?: Record<string, any>;
  },
  componentIndex?: ComponentIndex
): CanvasDocumentType {
  const registry = createPatternRegistry(componentIndex);
  const generator = new PatternGenerator(registry);
  return generator.generateFromPattern(patternId, spec);
}
