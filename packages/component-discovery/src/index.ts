/**
 * @fileoverview Advanced component discovery and auto-linting system
 * @author @darianrosebrook
 */

import * as fs from "node:fs";
import * as path from "node:path";
// import { generateAugmentedVariants } from "@paths-design/augment"; // TODO: Remove if not needed
import type { CanvasDocumentType, NodeType } from "@paths-design/canvas-schema";
import type { ComponentIndex } from "@paths-design/component-indexer";
import { glob } from "glob";
import type { TypeNode } from "ts-morph";
import { Project, Node as TsNode, SyntaxKind } from "ts-morph";

/**
 * Component discovery result
 */
export interface ComponentDiscoveryResult {
  discoveredComponents: DiscoveredComponent[];
  propAnalysis: PropAnalysisResult;
  subcomponentAnalysis: SubcomponentAnalysisResult;
  tokenAnalysis: TokenAnalysisResult;
  recommendations: Recommendation[];
  issues: Issue[];
}

/**
 * Discovered component information
 */
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
}

/**
 * Component prop information
 */
export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: unknown;
  description?: string;
  usedInDesign: boolean;
  suggestedSemanticKey?: string;
}

/**
 * Component usage analysis
 */
export interface ComponentUsage {
  instances: number;
  variants: string[];
  propsUsed: string[];
  semanticKeysUsed: string[];
  missingProps: string[];
}

/**
 * Prop analysis result
 */
export interface PropAnalysisResult {
  missingProps: MissingProp[];
  unusedProps: UnusedProp[];
  inconsistentDefaults: InconsistentDefault[];
  typeMismatches: TypeMismatch[];
}

/**
 * Missing prop information
 */
export interface MissingProp {
  componentName: string;
  propName: string;
  suggestedType: string;
  usageExamples: string[];
  confidence: number;
}

/**
 * Unused prop information
 */
export interface UnusedProp {
  componentName: string;
  propName: string;
  definedIn: string;
  suggestedAction: "remove" | "optional" | "deprecated";
}

/**
 * Inconsistent default information
 */
export interface InconsistentDefault {
  componentName: string;
  propName: string;
  definedDefault: unknown;
  usedDefault: unknown;
  suggestion: string;
}

/**
 * Type mismatch information
 */
export interface TypeMismatch {
  componentName: string;
  propName: string;
  definedType: string;
  usedType: string;
  location: string;
  suggestion: string;
}

/**
 * Subcomponent analysis result
 */
export interface SubcomponentAnalysisResult {
  potentialSubcomponents: PotentialSubcomponent[];
  reusablePatterns: ReusablePattern[];
  extractionSuggestions: ExtractionSuggestion[];
}

/**
 * Potential subcomponent
 */
export interface PotentialSubcomponent {
  name: string;
  nodes: string[];
  usageCount: number;
  complexity: number;
  extractionValue: number;
  suggestedProps: string[];
}

/**
 * Reusable pattern
 */
export interface ReusablePattern {
  pattern: string;
  occurrences: number;
  semanticKeys: string[];
  suggestedComponentName: string;
  complexity: number;
}

/**
 * Extraction suggestion
 */
export interface ExtractionSuggestion {
  componentName: string;
  reason: string;
  estimatedBenefit: number;
  breakingChanges: string[];
}

/**
 * Token analysis result
 */
export interface TokenAnalysisResult {
  usedTokens: UsedToken[];
  missingTokens: MissingToken[];
  inconsistentTokens: InconsistentToken[];
}

/**
 * Used token information
 */
export interface UsedToken {
  token: string;
  locations: string[];
  type: "color" | "spacing" | "typography" | "other";
  value?: string;
}

/**
 * Missing token information
 */
export interface MissingToken {
  token: string;
  suggestedValue: string;
  usageContext: string;
  priority: "high" | "medium" | "low";
}

/**
 * Inconsistent token information
 */
export interface InconsistentToken {
  token: string;
  values: string[];
  locations: string[];
  suggestion: string;
}

/**
 * Recommendation
 */
