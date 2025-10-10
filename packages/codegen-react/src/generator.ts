/**
 * @fileoverview Core React component generation engine
 * @author @darianrosebrook
 */

import { traverseDocument } from "@paths-design/canvas-engine";
import type {
  CanvasDocumentType,
  ComponentInstanceNodeType,
  FrameNodeType,
  NodeType,
  TextNodeType,
} from "@paths-design/canvas-schema";
import type { CodeGenOptions } from "./determinism.js";
import { mergeCodeGenOptions } from "./determinism.js";

/**
 * Generated file information
 */
export interface GeneratedFile {
  path: string;
  content: string;
  type: "tsx" | "ts" | "css";
}

/**
 * Generation result
 */
export interface GenerationResult {
  files: GeneratedFile[];
  metadata: {
    timestamp: number;
    componentId: string;
    nodeCount: number;
    artboardCount: number;
    extractedComponents: number;
  };
}

/**
 * Component index entry for semantic key mapping
 */
interface ComponentIndexEntry {
  id: string;
  name: string;
  modulePath: string;
  export: string;
  semanticKeys?: Record<
    string,
    {
      description?: string;
      priority?: number;
      propDefaults?: Record<string, unknown>;
    }
  >;
  props: Array<{
    name: string;
    type: string;
    passthrough?: {
      attributes?: string[];
      cssVars?: string[];
      events?: string[];
      children?: boolean;
      ariaLabel?: boolean;
    };
  }>;
}

/**
 * Component index for semantic key mappings
 */
interface ComponentIndex {
  version: string;
  components: Record<string, ComponentIndexEntry>;
}

/**
 * Semantic component inference result
 */
interface SemanticComponentInfo {
  tagName: string;
  className: string;
  attributes: Record<string, string>;
  role?: string;
  ariaLabel?: string;
  componentKey?: string;
  propDefaults?: Record<string, unknown>;
}

/**
 * Component reuse pattern detection result
 */
interface ComponentPattern {
  id: string;
  name: string;
  nodes: NodeType[];
  occurrences: number;
  hash: string;
}

/**
 * React component generator with deterministic output and component reuse
 */
export class ReactGenerator {
  private options: ReturnType<typeof mergeCodeGenOptions>;
  private componentPatterns: Map<string, ComponentPattern> = new Map();
  private extractedComponents: Map<string, GeneratedFile> = new Map();
  private componentIndex: ComponentIndex | null = null;

  constructor(options: CodeGenOptions = {}) {
    this.options = mergeCodeGenOptions(options);
  }

  /**
   * Load component index for semantic key mappings
   */
  loadComponentIndex(componentIndexPath?: string): void {
    if (!componentIndexPath) {
      return;
    }

    try {
      // In a real implementation, this would load from the file system
      // For now, we'll use a placeholder structure
      this.componentIndex = {
        version: "1.0.0",
        components: {},
      };
    } catch (error) {
      console.warn("Failed to load component index:", error);
    }
  }

  /**
   * Generate React components from a canvas document with component reuse
   */
  generate(
    document: CanvasDocumentType,
    options?: { componentIndexPath?: string }
  ): GenerationResult {
    const files: GeneratedFile[] = [];
    const {
      clock: _clock,
      sorter: _sorter,
      normalizer: _normalizer,
    } = this.options;

    // Load component index if provided
    if (options?.componentIndexPath) {
      this.loadComponentIndex(options.componentIndexPath);
    }

    // Clear previous patterns
    this.componentPatterns.clear();
    this.extractedComponents.clear();

    // First pass: detect reusable component patterns
    this.detectComponentPatterns(document);

    // Extract reusable components
    this.extractReusableComponents();

    // Generate component for each artboard (now using extracted components)
    for (const artboard of document.artboards) {
      const componentResult = this.generateComponentForArtboard(artboard);
      if (componentResult) {
        files.push(...componentResult);
      }
    }

    // Add extracted reusable components
    files.push(...this.extractedComponents.values());

    // Generate index file
    const indexFile = this.generateIndexFile(document);
    if (indexFile) {
      files.push(indexFile);
    }

    return {
      files,
      metadata: {
        timestamp: _clock.now(),
        componentId: _clock.uuid(),
        nodeCount: this.countNodes(document),
        artboardCount: document.artboards.length,
        extractedComponents: this.extractedComponents.size,
      },
    };
  }

