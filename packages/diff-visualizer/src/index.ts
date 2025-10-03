/**
 * @fileoverview Semantic key-aware diff visualization for human-readable PR reviews
 * @author @darianrosebrook
 */

import type {
  CanvasDocumentType,
  NodeType,
  ArtboardType,
} from "@paths-design/canvas-schema";

/**
 * Diff result types
 */
export type DiffType = "added" | "removed" | "modified" | "moved";

/**
 * Node path for tracking node locations
 */
export type NodePath = (string | number)[];

/**
 * Semantic diff result
 */
export interface SemanticDiff {
  type: DiffType;
  nodeId: string;
  semanticKey?: string;
  description: string;
  oldPath?: NodePath;
  newPath?: NodePath;
  changes?: PropertyChange[];
}

/**
 * Property change within a node
 */
export interface PropertyChange {
  property: string;
  oldValue?: unknown;
  newValue?: unknown;
  description: string;
}

/**
 * Complete diff comparison result
 */
export interface DiffResult {
  summary: DiffSummary;
  nodeDiffs: SemanticDiff[];
  propertyChanges: PropertyChange[];
}

/**
 * High-level diff summary
 */
export interface DiffSummary {
  totalChanges: number;
  addedNodes: number;
  removedNodes: number;
  modifiedNodes: number;
  movedNodes: number;
  semanticChanges: number;
  structuralChanges: number;
}

/**
 * Semantic diff visualizer
 */
export class DiffVisualizer {
  /**
   * Compare two canvas documents and generate semantic diffs
   */
  compareDocuments(
    oldDocument: CanvasDocumentType,
    newDocument: CanvasDocumentType
  ): DiffResult {
    const nodeDiffs: SemanticDiff[] = [];
    const propertyChanges: PropertyChange[] = [];

    // Compare artboards
    this.compareArtboards(oldDocument, newDocument, nodeDiffs, propertyChanges);

    // Generate summary
    const summary = this.generateSummary(nodeDiffs, propertyChanges);

    return {
      summary,
      nodeDiffs,
      propertyChanges,
    };
  }

  /**
   * Compare artboards between documents
   */
  private compareArtboards(
    oldDoc: CanvasDocumentType,
    newDoc: CanvasDocumentType,
    nodeDiffs: SemanticDiff[],
    propertyChanges: PropertyChange[]
  ): void {
    const oldArtboards = new Map<string, ArtboardType>(
      oldDoc.artboards.map((ab: ArtboardType) => [ab.id, ab])
    );
    const newArtboards = new Map<string, ArtboardType>(
      newDoc.artboards.map((ab: ArtboardType) => [ab.id, ab])
    );

    // Find removed artboards
    for (const [id, oldArtboard] of oldArtboards) {
      if (!newArtboards.has(id)) {
        nodeDiffs.push({
          type: "removed",
          nodeId: id,
          description: `Removed artboard "${oldArtboard.name}"`,
          oldPath: [
            `artboards[${oldDoc.artboards.indexOf(oldArtboard as any)}]`,
          ],
        });
      }
    }

    // Find added/modified artboards
    for (const [id, newArtboard] of newArtboards) {
      if (!oldArtboards.has(id)) {
        nodeDiffs.push({
          type: "added",
          nodeId: id,
          description: `Added artboard "${newArtboard.name}"`,
          newPath: [
            `artboards[${newDoc.artboards.indexOf(newArtboard as any)}]`,
          ],
        });
      } else {
        const oldArtboard = oldArtboards.get(id)!;
        this.compareArtboardNodes(
          oldArtboard,
          newArtboard,
          nodeDiffs,
          propertyChanges
        );
      }
    }
  }