export interface Recommendation {
  type: "component" | "prop" | "token" | "pattern" | "accessibility";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  impact: string;
}

/**
 * Issue
 */
export interface Issue {
  type: "error" | "warning" | "info";
  title: string;
  description: string;
  location?: string;
  suggestion?: string;
}

/**
 * Advanced component discovery and analysis engine
 */
export class ComponentDiscoveryEngine {
  private componentIndex?: ComponentIndex;
  private project?: Project;

  constructor(componentIndex?: ComponentIndex) {
    this.componentIndex = componentIndex;
  }

  /**
   * Analyze a canvas document for component discovery and linting
   */
  async analyzeDocument(
    documentPath: string,
    sourceCodePaths?: string[]
  ): Promise<ComponentDiscoveryResult> {
    // Load canvas document
    const documentContent = fs.readFileSync(documentPath, "utf-8");
    const document = JSON.parse(documentContent) as CanvasDocumentType;

    // Initialize TypeScript project for source analysis
    if (sourceCodePaths) {
      this.project = new Project({
        tsConfigFilePath: path.join(process.cwd(), "tsconfig.json"),
      });

      for (const pattern of sourceCodePaths) {
        const files = await glob(pattern);
        files.forEach((file) => this.project!.addSourceFileAtPath(file));
      }
    }

    // Perform comprehensive analysis
    const discoveredComponents = await this.discoverComponents(document);
    const propAnalysis = this.analyzeProps(document, discoveredComponents);
    const subcomponentAnalysis = this.analyzeSubcomponents(document);
    const tokenAnalysis = this.analyzeTokens(document);
    const recommendations = this.generateRecommendations(
      discoveredComponents,
      propAnalysis,
      subcomponentAnalysis,
      tokenAnalysis
    );
    const issues = this.generateIssues(
      discoveredComponents,
      propAnalysis,
      subcomponentAnalysis,
      tokenAnalysis
    );

    return {
      discoveredComponents,
      propAnalysis,
      subcomponentAnalysis,
      tokenAnalysis,
      recommendations,
      issues,
    };
  }

  /**
   * Discover components from canvas document and source code
   */
  private async discoverComponents(
    document: CanvasDocumentType
  ): Promise<DiscoveredComponent[]> {
    const components: DiscoveredComponent[] = [];

    // Analyze component instances in the document
    this.analyzeComponentInstances(document, components);

    // Analyze source code for component definitions
    if (this.project) {
      await this.analyzeSourceCodeComponents(components);
    }

    return components;
  }

  /**
   * Analyze component instances in the document
   */
  private analyzeComponentInstances(
    document: CanvasDocumentType,
    components: DiscoveredComponent[]
  ): void {
    const componentInstances = new Map<
      string,
      { count: number; props: Set<string>; semanticKeys: Set<string> }
    >();

    function traverseNodes(nodes: NodeType[]): void {
      for (const node of nodes) {
        if (node.type === "component") {
          const componentKey = (node as any).componentKey;
          if (!componentInstances.has(componentKey)) {
            componentInstances.set(componentKey, {
              count: 0,
              props: new Set(),
              semanticKeys: new Set(),
            });
          }

          const instance = componentInstances.get(componentKey)!;
          instance.count++;
          Object.keys((node as any).props || {}).forEach((prop) =>
            instance.props.add(prop)
          );

          const semanticKey = (node as any).semanticKey;
          if (semanticKey) {
            instance.semanticKeys.add(semanticKey);
          }
        }

        if ("children" in node && node.children) {
          traverseNodes(node.children);
        }
      }
    }

    document.artboards.forEach((artboard) => {
      traverseNodes(artboard.children);
    });

    // Convert to component objects
    for (const [componentKey, usage] of componentInstances) {
      const component: DiscoveredComponent = {
        name: componentKey,
        filePath: "", // Would be determined from component index
        exportName: componentKey,
        type: "react", // Default assumption
        props: [],
        usage: {
          instances: usage.count,
          variants: [], // Would be analyzed from props
          propsUsed: Array.from(usage.props),
          semanticKeysUsed: Array.from(usage.semanticKeys),
          missingProps: [],
        },
        confidence: 0.8,
        suggestions: [],
      };

      components.push(component);
    }
  }

