/**
 * @fileoverview Data augmentation system for Designer canvas documents
 * @author @darianrosebrook
 */

import type { CanvasDocumentType, NodeType, FrameNodeType } from "@paths-design/canvas-schema";
import { ulid } from "ulidx";
import * as fc from "fast-check";

/**
 * Augmentation configuration
 */
export interface AugmentationConfig {
  layoutPerturbation?: {
    enabled: boolean;
    tolerance: number; // Percentage of original size (0.0-1.0)
  };
  tokenPermutation?: {
    enabled: boolean;
    tokenMap?: Record<string, string[]>;
  };
  propFuzzing?: {
    enabled: boolean;
    componentIndex?: ComponentIndex;
  };
  svgFuzzing?: {
    enabled: boolean;
    windingRuleVariation: boolean;
    strokeWidthVariation: boolean;
  };
}

/**
 * Component index for prop fuzzing
 */
export interface ComponentIndex {
  version: string;
  components: Record<string, {
    props: Array<{
      name: string;
      type: string;
      enum?: string[];
      defaultValue?: unknown;
    }>;
  }>;
}

/**
 * Augmented document result
 */
export interface AugmentedDocument {
  original: CanvasDocumentType;
  augmented: CanvasDocumentType;
  transformations: TransformationRecord[];
}

/**
 * Transformation record for tracking changes
 */
export interface TransformationRecord {
  type: "layout" | "token" | "prop" | "svg";
  nodeId: string;
  nodePath: string;
  description: string;
  before?: unknown;
  after?: unknown;
}

/**
 * Main augmentation engine
 */
export class AugmentationEngine {
  private config: AugmentationConfig;

  constructor(config: AugmentationConfig = {}) {
    this.config = {
      layoutPerturbation: { enabled: true, tolerance: 0.1 },
      tokenPermutation: { enabled: true },
      propFuzzing: { enabled: true },
      svgFuzzing: { enabled: true, windingRuleVariation: true, strokeWidthVariation: true },
      ...config,
    };
  }

  /**
   * Generate augmented variants of a canvas document
   */
  async generateAugmentedVariants(
    document: CanvasDocumentType,
    count: number = 10
  ): Promise<AugmentedDocument[]> {
    const variants: AugmentedDocument[] = [];

    for (let i = 0; i < count; i++) {
      const variant = await this.augmentDocument(document);
      variants.push(variant);
    }

    return variants;
  }

  /**
   * Augment a single document
   */
  async augmentDocument(document: CanvasDocumentType): Promise<AugmentedDocument> {
    const transformations: TransformationRecord[] = [];
    const augmented = JSON.parse(JSON.stringify(document)) as CanvasDocumentType;

    // Apply layout perturbations
    if (this.config.layoutPerturbation?.enabled) {
      this.applyLayoutPerturbations(augmented, transformations);
    }

    // Apply token permutations
    if (this.config.tokenPermutation?.enabled) {
      this.applyTokenPermutations(augmented, transformations);
    }

    // Apply prop fuzzing
    if (this.config.propFuzzing?.enabled) {
      this.applyPropFuzzing(augmented, transformations);
    }

    // Apply SVG fuzzing
    if (this.config.svgFuzzing?.enabled) {
      this.applySVGFuzzing(augmented, transformations);
    }

    return {
      original: document,
      augmented,
      transformations,
    };
  }