  /**
   * Compare nodes within an artboard
   */
  private compareArtboardNodes(
    oldArtboard: ArtboardType,
    newArtboard: ArtboardType,
    nodeDiffs: SemanticDiff[],
    propertyChanges: PropertyChange[]
  ): void {
    // Create maps of nodes by ID for efficient lookup
    const oldNodes = new Map<string, { node: NodeType; path: NodePath }>();
    const newNodes = new Map<string, { node: NodeType; path: NodePath }>();

    // Build old node map
    this.buildNodeMap(oldArtboard.children, [], oldNodes);

    // Build new node map
    this.buildNodeMap(newArtboard.children, [], newNodes);

    // Find removed nodes
    for (const [id, { node: oldNode, path: oldPath }] of oldNodes) {
      if (!newNodes.has(id)) {
        nodeDiffs.push({
          type: "removed",
          nodeId: id,
          semanticKey: (oldNode as any).semanticKey,
          description: `Removed ${this.describeNode(oldNode)}`,
          oldPath,
        });
      }
    }

    // Find added/modified nodes
    for (const [id, { node: newNode, path: newPath }] of newNodes) {
      if (!oldNodes.has(id)) {
        nodeDiffs.push({
          type: "added",
          nodeId: id,
          semanticKey: (newNode as any).semanticKey,
          description: `Added ${this.describeNode(newNode)}`,
          newPath,
        });
      } else {
        const { node: oldNode, path: oldPath } = oldNodes.get(id)!;
        this.compareNodes(
          oldNode,
          newNode,
          oldPath,
          newPath,
          nodeDiffs,
          propertyChanges
        );
      }
    }
  }

  /**
   * Compare two individual nodes
   */
  private compareNodes(
    oldNode: NodeType,
    newNode: NodeType,
    oldPath: NodePath,
    newPath: NodePath,
    nodeDiffs: SemanticDiff[],
    propertyChanges: PropertyChange[]
  ): void {
    // Check if node moved (same ID but different path)
    if (JSON.stringify(oldPath) !== JSON.stringify(newPath)) {
      nodeDiffs.push({
        type: "moved",
        nodeId: oldNode.id,
        semanticKey: (oldNode as any).semanticKey,
        description: `Moved ${this.describeNode(
          oldNode
        )} from ${this.pathToString(oldPath)} to ${this.pathToString(newPath)}`,
        oldPath,
        newPath,
      });
      return;
    }

    // Compare node properties
    const changes = this.compareNodeProperties(oldNode, newNode);
    if (changes.length > 0) {
      propertyChanges.push(...changes);
    }

    // Compare children if both nodes have them
    if ("children" in oldNode && "children" in newNode) {
      this.compareChildNodes(
        oldNode.children,
        newNode.children,
        [...oldPath, "children"],
        nodeDiffs,
        propertyChanges
      );
    }
  }

  /**
   * Compare child nodes recursively
   */
  private compareChildNodes(
    oldChildren: NodeType[],
    newChildren: NodeType[],
    parentPath: NodePath,
    nodeDiffs: SemanticDiff[],
    propertyChanges: PropertyChange[]
  ): void {
    const oldChildMap = new Map(
      oldChildren.map((child, index) => [child.id, { child, index }])
    );
    const newChildMap = new Map(
      newChildren.map((child, index) => [child.id, { child, index }])
    );

    // Find removed children
    for (const [id, { child: oldChild, index }] of oldChildMap) {
      if (!newChildMap.has(id)) {
        nodeDiffs.push({
          type: "removed",
          nodeId: id,
          semanticKey: (oldChild as any).semanticKey,
          description: `Removed child ${this.describeNode(oldChild)}`,
          oldPath: [...parentPath, index],
        });
      }
    }

    // Find added/modified children
    for (const [id, { child: newChild, index }] of newChildMap) {
      if (!oldChildMap.has(id)) {
        nodeDiffs.push({
          type: "added",
          nodeId: id,
          semanticKey: (newChild as any).semanticKey,
          description: `Added child ${this.describeNode(newChild)}`,
          newPath: [...parentPath, index],
        });
      } else {
        const { child: oldChild, index: oldIndex } = oldChildMap.get(id)!;
        const oldPath = [...parentPath, oldIndex];
        const newPath = [...parentPath, index];

        this.compareNodes(
          oldChild,
          newChild,
          oldPath,
          newPath,
          nodeDiffs,
          propertyChanges
        );
      }
    }
  }