  /**
   * Analyze source code for component definitions
   */
  private async analyzeSourceCodeComponents(
    existingComponents: DiscoveredComponent[]
  ): Promise<void> {
    if (!this.project) {
      return;
    }

    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      // Look for React component definitions
      const components = sourceFile.getDescendantsOfKind(
        SyntaxKind.FunctionDeclaration
      );

      for (const component of components) {
        if (!TsNode.isFunctionDeclaration(component)) {
          continue;
        }
        const name = component.getName();
        if (!name) {
          continue;
        }

        // Check if this component is used in our canvas
        const canvasComponent = existingComponents.find((c) => c.name === name);
        if (!canvasComponent) {
          continue;
        }

        // Analyze props
        const props = this.analyzeComponentProps(component, canvasComponent);
        canvasComponent.props = props;
      }
    }
  }

  /**
   * Analyze component props from TypeScript AST
   */
  private analyzeComponentProps(
    component: TsNode,
    canvasComponent: DiscoveredComponent
  ): ComponentProp[] {
    const props: ComponentProp[] = [];

    // Look for props interface or type
    const propsType = this.findPropsType(component);
    if (!propsType) {
      return props;
    }

    const properties = propsType.getDescendantsOfKind(
      SyntaxKind.PropertySignature
    );

    for (const prop of properties) {
      if (!TsNode.isPropertySignature(prop)) {
        continue;
      }
      const name = prop.getName();
      const type = this.getTypeString(prop.getTypeNode());
      const required = !prop.hasQuestionToken();
      const defaultValue = this.extractDefaultValue(prop);

      // Check if this prop is used in design
      const usedInDesign = canvasComponent.usage.propsUsed.includes(name);

      // Suggest semantic keys for common props
      const suggestedSemanticKey = this.suggestSemanticKeyForProp(
        name,
        canvasComponent.name
      );

      props.push({
        name,
        type,
        required,
        defaultValue,
        usedInDesign,
        suggestedSemanticKey,
      });
    }

    return props;
  }

  /**
   * Find props type for a component
   */
  private findPropsType(component: TsNode): TsNode | undefined {
    // Look for props parameter
    const parameters = component.getDescendantsOfKind(SyntaxKind.Parameter);
    for (const param of parameters) {
      const type = param.asKind(SyntaxKind.Parameter)?.getTypeNode();
      if (type) {
        return type;
      }
    }
    return undefined;
  }

  /**
   * Get type string from TypeScript type node
   */
  private getTypeString(typeNode?: TypeNode): string {
    if (!typeNode) {
      return "unknown";
    }

    // Simple type extraction - in a real implementation, this would be more sophisticated
    const text = typeNode.getText();
    return text.replace(/\s+/g, " ");
  }

  /**
   * Extract default value from prop
   */
  private extractDefaultValue(_prop: TsNode): unknown {
    // Property signatures in TypeScript interfaces don't have initializers
    // Default values are typically set in the component implementation
    // This is a placeholder for future enhancement
    return undefined;
  }

  /**
   * Suggest semantic key for a prop
   */
  private suggestSemanticKeyForProp(
    propName: string,
    componentName: string
  ): string | undefined {
    const suggestions: Record<string, string> = {
      variant: `${componentName.toLowerCase()}.variant`,
      size: `${componentName.toLowerCase()}.size`,
      color: `${componentName.toLowerCase()}.color`,
      disabled: `${componentName.toLowerCase()}.disabled`,
      label: `${componentName.toLowerCase()}.label`,
      value: `${componentName.toLowerCase()}.value`,
    };

    return suggestions[propName];
  }

  /**
   * Analyze props for missing, unused, and type issues
   */
  private analyzeProps(
    document: CanvasDocumentType,
    discoveredComponents: DiscoveredComponent[]
  ): PropAnalysisResult {
    const missingProps: MissingProp[] = [];
    const unusedProps: UnusedProp[] = [];
    const inconsistentDefaults: InconsistentDefault[] = [];
    const typeMismatches: TypeMismatch[] = [];

    for (const component of discoveredComponents) {
      // Find props used in design but not defined in component
      const definedProps = new Set(component.props.map((p) => p.name));
      const usedProps = component.usage.propsUsed;

      for (const usedProp of usedProps) {
        if (!definedProps.has(usedProp)) {
          missingProps.push({
            componentName: component.name,
            propName: usedProp,
            suggestedType: this.inferPropType(usedProp),
            usageExamples: [usedProp],
            confidence: 0.7,
          });
        }
      }

      // Find props defined but not used in design
      for (const prop of component.props) {
        if (!prop.usedInDesign) {
          unusedProps.push({
            componentName: component.name,
            propName: prop.name,
            definedIn: component.filePath,
            suggestedAction: prop.required ? "remove" : "optional",
          });
        }
      }
    }

    return {
      missingProps,
      unusedProps,
      inconsistentDefaults,
      typeMismatches,
    };
  }

  /**
   * Infer prop type from usage
   */
  private inferPropType(propName: string): string {
    // Simple type inference based on prop name
    if (propName.includes("color") || propName.includes("Color")) {
      return "string";
    }
    if (
      propName.includes("size") ||
      propName.includes("width") ||
      propName.includes("height")
    ) {
      return "number";
    }
    if (
      propName.includes("disabled") ||
      propName.includes("visible") ||
      propName.includes("checked")
    ) {
      return "boolean";
    }
    return "string"; // Default
  }

  /**
   * Analyze subcomponents and reusable patterns
   */
  private analyzeSubcomponents(
    document: CanvasDocumentType
  ): SubcomponentAnalysisResult {
    const potentialSubcomponents: PotentialSubcomponent[] = [];
    const reusablePatterns: ReusablePattern[] = [];
    const extractionSuggestions: ExtractionSuggestion[] = [];

    // Find repeated patterns in the document
    const patterns = this.findRepeatedPatterns(document);

    for (const pattern of patterns) {
      if (pattern.occurrences >= 2) {
        reusablePatterns.push(pattern);
      }

      if (pattern.occurrences >= 3 && pattern.complexity > 5) {
        extractionSuggestions.push({
          componentName: pattern.suggestedComponentName,
          reason: `Pattern occurs ${pattern.occurrences} times with complexity ${pattern.complexity}`,
          estimatedBenefit: pattern.occurrences * 0.1, // Rough estimate
          breakingChanges: [],
        });
      }
    }

    return {
      potentialSubcomponents,
      reusablePatterns,
      extractionSuggestions,
    };
  }

  /**
   * Find repeated patterns in document
   */
  private findRepeatedPatterns(
    document: CanvasDocumentType
  ): ReusablePattern[] {
    const patterns: ReusablePattern[] = [];
    const nodeHashes = new Map<
      string,
      { nodes: string[]; occurrences: number }
    >();

    function hashNode(node: NodeType): string {
      // Create a hash based on node structure and properties
      const structure = {
        type: node.type,
        name: node.name,
        semanticKey: (node as any).semanticKey,
        childrenCount: "children" in node ? node.children?.length : 0,
      };

      return JSON.stringify(structure);
    }

    function traverseNodes(nodes: NodeType[]): void {
      for (const node of nodes) {
        const hash = hashNode(node);

        if (!nodeHashes.has(hash)) {
          nodeHashes.set(hash, { nodes: [], occurrences: 0 });
        }

        const pattern = nodeHashes.get(hash)!;
        pattern.nodes.push(node.id);
        pattern.occurrences++;

        if ("children" in node && node.children) {
          traverseNodes(node.children);
        }
      }
    }

    document.artboards.forEach((artboard) => {
      traverseNodes(artboard.children);
    });

    // Convert to reusable patterns
    for (const [hash, pattern] of nodeHashes) {
      if (pattern.occurrences >= 2) {
        const semanticKeys = pattern.nodes
          .map((nodeId) => {
            // Find node and get its semantic key
            return this.findNodeById(document, nodeId)?.semanticKey || "";
          })
          .filter((key) => key);

        patterns.push({
          pattern: hash,
          occurrences: pattern.occurrences,
          semanticKeys,
          suggestedComponentName: `Reusable${pattern.occurrences}Pattern`,
          complexity: pattern.nodes.length, // Simple complexity metric based on number of nodes
        });
      }
    }

    return patterns;
  }

  /**
   * Find node by ID
   */
  private findNodeById(
    document: CanvasDocumentType,
    nodeId: string
  ): NodeType | null {
    function searchNodes(nodes: NodeType[]): NodeType | null {
      for (const node of nodes) {
        if (node.id === nodeId) {
          return node;
        }

        if ("children" in node && node.children) {
          const found = searchNodes(node.children);
          if (found) {
            return found;
          }
        }
      }
      return null;
    }

    for (const artboard of document.artboards) {
      const found = searchNodes(artboard.children);
      if (found) {
        return found;
      }
    }

    return null;
  }

  /**
   * Analyze tokens used in the document
   */
  private analyzeTokens(document: CanvasDocumentType): TokenAnalysisResult {
    const usedTokens: UsedToken[] = [];
    const missingTokens: MissingToken[] = [];
    const inconsistentTokens: InconsistentToken[] = [];

    // Find all token references
    const tokenRefs = this.findTokenReferences(document);

    for (const tokenRef of tokenRefs) {
      // Check if token is defined (simplified - would check actual token files)
      const isDefined = this.isTokenDefined(tokenRef.token);

      if (!isDefined) {
        missingTokens.push({
          token: tokenRef.token,
          suggestedValue: this.suggestTokenValue(tokenRef.token, tokenRef.type),
          usageContext: tokenRef.location,
          priority: tokenRef.type === "color" ? "high" : "medium",
        });
      }
    }

    return {
      usedTokens,
      missingTokens,
      inconsistentTokens,
    };
  }

  /**
   * Find all token references in document
   */
  private findTokenReferences(
    document: CanvasDocumentType
  ): Array<{ token: string; location: string; type: UsedToken["type"] }> {
    const references: Array<{
      token: string;
      location: string;
      type: UsedToken["type"];
    }> = [];

    function traverse(obj: any, location = ""): void {
      if (typeof obj === "object" && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === "string" && value.startsWith("tokens.")) {
            const token = value;
            const type: UsedToken["type"] = key.includes("color")
              ? "color"
              : key.includes("space") ||
                key.includes("margin") ||
                key.includes("padding")
              ? "spacing"
              : key.includes("font") || key.includes("text")
              ? "typography"
              : "other";

            references.push({ token, location: `${location}.${key}`, type });
          }

          traverse(value, `${location}.${key}`);
        }
      }
    }

    traverse(document);
    return references;
  }

  /**
   * Check if token is defined (simplified)
   */
  private isTokenDefined(token: string): boolean {
    // In a real implementation, this would check token files
    const commonTokens = [
      "tokens.color.primary",
      "tokens.color.secondary",
      "tokens.color.text",
      "tokens.color.background",
      "tokens.space.small",
      "tokens.space.medium",
      "tokens.space.large",
    ];

    return commonTokens.includes(token);
  }

  /**
   * Suggest token value based on usage
   */
  private suggestTokenValue(token: string, type: UsedToken["type"]): string {
    const suggestions: Record<string, Record<string, string>> = {
      color: {
        primary: "#4F46E5",
        secondary: "#6B7280",
        text: "#1F2937",
        background: "#FFFFFF",
        surface: "#F9FAFB",
      },
      spacing: {
        small: "8px",
        medium: "16px",
        large: "24px",
        xlarge: "32px",
      },
      typography: {
        fontSize: "16px",
        lineHeight: "24px",
        fontWeight: "400",
      },
    };

    const _category = token.split(".")[1]; // color, space, typography
    const name = token.split(".").pop() || "";

    return suggestions[type]?.[name] || "#000000";
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    components: DiscoveredComponent[],
    propAnalysis: PropAnalysisResult,
    subcomponentAnalysis: SubcomponentAnalysisResult,
    _tokenAnalysis: TokenAnalysisResult
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Component recommendations
    for (const component of components) {
      if (component.usage.instances > 1) {
        recommendations.push({
          type: "component",
          priority: "high",
          title: `Consider extracting ${component.name} as reusable component`,
          description: `Component used ${component.usage.instances} times across design`,
          action: `Add ${component.name} to component index with semantic keys`,
          impact: "Reduces duplication and improves maintainability",
        });
      }
    }

    // Prop recommendations
    for (const missingProp of propAnalysis.missingProps) {
      recommendations.push({
        type: "prop",
        priority: "high",
        title: `Add missing prop "${missingProp.propName}" to ${missingProp.componentName}`,
        description: `Prop used in design but not defined in component`,
        action: `Add ${missingProp.propName} prop with type ${missingProp.suggestedType}`,
        impact: "Enables proper component usage in design",
      });
    }

    // Pattern recommendations
    for (const pattern of subcomponentAnalysis.reusablePatterns) {
      recommendations.push({
        type: "pattern",
        priority: "medium",
        title: `Extract reusable pattern "${pattern.suggestedComponentName}"`,
        description: `Pattern occurs ${pattern.occurrences} times`,
        action: `Create component from pattern and replace instances`,
        impact: "Improves design consistency and maintainability",
      });
    }

    return recommendations;
  }

  /**
   * Generate issues
   */
  private generateIssues(
    components: DiscoveredComponent[],
    propAnalysis: PropAnalysisResult,
    subcomponentAnalysis: SubcomponentAnalysisResult,
    tokenAnalysis: TokenAnalysisResult
  ): Issue[] {
    const issues: Issue[] = [];

    // Token issues
    for (const missingToken of tokenAnalysis.missingTokens) {
      issues.push({
        type: "warning",
        title: `Missing token: ${missingToken.token}`,
        description: `Token used in design but not defined`,
        location: missingToken.usageContext,
        suggestion: `Define token "${missingToken.token}" with value "${missingToken.suggestedValue}"`,
      });
    }

    return issues;
  }
}