  /**
   * Generate React component for a single artboard
   */
  private generateComponentForArtboard(artboard: {
    name: string;
    children: NodeType[];
    [key: string]: unknown;
  }): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const {
      clock: _clock,
      sorter: _sorter,
      normalizer: _normalizer,
    } = this.options;

    // Generate main component
    const componentName = this.pascalCase(artboard.name);
    const jsxContent = this.generateJSX(artboard.children);
    const tsxContent = this.generateTSXContent(componentName, jsxContent);

    files.push({
      path: `${componentName}.tsx`,
      content: tsxContent,
      type: "tsx",
    });

    // Generate CSS module
    const cssContent = this.generateCSS(artboard.children);
    files.push({
      path: `${componentName}.module.css`,
      content: cssContent,
      type: "css",
    });

    return files;
  }

  /**
   * Detect reusable component patterns in the document
   */
  private detectComponentPatterns(document: CanvasDocumentType): void {
    const { sorter: _sorter } = this.options;

    // Collect all node subtrees for pattern analysis
    const patterns = new Map<string, { nodes: NodeType[]; count: number }>();

    // Use canvas-engine's traversal for consistency and reliability
    for (const result of traverseDocument(document)) {
      const node = result.node;

      // Check if this subtree pattern already exists
      const patternKey = this.generatePatternKey(node);
      if (!patterns.has(patternKey)) {
        patterns.set(patternKey, { nodes: [node], count: 0 });
      }
      const pattern = patterns.get(patternKey);
      if (pattern) {
        pattern.count++;
      }
    }

    // Filter patterns that are worth extracting (appear multiple times or have meaningful structure)
    // But skip nodes that have semantic keys (they should be inlined for semantic component generation)
    for (const [key, pattern] of patterns) {
      const hasSemanticKey = pattern.nodes.some((node) => node.semanticKey);
      if (
        !hasSemanticKey &&
        (pattern.count >= 2 || this.isWorthExtracting(pattern.nodes))
      ) {
        const componentName = this.generateComponentName(pattern.nodes[0]);
        this.componentPatterns.set(key, {
          id: key,
          name: componentName,
          nodes: pattern.nodes,
          occurrences: pattern.count,
          hash: this.generatePatternHash(pattern.nodes),
        });
      }
    }
  }

  /**
   * Extract reusable components from detected patterns
   */
  private extractReusableComponents(): void {
    for (const [_patternId, pattern] of this.componentPatterns) {
      const componentName = pattern.name;
      const jsxContent = this.generateJSX(pattern.nodes, 1);

      // Generate component file
      const tsxContent = this.generateTSXContent(
        componentName,
        jsxContent,
        true
      );
      const cssContent = this.generateCSS(pattern.nodes);

      // Add component file
      this.extractedComponents.set(`${componentName}.tsx`, {
        path: `${componentName}.tsx`,
        content: tsxContent,
        type: "tsx",
      });

      // Add CSS file
      this.extractedComponents.set(`${componentName}.module.css`, {
        path: `${componentName}.module.css`,
        content: cssContent,
        type: "css",
      });
    }
  }

  /**
   * Generate JSX for a node tree with component reuse
   */
  private generateJSX(nodes: NodeType[], depth: number = 0): string {
    const { sorter: _sorter, normalizer: _normalizer } = this.options;
    const indent = "  ".repeat(depth + 1);

    const jsxElements = nodes.map((node) => {
      return this.generateNodeJSX(node, depth + 1);
    });

    return jsxElements.join("\n" + indent);
  }

  /**
   * Infer semantic component type from node properties with semanticKey priority
   */
  private inferSemanticComponent(node: NodeType): SemanticComponentInfo {
    const name = node.name.toLowerCase();
    const hasChildren =
      "children" in node && node.children && node.children.length > 0;
    const _style = node.style || {};

    // Priority 1: Semantic key-based inference (highest priority)
    if (node.semanticKey) {
      const semanticMatch = this.matchSemanticKey(node.semanticKey, node);
      if (semanticMatch) {
        return semanticMatch;
      }
    }

    // Priority 2: Name-based inference (current logic)
    if (name.includes("button") || name.includes("btn")) {
      return {
        tagName: "button",
        className: "button",
        attributes: { type: "button" },
        role: "button",
        ariaLabel: name,
      };
    }

    if (
      name.includes("input") ||
      name.includes("field") ||
      name.includes("textbox")
    ) {
      return {
        tagName: "input",
        className: "input",
        attributes: { type: "text" },
        role: "textbox",
        ariaLabel: name,
      };
    }

    if (
      name.includes("link") ||
      name.includes("anchor") ||
      name.includes("url")
    ) {
      return {
        tagName: "a",
        className: "link",
        attributes: { href: "#" }, // Default href, should be overridden by props
        role: "link",
      };
    }

    if (name.includes("card") || name.includes("panel")) {
      return {
        tagName: "article",
        className: "card",
        attributes: {},
        role: "article",
      };
    }

    if (name.includes("nav") || name.includes("menu")) {
      return {
        tagName: "nav",
        className: "navigation",
        attributes: {},
        role: "navigation",
      };
    }

    if (name.includes("header") || name.includes("banner")) {
      return {
        tagName: "header",
        className: "header",
        attributes: {},
        role: "banner",
      };
    }

    if (name.includes("footer")) {
      return {
        tagName: "footer",
        className: "footer",
        attributes: {},
        role: "contentinfo",
      };
    }

    if (name.includes("main") || name.includes("content")) {
      return {
        tagName: "main",
        className: "main",
        attributes: {},
        role: "main",
      };
    }

    if (name.includes("section") || name.includes("container")) {
      return {
        tagName: "section",
        className: "section",
        attributes: {},
      };
    }

    // Priority 3: Layout-based inference
    if (node.type === "frame" && hasChildren && node.layout?.mode === "flex") {
      if (node.layout.direction === "row") {
        return {
          tagName: "div",
          className: "flex-row",
          attributes: {},
        };
      }
      if (node.layout.direction === "column") {
        return {
          tagName: "div",
          className: "flex-column",
          attributes: {},
        };
      }
    }

    // Default fallback
    return {
      tagName: node.type === "frame" ? "div" : "span",
      className: node.type === "frame" ? "frame" : "text",
      attributes: {},
    };
  }

  /**
   * Match node against semantic key patterns for component inference
   */
  private matchSemanticKey(
    semanticKey: string,
    node: NodeType
  ): SemanticComponentInfo | null {
    // Priority 1: Component contract matching (highest priority)
    if (this.componentIndex) {
      const contractMatch = this.matchSemanticKeyToComponentContract(
        semanticKey,
        node
      );
      if (contractMatch) {
        return contractMatch;
      }
    }

    // Priority 2: Built-in semantic patterns (fallback)
    const semanticPatterns: Array<{
      pattern: RegExp;
      component: SemanticComponentInfo;
    }> = [
      // Hero patterns
      {
        pattern: /^hero\.(title|subtitle|description)$/,
        component: {
          tagName: node.type === "frame" ? "header" : "h1",
          className: "hero-text",
          attributes: {},
          role: node.type === "frame" ? "banner" : "heading",
        },
      },

      // Navigation patterns
      {
        pattern: /^nav\.(items?|links?)$/,
        component: {
          tagName: "nav",
          className: "navigation",
          attributes: {},
          role: "navigation",
        },
      },
      {
        pattern: /^nav\.(items?|links?)\[[0-9]+\]$/,
        component: {
          tagName: "a",
          className: "nav-link",
          attributes: { href: "#" },
          role: "link",
        },
      },

      // CTA (Call to Action) patterns
      {
        pattern: /^cta\.(primary|secondary|button)$/,
        component: {
          tagName: "button",
          className: "cta-button",
          attributes: { type: "button" },
          role: "button",
        },
      },

      // Form patterns
      {
        pattern: /^(form|input)\.(field|input)$/,
        component: {
          tagName: "input",
          className: "form-input",
          attributes: { type: "text" },
          role: "textbox",
        },
      },
      {
        pattern: /^(form|input)\.label$/,
        component: {
          tagName: "label",
          className: "form-label",
          attributes: {},
        },
      },

      // Card patterns
      {
        pattern: /^card\.(header|body|footer)$/,
        component: {
          tagName: node.type === "frame" ? "article" : "div",
          className: "card-section",
          attributes: {},
          role: node.type === "frame" ? "article" : undefined,
        },
      },

      // List patterns
      {
        pattern: /^(list|items)\[[0-9]+\]$/,
        component: {
          tagName: "li",
          className: "list-item",
          attributes: {},
          role: "listitem",
        },
      },
      {
        pattern: /^(list|items)$/,
        component: {
          tagName: "ul",
          className: "list",
          attributes: {},
          role: "list",
        },
      },

      // Content section patterns
      {
        pattern: /^(content|section)\.(heading|title)$/,
        component: {
          tagName: "h2",
          className: "section-heading",
          attributes: {},
          role: "heading",
        },
      },
      {
        pattern: /^(content|section)\.text$/,
        component: {
          tagName: "p",
          className: "section-text",
          attributes: {},
        },
      },

      // Modal/Dialog patterns
      {
        pattern: /^(modal|dialog)\.(trigger|opener)$/,
        component: {
          tagName: "button",
          className: "modal-trigger",
          attributes: { type: "button" },
          role: "button",
        },
      },
      {
        pattern: /^(modal|dialog)\.content$/,
        component: {
          tagName: "div",
          className: "modal-content",
          attributes: {},
          role: "dialog",
        },
      },
    ];

    // Find matching pattern
    for (const { pattern, component } of semanticPatterns) {
      if (pattern.test(semanticKey)) {
        // Add semantic key to className for more specific styling
        return {
          ...component,
          className: `${component.className} ${semanticKey.replace(
            /[.\[\]]/g,
            "-"
          )}`,
        };
      }
    }

    return null; // No semantic pattern matched
  }

  /**
   * Match semantic key to component contracts from the component index
   */
  private matchSemanticKeyToComponentContract(
    semanticKey: string,
    _node: NodeType
  ): SemanticComponentInfo | null {
    if (!this.componentIndex) {
      return null;
    }

    // Find the best matching component contract for this semantic key
    let bestMatch: {
      componentKey: string;
      mapping: {
        propDefaults: Record<string, unknown>;
        [key: string]: unknown;
      };
      priority: number;
    } | null = null;

    for (const [componentKey, component] of Object.entries(
      this.componentIndex.components
    )) {
      if (component.semanticKeys?.[semanticKey]) {
        const mapping = component.semanticKeys[semanticKey];
        const priority = mapping.priority ?? 5;

        if (!bestMatch || priority > bestMatch.priority) {
          bestMatch = {
            componentKey,
            mapping: {
              ...mapping,
              propDefaults: mapping.propDefaults ?? {},
            },
            priority,
          };
        }
      }
    }

    if (!bestMatch) {
      return null;
    }

    // Generate component info from the contract
    const { componentKey, mapping } = bestMatch;
    const component = this.componentIndex!.components[componentKey];

    return {
      tagName: component.name.toLowerCase(), // Use component name as fallback
      className: `${component.name.toLowerCase()} ${semanticKey.replace(
        /[.\[\]]/g,
        "-"
      )}`,
      attributes: {},
      componentKey,
      propDefaults: mapping.propDefaults || {},
    };
  }

  /**
   * Generate JSX for a frame node with semantic components
   */
  private generateSemanticFrameJSX(
    node: FrameNodeType,
    semanticInfo: SemanticComponentInfo,
    depth: number
  ): string {
    const { sorter: _sorter, normalizer: _normalizer } = this.options;
    const indent = "  ".repeat(depth);

    // Include semantic key in class name if present
    const semanticKeyClass = node.semanticKey
      ? node.semanticKey.replace(/\./g, "-")
      : "";
    const cssModuleClassName = `${semanticInfo.className} ${
      semanticInfo.className
    }-${node.name.toLowerCase().replace(/\s+/g, "-")}`;
    const _fullClassName = semanticKeyClass
      ? `${cssModuleClassName} ${semanticKeyClass}`
      : cssModuleClassName;

    const style = this.generateStyleObject(node);
    const attributes = this.generateAttributes(semanticInfo, node);

    const childrenJSX =
      node.children.length > 0
        ? "\n" + this.generateJSX(node.children, depth) + "\n" + indent
        : "";

    const jsxTag = `<${semanticInfo.tagName}${
      attributes ? ` ${attributes}` : ""
    }${
      style ? ` style={${JSON.stringify(style)}}` : ""
    } className={s.${cssModuleClassName.replace(/-/g, "_")}${
      semanticKeyClass ? ` ${semanticKeyClass}` : ""
    }}`;

    return `${indent}${jsxTag}>${childrenJSX}${indent}</${semanticInfo.tagName}>`;
  }

  /**
   * Generate JSX for a text node with semantic components
   */
  private generateSemanticTextJSX(
    node: TextNodeType,
    semanticInfo: SemanticComponentInfo,
    depth: number
  ): string {
    const { sorter: _sorter, normalizer: _normalizer } = this.options;
    const indent = "  ".repeat(depth);

    const className = `${semanticInfo.className} ${
      semanticInfo.className
    }-${node.name.toLowerCase().replace(/\s+/g, "-")}`;
    const style = this.generateStyleObject(node);
    const attributes = this.generateAttributes(semanticInfo, node);

    const jsxTag = `<${semanticInfo.tagName}${
      attributes ? ` ${attributes}` : ""
    }${
      style ? ` style={${JSON.stringify(style)}}` : ""
    } className={s.${className.replace(/-/g, "_")}}`;

    return `${indent}${jsxTag}>${this.escapeText(node.text)}</${
      semanticInfo.tagName
    }>`;
  }

  /**
   * Generate HTML attributes from semantic info and node data
   */
  private generateAttributes(
    semanticInfo: SemanticComponentInfo,
    node: NodeType
  ): string | null {
    const { sorter: _sorter } = this.options;
    const attributes: string[] = [];

    // Add semantic attributes
    if (semanticInfo.role) {
      attributes.push(`role="${semanticInfo.role}"`);
    }
    if (semanticInfo.ariaLabel) {
      attributes.push(`aria-label="${semanticInfo.ariaLabel}"`);
    }

    // Add node-specific attributes
    Object.entries(semanticInfo.attributes).forEach(([key, value]) => {
      attributes.push(`${key}="${value}"`);
    });

    // Add data attributes for debugging
    if (node.data) {
      Object.entries(node.data).forEach(([key, value]) => {
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          attributes.push(`data-${key}="${value}"`);
        }
      });
    }

    return attributes.length > 0 ? attributes.join(" ") : null;
  }

  /**
   * Generate JSX for a frame node
   */
  private generateFrameJSX(node: FrameNodeType, depth: number): string {
    const { sorter: _sorter, normalizer: _normalizer } = this.options;
    const indent = "  ".repeat(depth);

    const className = `frame frame-${node.name
      .toLowerCase()
      .replace(/\s+/g, "-")}`;
    const style = this.generateStyleObject(node);

    const childrenJSX =
      node.children.length > 0
        ? "\n" + this.generateJSX(node.children, depth) + "\n" + indent
        : "";

    return `${indent}<div className={s.${className.replace(/-/g, "_")}}${
      style ? ` style={${JSON.stringify(style)}}` : ""
    }>${childrenJSX}${indent}</div>`;
  }

  /**
   * Generate JSX for a text node
   */
  private generateTextJSX(node: TextNodeType, depth: number): string {
    const { sorter: _sorter, normalizer: _normalizer } = this.options;
    const indent = "  ".repeat(depth);

    const className = `text text-${node.name
      .toLowerCase()
      .replace(/\s+/g, "-")}`;
    const style = this.generateStyleObject(node);

    return `${indent}<span className={s.${className.replace(/-/g, "_")}}${
      style ? ` style={${JSON.stringify(style)}}` : ""
    }>${this.escapeText(node.text)}</span>`;
  }

  /**
   * Generate JSX for a component instance node
   */
  private generateComponentJSX(
    node: ComponentInstanceNodeType,
    depth: number
  ): string {
    const { sorter: _sorter, normalizer: _normalizer } = this.options;
    const indent = "  ".repeat(depth);

    const componentName = this.pascalCase(node.componentKey);
    const props = this.generatePropsObject(node.props);

    return `${indent}<${componentName}${props ? ` ${props}` : ""} />`;
  }

  /**
   * Generate style object from node style
   */
  private generateStyleObject(node: NodeType): Record<string, string> | null {
    if (!node.style) {
      return null;
    }

    const style: Record<string, string> = {};

    // Convert design tokens and styles to CSS properties
    // This is a simplified implementation - a full version would handle
    // token resolution, gradients, shadows, etc.

    return style;
  }

  /**
   * Generate props object for component instances
   */
  private generatePropsObject(props: Record<string, unknown>): string | null {
    if (!props || Object.keys(props).length === 0) {
      return null;
    }

    const { sorter } = this.options;
    const sortedProps = sorter.sortObjectKeys(props);

    const propStrings = Object.entries(sortedProps)
      .map(([key, value]) => {
        if (typeof value === "string") {
          return `${key}="${value}"`;
        } else if (typeof value === "boolean") {
          return value ? key : "";
        } else {
          return `${key}={${JSON.stringify(value)}}`;
        }
      })
      .filter(Boolean);

    return propStrings.join(" ");
  }

  /**
   * Generate CSS content for styling with semantic components
   */
  private generateCSS(nodes: NodeType[]): string {
    const { sorter: _sorter, normalizer: _normalizer } = this.options;

    // Generate CSS classes for each node
    const cssRules: string[] = [];

    for (const node of nodes) {
      const semanticInfo = this.inferSemanticComponent(node);
      const baseClassName = semanticInfo.className;
      const specificClassName = `${baseClassName}-${node.name
        .toLowerCase()
        .replace(/\s+/g, "-")}`;
      const cssClassName = specificClassName.replace(/-/g, "_");

      // Generate CSS for frames
      if (node.type === "frame" && node.frame) {
        const frame = node.frame;
        cssRules.push(`.${cssClassName} {`);
        cssRules.push(`  position: absolute;`);
        cssRules.push(`  left: ${_normalizer.normalizeCoordinate(frame.x)}px;`);
        cssRules.push(`  top: ${_normalizer.normalizeCoordinate(frame.y)}px;`);
        cssRules.push(
          `  width: ${_normalizer.normalizeDimension(frame.width)}px;`
        );
        cssRules.push(
          `  height: ${_normalizer.normalizeDimension(frame.height)}px;`
        );

        // Add semantic styling based on component type
        if (semanticInfo.tagName === "button") {
          cssRules.push(`  cursor: pointer;`);
          cssRules.push(`  border: none;`);
          cssRules.push(`  background: transparent;`);
          cssRules.push(`  padding: 8px 16px;`);
          cssRules.push(`  border-radius: 4px;`);
        }

        if (semanticInfo.tagName === "input") {
          cssRules.push(`  border: 1px solid #ccc;`);
          cssRules.push(`  padding: 8px 12px;`);
          cssRules.push(`  border-radius: 4px;`);
        }

        if (node.layout) {
          if (node.layout.mode === "flex") {
            cssRules.push(`  display: flex;`);
            cssRules.push(
              `  flex-direction: ${node.layout.direction || "row"};`
            );
            if (node.layout.gap) {
              cssRules.push(
                `  gap: ${_normalizer.normalizeDimension(node.layout.gap)}px;`
              );
            }
            if (node.layout.padding) {
              cssRules.push(
                `  padding: ${_normalizer.normalizeDimension(
                  node.layout.padding
                )}px;`
              );
            }
          }
        }

        cssRules.push(`}`);

        // Generate base semantic component styles
        const baseCssClassName = baseClassName.replace(/-/g, "_");
        if (!cssRules.some((rule) => rule.includes(`.${baseCssClassName} {`))) {
          cssRules.push(`.${baseCssClassName} {`);
          if (semanticInfo.tagName === "button") {
            cssRules.push(`  cursor: pointer;`);
            cssRules.push(`  border: none;`);
            cssRules.push(`  background: transparent;`);
            cssRules.push(`  padding: 8px 16px;`);
            cssRules.push(`  border-radius: 4px;`);
            cssRules.push(`  transition: background-color 0.2s;`);
          }
          if (semanticInfo.tagName === "input") {
            cssRules.push(`  border: 1px solid #ccc;`);
            cssRules.push(`  padding: 8px 12px;`);
            cssRules.push(`  border-radius: 4px;`);
            cssRules.push(`  outline: none;`);
          }
          cssRules.push(`}`);
        }
      }

      // Generate CSS for text nodes
      if (node.type === "text") {
        const textClassName = `text-${node.name
          .toLowerCase()
          .replace(/\s+/g, "-")}`;
        const cssTextClassName = textClassName.replace(/-/g, "_");

        cssRules.push(`.${cssTextClassName} {`);
        if (node.textStyle) {
          if (node.textStyle.family) {
            cssRules.push(`  font-family: ${node.textStyle.family};`);
          }
          if (node.textStyle.size) {
            cssRules.push(
              `  font-size: ${_normalizer.normalizeDimension(
                node.textStyle.size
              )}px;`
            );
          }
          if (node.textStyle.weight) {
            cssRules.push(`  font-weight: ${node.textStyle.weight};`);
          }
          if (node.textStyle.color) {
            cssRules.push(`  color: ${node.textStyle.color};`);
          }
        }
        cssRules.push(`}`);
      }
    }

    return cssRules.join("\n");
  }

  /**
   * Generate index file that exports all components
   */
  private generateIndexFile(
    document: CanvasDocumentType
  ): GeneratedFile | null {
    const { clock } = this.options;

    const componentNames = document.artboards.map((artboard) =>
      this.pascalCase(artboard.name)
    );

    if (componentNames.length === 0) {
      return null;
    }

    const exports = componentNames
      .map((name) => `export { default as ${name} } from './${name}';`)
      .join("\n");

    const content = `// Generated at ${clock.now()}
// Component exports for ${document.name}

${exports}

export const components = {
${componentNames.map((name) => `  ${name}`).join(",\n")}
};`;

    return {
      path: "index.ts",
      content,
      type: "ts",
    };
  }

  /**
   * Count total nodes in document
   */
  private countNodes(document: CanvasDocumentType): number {
    let count = 0;

    // Use canvas-engine's traversal for consistency
    for (const _ of traverseDocument(document)) {
      count++;
    }

    return count;
  }

  /**
   * Convert string to PascalCase
   */
  private pascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");
  }

  /**
   * Generate a pattern key for node comparison
   */
  private generatePatternKey(node: NodeType): string {
    const { sorter: _sorter } = this.options;

    // Create a normalized representation for comparison
    const _normalized = {
      type: node.type,
      name: node.name,
      hasChildren:
        "children" in node && node.children && node.children.length > 0,
      childCount: "children" in node ? node.children?.length || 0 : 0,
      layout: "layout" in node ? node.layout : undefined,
      text: "text" in node ? node.text : undefined,
      componentKey: "componentKey" in node ? node.componentKey : undefined,
    };

    return this.generatePatternHash([node]);
  }

  /**
   * Generate a hash for pattern identification
   */
  private generatePatternHash(nodes: NodeType[]): string {
    const { sorter: _sorter } = this.options;

    // Create a canonical representation
    const canonical = JSON.stringify(nodes, (key, value) => {
      // Sort object keys for deterministic output
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        return Object.keys(value)
          .sort()
          .reduce((result, key) => {
            result[key] = value[key];
            return result;
          }, {} as any);
      }
      return value;
    });
    return this.simpleHash(canonical);
  }

  /**
   * Simple hash function for pattern identification
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Determine if a pattern is worth extracting as a component
   */
  private isWorthExtracting(nodes: NodeType[]): boolean {
    // Extract if:
    // 1. Has meaningful children (> 1 node)
    // 2. Is not too simple (single text node)
    // 3. Has semantic meaning (non-generic naming)

    const totalNodes = this.countNodesInArray(nodes);
    const hasChildren = nodes.some(
      (node) => "children" in node && node.children && node.children.length > 0
    );

    return totalNodes > 1 && hasChildren;
  }

  /**
   * Generate a component name from node structure
   */
  private generateComponentName(node: NodeType): string {
    // Use node name if it's descriptive
    if (node.name && !node.name.match(/^(frame|group|node)\d*$/i)) {
      return this.pascalCase(node.name);
    }

    // Otherwise generate from structure
    const childTypes =
      "children" in node && node.children
        ? node.children.map((child: NodeType) => child.type).join("")
        : node.type;

    return this.pascalCase(`${node.type}_${childTypes}_component`);
  }

  /**
   * Count nodes in an array (including children)
   */
  private countNodesInArray(nodes: NodeType[]): number {
    let count = 0;

    function countRecursive(nodeList: NodeType[]) {
      for (const node of nodeList) {
        count++;
        if ("children" in node && node.children) {
          countRecursive(node.children);
        }
      }
    }

    countRecursive(nodes);
    return count;
  }

  /**
   * Generate JSX for a single node with component reuse detection
   */
  private generateNodeJSX(node: NodeType, depth: number = 0): string {
    const { sorter: _sorter, normalizer: _normalizer } = this.options;
    const indent = "  ".repeat(depth);

    // Check if this node pattern should be replaced with a component reference
    const patternKey = this.generatePatternKey(node);
    const pattern = this.componentPatterns.get(patternKey);

    if (pattern && pattern.occurrences >= 2) {
      // Use component reference instead of inline JSX
      const componentName = pattern.name;
      return `${indent}<${componentName} />`;
    }

    // Generate inline JSX
    const semanticInfo = this.inferSemanticComponent(node);

    switch (node.type) {
      case "frame":
        return this.generateSemanticFrameJSX(node, semanticInfo, depth);
      case "text":
        return this.generateSemanticTextJSX(node, semanticInfo, depth);
      case "component":
        return this.generateComponentJSX(node, depth);
      default:
        return `${indent}<!-- Unsupported node type: ${node.type} -->`;
    }
  }

  /**
   * Generate props for component instances using passthrough information
   */
  private generatePropsForComponent(_node: NodeType): string | null {
    // For now, just pass through basic props
    // In a full implementation, this would analyze which props are needed
    // based on component contracts and passthrough information
    return null;
  }

  /**
   * Generate complete TSX content for a component (extracted or main)
   */
  private generateTSXContent(
    componentName: string,
    jsxContent: string,
    isExtracted: boolean = false
  ): string {
    const { clock, includeComments } = this.options;

    let content = "";

    if (includeComments) {
      content += `// Generated at ${clock.now()}\n`;
      content += `// Component ID: ${clock.uuid()}\n`;
      if (isExtracted) {
        content += `// Extracted reusable component\n`;
      }
    }

    content += `import s from './${componentName}.module.css';\n`;
    content += "\n";

    if (isExtracted) {
      // Export as named export for reuse
      content += `export function ${componentName}(props: Record<string, unknown> = {}) {\n`;
      content += `  return (\n`;
      content += `    <>\n`;
      content += `${jsxContent}\n`;
      content += `    </>\n`;
      content += `  );\n`;
      content += `}\n`;
    } else {
      // Default export for main components
      content += `export default function ${componentName}() {\n`;
      content += `  return (\n`;
      content += `    <>\n`;
      content += `${jsxContent}\n`;
      content += `    </>\n`;
      content += `  );\n`;
      content += `}\n`;
    }

    return content;
  }

  /**
   * Escape text content for JSX
   */
  private escapeText(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }
}

/**
 * Convenience function for generating React components
 */
export function generateReactComponents(
  document: CanvasDocumentType,
  options: CodeGenOptions & { componentIndexPath?: string } = {}
): GenerationResult {
  const generator = new ReactGenerator(options);
  return generator.generate(document, {
    componentIndexPath: options.componentIndexPath,
  });
}