  /**
   * Compare properties of two nodes
   */
  private compareNodeProperties(
    oldNode: NodeType,
    newNode: NodeType
  ): PropertyChange[] {
    const changes: PropertyChange[] = [];

    // Compare semantic keys
    const oldSemanticKey = (oldNode as any).semanticKey;
    const newSemanticKey = (newNode as any).semanticKey;

    if (oldSemanticKey !== newSemanticKey) {
      changes.push({
        property: "semanticKey",
        oldValue: oldSemanticKey,
        newValue: newSemanticKey,
        description: `Changed semantic key from "${oldSemanticKey}" to "${newSemanticKey}"`,
      });
    }

    // Compare frame properties
    if (JSON.stringify(oldNode.frame) !== JSON.stringify(newNode.frame)) {
      changes.push({
        property: "frame",
        oldValue: oldNode.frame,
        newValue: newNode.frame,
        description: "Modified frame dimensions or position",
      });
    }

    // Compare text content for text nodes
    if (oldNode.type === "text" && newNode.type === "text") {
      if (oldNode.text !== newNode.text) {
        changes.push({
          property: "text",
          oldValue: oldNode.text,
          newValue: newNode.text,
          description: `Changed text content from "${oldNode.text}" to "${newNode.text}"`,
        });
      }
    }

    // Compare component props for component nodes
    if (oldNode.type === "component" && newNode.type === "component") {
      if (
        JSON.stringify((oldNode as any).props) !==
        JSON.stringify((newNode as any).props)
      ) {
        changes.push({
          property: "props",
          oldValue: (oldNode as any).props,
          newValue: (newNode as any).props,
          description: "Modified component properties",
        });
      }
    }

    return changes;
  }

  /**
   * Build a map of nodes by ID with their paths
   */
  private buildNodeMap(
    nodes: NodeType[],
    currentPath: NodePath,
    nodeMap: Map<string, { node: NodeType; path: NodePath }>
  ): void {
    nodes.forEach((node, index) => {
      const path = [...currentPath, index];
      nodeMap.set(node.id, { node, path });

      if ("children" in node && node.children) {
        this.buildNodeMap(node.children, [...path, "children"], nodeMap);
      }
    });
  }

  /**
   * Generate a human-readable description of a node
   */
  private describeNode(node: NodeType): string {
    const semanticKey = (node as any).semanticKey;
    if (semanticKey) {
      return `node "${semanticKey}"`;
    }

    if (node.name) {
      return `${node.type} "${node.name}"`;
    }

    return `${node.type} node`;
  }

  /**
   * Convert a node path to a human-readable string
   */
  private pathToString(path: NodePath): string {
    return path
      .map((segment, index) => {
        if (typeof segment === "number") {
          return `[${segment}]`;
        }
        return segment;
      })
      .join(".");
  }

  /**
   * Generate summary statistics from diffs
   */
  private generateSummary(
    nodeDiffs: SemanticDiff[],
    propertyChanges: PropertyChange[]
  ): DiffSummary {
    const addedNodes = nodeDiffs.filter((d) => d.type === "added").length;
    const removedNodes = nodeDiffs.filter((d) => d.type === "removed").length;
    const modifiedNodes = nodeDiffs.filter((d) => d.type === "modified").length;
    const movedNodes = nodeDiffs.filter((d) => d.type === "moved").length;

    const semanticChanges = nodeDiffs.filter((d) => d.semanticKey).length;
    const structuralChanges = nodeDiffs.length - semanticChanges;

    return {
      totalChanges: nodeDiffs.length + propertyChanges.length,
      addedNodes,
      removedNodes,
      modifiedNodes,
      movedNodes,
      semanticChanges,
      structuralChanges,
    };
  }