  /**
   * Apply layout perturbations to frames
   */
  private applyLayoutPerturbations(
    document: CanvasDocumentType,
    transformations: TransformationRecord[]
  ): void {
    const tolerance = this.config.layoutPerturbation!.tolerance;

    function perturbNode(node: NodeType, path: string): void {
      if (node.type === "frame" && "frame" in node) {
        const frame = node.frame;
        const perturbation = tolerance * 0.5; // ±50% of tolerance

        // Perturb position and size within tolerance bounds
        const xPerturb = (Math.random() - 0.5) * frame.width * tolerance;
        const yPerturb = (Math.random() - 0.5) * frame.height * tolerance;
        const widthPerturb = (Math.random() - 0.5) * frame.width * perturbation;
        const heightPerturb = (Math.random() - 0.5) * frame.height * perturbation;

        transformations.push({
          type: "layout",
          nodeId: node.id,
          nodePath: path,
          description: `Perturbed frame coordinates by ${Math.round(tolerance * 100)}%`,
          before: { ...frame },
          after: {
            x: Math.max(0, frame.x + xPerturb),
            y: Math.max(0, frame.y + yPerturb),
            width: Math.max(10, frame.width + widthPerturb),
            height: Math.max(10, frame.height + heightPerturb),
          },
        });

        // Apply the perturbation
        node.frame = transformations[transformations.length - 1].after as any;
      }

      // Recurse into children
      if ("children" in node && node.children) {
        node.children.forEach((child: NodeType, index: number) => {
          perturbNode(child, `${path}.children[${index}]`);
        });
      }
    }

    document.artboards.forEach((artboard: any, index: number) => {
      artboard.children.forEach((node: NodeType, nodeIndex: number) => {
        perturbNode(node, `artboards[${index}].children[${nodeIndex}]`);
      });
    });
  }

  /**
   * Apply token permutations
   */
  private applyTokenPermutations(
    document: CanvasDocumentType,
    transformations: TransformationRecord[]
  ): void {
    // Define common token permutations for testing
    const tokenPermutations: Record<string, string[]> = {
      "tokens.color.surface": ["tokens.color.background", "tokens.color.primary"],
      "tokens.color.background": ["tokens.color.surface", "tokens.color.secondary"],
      "tokens.color.primary": ["tokens.color.secondary", "tokens.color.accent"],
      "tokens.color.text": ["tokens.color.textSecondary", "tokens.color.textInverse"],
      ...this.config.tokenPermutation?.tokenMap,
    };

    // Find all token references in the document
    function findTokens(obj: any, path = ""): Array<{ path: string; token: string }> {
      const tokens: Array<{ path: string; token: string }> = [];

      if (typeof obj === "object" && obj !== null) {
        if (typeof obj.color === "string" && obj.color.startsWith("tokens.")) {
          tokens.push({ path: `${path}.color`, token: obj.color });
        }

        if (obj.bind?.token) {
          tokens.push({ path: `${path}.bind.token`, token: obj.bind.token });
        }

        for (const [key, value] of Object.entries(obj)) {
          tokens.push(...findTokens(value, `${path}.${key}`));
        }
      }

      return tokens;
    }

    const allTokens = findTokens(document);

    // Apply permutations to a subset of tokens
    const tokensToPermute = allTokens.slice(0, Math.min(3, allTokens.length));

    tokensToPermute.forEach(({ path, token }) => {
      const permutations = tokenPermutations[token];
      if (permutations && permutations.length > 0) {
        const newToken = permutations[Math.floor(Math.random() * permutations.length)];

        transformations.push({
          type: "token",
          nodeId: "", // Token-level transformation
          nodePath: path,
          description: `Swapped token ${token} → ${newToken}`,
          before: token,
          after: newToken,
        });

        // Apply the token swap (simplified - would need proper path resolution)
        // For now, just log that we would apply the transformation
        // In a real implementation, this would use a proper JSON path library
        console.log(`Would apply token swap: ${token} → ${newToken} at path: ${path}`);
      }
    });
  }