/**
 * Component auto-discovery CLI
 */
export class ComponentAutoDiscovery {
  private engine: ComponentDiscoveryEngine;

  constructor(componentIndex?: ComponentIndex) {
    this.engine = new ComponentDiscoveryEngine(componentIndex);
  }

  /**
   * Analyze a project for component discovery
   */
  async analyzeProject(
    projectPath: string,
    options: {
      canvasFiles?: string[];
      sourceFiles?: string[];
      outputPath?: string;
      interactive?: boolean;
    } = {}
  ): Promise<ComponentDiscoveryResult> {
    const canvasFiles = options.canvasFiles || ["design/**/*.canvas.json"];
    const sourceFiles = options.sourceFiles || ["src/**/*.{ts,tsx,js,jsx}"];

    console.log("🔍 Starting component discovery analysis...");
    console.log(`📁 Project: ${projectPath}`);
    console.log(`🎨 Canvas files: ${canvasFiles.join(", ")}`);
    console.log(`💻 Source files: ${sourceFiles.join(", ")}`);

    // For demo, we'll analyze a single canvas document
    const canvasPath = path.join(projectPath, "design", "hero.canvas.json");

    if (!fs.existsSync(canvasPath)) {
      console.log(
        "❌ Canvas document not found, creating example for demonstration"
      );
      return this.createExampleAnalysis();
    }

    return this.engine.analyzeDocument(
      canvasPath,
      sourceFiles.map((p) => path.join(projectPath, p))
    );
  }