  /**
   * Generate HTML representation of diffs for PR comments
   */
  generateHTMLDiff(diffResult: DiffResult): string {
    const { summary, nodeDiffs, propertyChanges } = diffResult;

    let html = `
      <div class="canvas-diff-summary">
        <h3>Canvas Document Changes</h3>
        <div class="diff-stats">
          <div class="stat">
            <span class="stat-value">${summary.totalChanges}</span>
            <span class="stat-label">Total Changes</span>
          </div>
          <div class="stat ${summary.addedNodes > 0 ? "stat-added" : ""}">
            <span class="stat-value">${summary.addedNodes}</span>
            <span class="stat-label">Added</span>
          </div>
          <div class="stat ${summary.removedNodes > 0 ? "stat-removed" : ""}">
            <span class="stat-value">${summary.removedNodes}</span>
            <span class="stat-label">Removed</span>
          </div>
          <div class="stat ${summary.modifiedNodes > 0 ? "stat-modified" : ""}">
            <span class="stat-value">${summary.modifiedNodes}</span>
            <span class="stat-label">Modified</span>
          </div>
          <div class="stat ${summary.movedNodes > 0 ? "stat-moved" : ""}">
            <span class="stat-value">${summary.movedNodes}</span>
            <span class="stat-label">Moved</span>
          </div>
        </div>
      </div>
    `;

    if (nodeDiffs.length > 0) {
      html += `
        <div class="node-changes">
          <h4>Node Changes</h4>
          <ul class="diff-list">
      `;

      nodeDiffs.forEach((diff) => {
        const semanticBadge = diff.semanticKey
          ? `<span class="semantic-badge">${diff.semanticKey}</span>`
          : "";

        html += `
          <li class="diff-item diff-${diff.type}">
            <span class="diff-type">${diff.type}</span>
            <span class="diff-description">${diff.description}</span>
            ${semanticBadge}
          </li>
        `;
      });

      html += `
          </ul>
        </div>
      `;
    }

    if (propertyChanges.length > 0) {
      html += `
        <div class="property-changes">
          <h4>Property Changes</h4>
          <ul class="diff-list">
      `;

      propertyChanges.forEach((change) => {
        html += `
          <li class="diff-item diff-property">
            <span class="diff-property">${change.property}</span>
            <span class="diff-description">${change.description}</span>
          </li>
        `;
      });

      html += `
          </ul>
        </div>
      `;
    }

    return html;
  }

  /**
   * Generate markdown representation of diffs for PR comments
   */
  generateMarkdownDiff(diffResult: DiffResult): string {
    const { summary, nodeDiffs, propertyChanges } = diffResult;

    let markdown = `## Canvas Document Changes\n\n`;

    markdown += `**Summary:** ${summary.totalChanges} total changes `;
    markdown += `(${summary.addedNodes} added, ${summary.removedNodes} removed, `;
    markdown += `${summary.modifiedNodes} modified, ${summary.movedNodes} moved)\n\n`;

    if (nodeDiffs.length > 0) {
      markdown += `### Node Changes\n\n`;

      nodeDiffs.forEach((diff) => {
        const semanticBadge = diff.semanticKey
          ? ` \`${diff.semanticKey}\``
          : "";
        markdown += `- **${
          diff.type.charAt(0).toUpperCase() + diff.type.slice(1)
        }**: ${diff.description}${semanticBadge}\n`;
      });

      markdown += `\n`;
    }

    if (propertyChanges.length > 0) {
      markdown += `### Property Changes\n\n`;

      propertyChanges.forEach((change) => {
        markdown += `- **${change.property}**: ${change.description}\n`;
      });

      markdown += `\n`;
    }

    return markdown;
  }
}

/**
 * Convenience function for comparing documents
 */
export function compareCanvasDocuments(
  oldDocument: CanvasDocumentType,
  newDocument: CanvasDocumentType
): DiffResult {
  const visualizer = new DiffVisualizer();
  return visualizer.compareDocuments(oldDocument, newDocument);
}

/**
 * Generate HTML diff for PR comments
 */
export function generateHTMLDiff(diffResult: DiffResult): string {
  const visualizer = new DiffVisualizer();
  return visualizer.generateHTMLDiff(diffResult);
}

/**
 * Generate markdown diff for PR comments
 */
export function generateMarkdownDiff(diffResult: DiffResult): string {
  const visualizer = new DiffVisualizer();
  return visualizer.generateMarkdownDiff(diffResult);
}