  /**
   * Apply prop fuzzing based on component contracts
   */
  private applyPropFuzzing(
    document: CanvasDocumentType,
    transformations: TransformationRecord[]
  ): void {
    const componentIndex = this.config.propFuzzing?.componentIndex;

    function fuzzNode(node: NodeType, path: string): void {
      if (node.type === "component" && node.componentKey && componentIndex) {
        const component = componentIndex.components[node.componentKey];
        if (component?.props) {
          // Fuzz a subset of props
          const propsToFuzz = component.props.slice(0, Math.min(2, component.props.length));

          propsToFuzz.forEach((prop) => {
            if (prop.enum && prop.enum.length > 0) {
              const newValue = prop.enum[Math.floor(Math.random() * prop.enum.length)];
              const oldValue = node.props?.[prop.name];

              if (newValue !== oldValue) {
                transformations.push({
                  type: "prop",
                  nodeId: node.id,
                  nodePath: `${path}.props.${prop.name}`,
                  description: `Fuzzed prop ${prop.name}: ${oldValue} → ${newValue}`,
                  before: oldValue,
                  after: newValue,
                });

                if (!node.props) node.props = {};
                node.props[prop.name] = newValue;
              }
            }
          });
        }
      }

      // Recurse into children
      if ("children" in node && node.children) {
        node.children.forEach((child: NodeType, index: number) => {
          fuzzNode(child, `${path}.children[${index}]`);
        });
      }
    }

    document.artboards.forEach((artboard: any, index: number) => {
      artboard.children.forEach((node: NodeType, nodeIndex: number) => {
        fuzzNode(node, `artboards[${index}].children[${nodeIndex}]`);
      });
    });
  }

  /**
   * Apply SVG fuzzing to vector nodes
   */
  private applySVGFuzzing(
    document: CanvasDocumentType,
    transformations: TransformationRecord[]
  ): void {
    const engine = this; // Capture this context
    function fuzzNode(node: NodeType, path: string): void {
      if (node.type === "vector") {
        const vectorNode = node as any;

        if (engine.config.svgFuzzing?.windingRuleVariation && vectorNode.windingRule) {
          const oldRule = vectorNode.windingRule;
          const newRule = oldRule === "nonzero" ? "evenodd" : "nonzero";

          transformations.push({
            type: "svg",
            nodeId: node.id,
            nodePath: `${path}.windingRule`,
            description: `Changed winding rule: ${oldRule} → ${newRule}`,
            before: oldRule,
            after: newRule,
          });

          vectorNode.windingRule = newRule;
        }

        // Could add stroke width variation here if stroke data existed
      }

      // Recurse into children
      if ("children" in node && node.children) {
        node.children.forEach((child: NodeType, index: number) => {
          fuzzNode(child, `${path}.children[${index}]`);
        });
      }
    }

    document.artboards.forEach((artboard: any, index: number) => {
      artboard.children.forEach((node: NodeType, nodeIndex: number) => {
        fuzzNode(node, `artboards[${index}].children[${nodeIndex}]`);
      });
    });
  }
}

/**
 * Property-based generators for canvas documents
 */
export class CanvasGenerators {
  /**
   * Generate arbitrary canvas documents for property-based testing
   */
  static canvasDocument(): fc.Arbitrary<CanvasDocumentType> {
    return fc.record({
      schemaVersion: fc.constant("0.1.0"),
      id: fc.stringMatching(/^[0-9A-HJKMNP-TV-Z]{26}$/),
      name: fc.string(),
      artboards: fc.array(this.artboard(), { minLength: 1 }),
    });
  }

  /**
   * Generate arbitrary artboards
   */
  static artboard(): fc.Arbitrary<any> {
    return fc.record({
      id: fc.stringMatching(/^[0-9A-HJKMNP-TV-Z]{26}$/),
      name: fc.string(),
      frame: fc.record({
        x: fc.nat(),
        y: fc.nat(),
        width: fc.integer({ min: 1, max: 2000 }),
        height: fc.integer({ min: 1, max: 2000 }),
      }),
      children: fc.array(fc.oneof(this.textNode(), this.vectorNode(), this.imageNode(), this.componentInstanceNode()), { maxLength: 10 }),
    });
  }

  /**
   * Generate arbitrary nodes (simplified to avoid circular references)
   */
  static node(): fc.Arbitrary<NodeType> {
    return fc.oneof(
      this.textNode(),
      this.vectorNode(),
      this.imageNode(),
      this.componentInstanceNode()
    );
  }