  /**
   * Create example analysis for demonstration
   */
  private createExampleAnalysis(): ComponentDiscoveryResult {
    return {
      discoveredComponents: [
        {
          name: "Button",
          filePath: "src/ui/Button.tsx",
          exportName: "Button",
          type: "react",
          props: [
            {
              name: "variant",
              type: '"primary" | "secondary" | "danger"',
              required: false,
              defaultValue: "primary",
              usedInDesign: true,
              suggestedSemanticKey: "cta.variant",
            },
            {
              name: "size",
              type: '"small" | "medium" | "large"',
              required: false,
              defaultValue: "medium",
              usedInDesign: true,
              suggestedSemanticKey: "cta.size",
            },
            {
              name: "disabled",
              type: "boolean",
              required: false,
              defaultValue: false,
              usedInDesign: false,
            },
          ],
          usage: {
            instances: 3,
            variants: ["primary", "secondary"],
            propsUsed: ["variant", "size"],
            semanticKeysUsed: ["cta.primary", "cta.secondary"],
            missingProps: ["label"],
          },
          confidence: 0.9,
          suggestions: [
            "Add label prop for better accessibility",
            "Consider extracting as reusable component",
          ],
        },
      ],
      propAnalysis: {
        missingProps: [
          {
            componentName: "Button",
            propName: "label",
            suggestedType: "string",
            usageExamples: ["Get Started", "Submit", "Cancel"],
            confidence: 0.8,
          },
        ],
        unusedProps: [
          {
            componentName: "Button",
            propName: "disabled",
            definedIn: "src/ui/Button.tsx",
            suggestedAction: "optional",
          },
        ],
        inconsistentDefaults: [],
        typeMismatches: [],
      },
      subcomponentAnalysis: {
        potentialSubcomponents: [
          {
            name: "HeroSection",
            nodes: ["hero-title", "hero-subtitle", "cta-button"],
            usageCount: 1,
            complexity: 8,
            extractionValue: 0.7,
            suggestedProps: ["title", "subtitle", "ctaText", "ctaVariant"],
          },
        ],
        reusablePatterns: [
          {
            pattern: "button-with-text",
            occurrences: 3,
            semanticKeys: ["cta.primary", "cta.secondary"],
            suggestedComponentName: "ButtonWithText",
            complexity: 2,
          },
        ],
        extractionSuggestions: [
          {
            componentName: "HeroSection",
            reason: "Complex pattern with multiple related elements",
            estimatedBenefit: 0.8,
            breakingChanges: [],
          },
        ],
      },
      tokenAnalysis: {
        usedTokens: [
          {
            token: "tokens.color.primary",
            locations: ["button.variant"],
            type: "color",
            value: "#4F46E5",
          },
          {
            token: "tokens.color.text",
            locations: ["text.color"],
            type: "color",
            value: "#1F2937",
          },
        ],
        missingTokens: [
          {
            token: "tokens.color.secondary",
            suggestedValue: "#6B7280",
            usageContext: "button.secondary",
            priority: "medium",
          },
        ],
        inconsistentTokens: [],
      },
      recommendations: [
        {
          type: "component",
          priority: "high",
          title: "Extract reusable Button component",
          description: "Button used 3 times with consistent props",
          action: "Add Button to component index with semantic keys",
          impact: "Reduces duplication and improves maintainability",
        },
        {
          type: "prop",
          priority: "high",
          title: "Add label prop to Button component",
          description:
            "Button instances use text content that should be a prop",
          action: "Add string label prop to Button component",
          impact: "Enables better component reusability",
        },
      ],
      issues: [
        {
          type: "warning",
          title: "Missing design token",
          description: "tokens.color.secondary used but not defined",
          suggestion:
            'Add tokens.color.secondary = "#6B7280" to your token file',
        },
      ],
    };
  }
}

/**
 * Convenience function for component discovery
 */
export function discoverComponents(
  documentPath: string,
  options: {
    sourceCodePaths?: string[];
    componentIndex?: ComponentIndex;
  } = {}
): Promise<ComponentDiscoveryResult> {
  const engine = new ComponentDiscoveryEngine(options.componentIndex);
  return engine.analyzeDocument(documentPath, options.sourceCodePaths);
}

/**
 * Convenience function for auto-discovery
 */
export function runAutoDiscovery(
  projectPath: string,
  options: {
    canvasFiles?: string[];
    sourceFiles?: string[];
    outputPath?: string;
    interactive?: boolean;
  } = {}
): Promise<ComponentDiscoveryResult> {
  const discovery = new ComponentAutoDiscovery();
  return discovery.analyzeProject(projectPath, options);
}