  /**
   * Generate frame nodes
   */
  static frameNode(): fc.Arbitrary<FrameNodeType> {
    return fc.record({
      id: fc.stringMatching(/^[0-9A-HJKMNP-TV-Z]{26}$/),
      type: fc.constant("frame"),
      name: fc.string(),
      visible: fc.boolean(),
      frame: fc.record({
        x: fc.nat(),
        y: fc.nat(),
        width: fc.integer({ min: 1, max: 1000 }),
        height: fc.integer({ min: 1, max: 1000 }),
      }),
      style: fc.oneof(
        fc.record({
          fills: fc.array(fc.anything()),
          strokes: fc.array(fc.anything()),
          radius: fc.nat(),
          opacity: fc.float({ min: 0, max: 1 }),
        }),
        fc.constant(undefined)
      ),
      data: fc.oneof(fc.record({}), fc.constant(undefined)),
      bind: fc.oneof(fc.record({}), fc.constant(undefined)),
      semanticKey: fc.oneof(
        fc.stringMatching(/^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*$/),
        fc.constant(undefined)
      ),
      layout: fc.oneof(
        fc.record({
          mode: fc.oneof(fc.constant("absolute"), fc.constant("flex"), fc.constant("grid")),
          direction: fc.oneof(fc.constant("row"), fc.constant("column"), fc.constant(undefined)),
          gap: fc.oneof(fc.nat(), fc.constant(undefined)),
          padding: fc.oneof(fc.nat(), fc.constant(undefined)),
        }),
        fc.constant(undefined)
      ),
      children: fc.array(fc.oneof(this.textNode(), this.vectorNode(), this.imageNode(), this.componentInstanceNode()), { maxLength: 5 }),
    });
  }

  /**
   * Generate text nodes
   */
  static textNode(): fc.Arbitrary<any> {
    return fc.record({
      id: fc.stringMatching(/^[0-9A-HJKMNP-TV-Z]{26}$/),
      type: fc.constant("text"),
      name: fc.string(),
      visible: fc.boolean(),
      frame: fc.record({
        x: fc.nat(),
        y: fc.nat(),
        width: fc.integer({ min: 1, max: 500 }),
        height: fc.integer({ min: 1, max: 100 }),
      }),
      style: fc.oneof(
        fc.record({
          fills: fc.array(fc.anything()),
          strokes: fc.array(fc.anything()),
          radius: fc.nat(),
          opacity: fc.float({ min: 0, max: 1 }),
        }),
        fc.constant(undefined)
      ),
      data: fc.oneof(fc.record({}), fc.constant(undefined)),
      bind: fc.oneof(fc.record({}), fc.constant(undefined)),
      semanticKey: fc.oneof(
        fc.stringMatching(/^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*$/),
        fc.constant(undefined)
      ),
      text: fc.string(),
      textStyle: fc.oneof(
        fc.record({
          family: fc.oneof(fc.string(), fc.constant(undefined)),
          size: fc.oneof(fc.integer({ min: 8, max: 72 }), fc.constant(undefined)),
          lineHeight: fc.oneof(fc.integer({ min: 8, max: 100 }), fc.constant(undefined)),
          weight: fc.oneof(fc.constant("normal"), fc.constant("bold"), fc.constant(undefined)),
          letterSpacing: fc.oneof(fc.integer({ min: -10, max: 10 }), fc.constant(undefined)),
          color: fc.oneof(fc.string(), fc.constant(undefined)),
        }),
        fc.constant(undefined)
      ),
    });
  }

  /**
   * Generate vector nodes
   */
  static vectorNode(): fc.Arbitrary<any> {
    return fc.record({
      id: fc.stringMatching(/^[0-9A-HJKMNP-TV-Z]{26}$/),
      type: fc.constant("vector"),
      name: fc.string(),
      visible: fc.boolean(),
      frame: fc.record({
        x: fc.nat(),
        y: fc.nat(),
        width: fc.integer({ min: 1, max: 500 }),
        height: fc.integer({ min: 1, max: 500 }),
      }),
      style: fc.oneof(
        fc.record({
          fills: fc.array(fc.anything()),
          strokes: fc.array(fc.anything()),
          radius: fc.nat(),
          opacity: fc.float({ min: 0, max: 1 }),
        }),
        fc.constant(undefined)
      ),
      data: fc.oneof(fc.record({}), fc.constant(undefined)),
      bind: fc.oneof(fc.record({}), fc.constant(undefined)),
      semanticKey: fc.oneof(
        fc.stringMatching(/^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*$/),
        fc.constant(undefined)
      ),
      path: fc.string(),
      windingRule: fc.oneof(fc.constant("nonzero"), fc.constant("evenodd")),
    });
  }

  /**
   * Generate image nodes
   */
  static imageNode(): fc.Arbitrary<any> {
    return fc.record({
      id: fc.stringMatching(/^[0-9A-HJKMNP-TV-Z]{26}$/),
      type: fc.constant("image"),
      name: fc.string(),
      visible: fc.boolean(),
      frame: fc.record({
        x: fc.nat(),
        y: fc.nat(),
        width: fc.integer({ min: 1, max: 500 }),
        height: fc.integer({ min: 1, max: 500 }),
      }),
      style: fc.oneof(
        fc.record({
          fills: fc.array(fc.anything()),
          strokes: fc.array(fc.anything()),
          radius: fc.nat(),
          opacity: fc.float({ min: 0, max: 1 }),
        }),
        fc.constant(undefined)
      ),
      data: fc.oneof(fc.record({}), fc.constant(undefined)),
      bind: fc.oneof(fc.record({}), fc.constant(undefined)),
      semanticKey: fc.oneof(
        fc.stringMatching(/^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*$/),
        fc.constant(undefined)
      ),
      src: fc.string(),
      mode: fc.oneof(fc.constant("cover"), fc.constant("contain"), fc.constant("fill"), fc.constant("none")),
    });
  }

  /**
   * Generate component instance nodes
   */
  static componentInstanceNode(): fc.Arbitrary<any> {
    return fc.record({
      id: fc.stringMatching(/^[0-9A-HJKMNP-TV-Z]{26}$/),
      type: fc.constant("component"),
      name: fc.string(),
      visible: fc.boolean(),
      frame: fc.record({
        x: fc.nat(),
        y: fc.nat(),
        width: fc.integer({ min: 1, max: 500 }),
        height: fc.integer({ min: 1, max: 500 }),
      }),
      style: fc.oneof(
        fc.record({
          fills: fc.array(fc.anything()),
          strokes: fc.array(fc.anything()),
          radius: fc.nat(),
          opacity: fc.float({ min: 0, max: 1 }),
        }),
        fc.constant(undefined)
      ),
      data: fc.oneof(fc.record({}), fc.constant(undefined)),
      bind: fc.oneof(fc.record({}), fc.constant(undefined)),
      semanticKey: fc.oneof(
        fc.stringMatching(/^[a-z][a-z0-9]*(\.[a-z0-9]+|\[[0-9]+\])*$/),
        fc.constant(undefined)
      ),
      componentKey: fc.string(),
      props: fc.record({}),
    });
  }
}

/**
 * Convenience function for creating augmentation engine
 */
export function createAugmentationEngine(config?: AugmentationConfig): AugmentationEngine {
  return new AugmentationEngine(config);
}

/**
 * Convenience function for generating augmented variants
 */
export async function generateAugmentedVariants(
  document: CanvasDocumentType,
  count?: number,
  config?: AugmentationConfig
): Promise<AugmentedDocument[]> {
  const engine = createAugmentationEngine(config);
  return engine.generateAugmentedVariants(document, count);
}
