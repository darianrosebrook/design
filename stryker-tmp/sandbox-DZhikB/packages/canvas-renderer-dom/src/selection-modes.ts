/**
 * @fileoverview Advanced selection modes implementation
 * @author @darianrosebrook
 *
 * Implements rectangle selection, lasso selection, and multi-select modes
 * with performance optimizations and accessibility support.
 */

import type { CanvasDocumentType, NodeType } from "@paths-design/canvas-schema";
import type { Observability } from "./observability.js";

/**
 * Selection mode types
 */
export type SelectionMode = "single" | "move" | "scale" | "rectangle" | "lasso";

/**
 * Point in document coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Rectangle in document coordinates
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Selection operation result
 */
export interface SelectionResult {
  selectedNodeIds: string[];
  accuracy: number;
  duration: number;
}

/**
 * Hit test result for a node
 */
export interface HitTestResult {
  nodeId: string;
  bounds: Rectangle;
  distance?: number;
}

/**
 * Selection mode configuration
 */
export interface SelectionModeConfig {
  mode: SelectionMode;
  multiSelect: boolean;
  preserveSelection: boolean;
}

export interface SelectionOperationDetails {
  mode: SelectionMode;
  config: SelectionModeConfig;
  result: SelectionResult;
  previousSelection: string[];
  mergedSelection: string[];
  duration: number;
  accuracy: number;
}

/**
 * Advanced selection modes coordinator
 */
export class SelectionModesCoordinator {
  private document: CanvasDocumentType | null = null;
  private observability: Observability;
  private currentSelectionIds: Set<string> = new Set();

  constructor(observability: Observability) {
    this.observability = observability;
  }

  /**
   * Set the current document for selection operations
   */
  setDocument(document: CanvasDocumentType): void {
    this.document = document;
    this.currentSelectionIds.clear();
  }

  /**
   * Update the current selection state so multi-select operations can merge
   * with existing selections deterministically.
   */
  setCurrentSelection(nodeIds: string[]): void {
    this.currentSelectionIds = new Set(nodeIds);
  }

  /**
   * Get current selection IDs (for testing)
   */
  getCurrentSelectionIds(): string[] {
    return [...this.currentSelectionIds];
  }

  /**
   * Perform rectangle selection
   */
  async performRectangleSelection(
    rect: Rectangle,
    config: SelectionModeConfig
  ): Promise<SelectionResult> {
    const startTime = performance.now();
    this.observability.logger.info(
      "selection.rectangle.start",
      "Rectangle selection started",
      {
        rect,
        config,
        existingSelectionSize: this.currentSelectionIds.size,
      }
    );
    this.observability.tracer.start("selection.rectangle.pipeline", {
      rect,
    });

    try {
      if (!this.document) {
        throw new Error("No document loaded for selection");
      }

      // Get all selectable nodes
      const selectableNodes = this.getSelectableNodes();

      // Perform hit testing
      const hits = this.hitTestRectangle(rect, selectableNodes);

      // Apply selection logic based on configuration
      const selectedIds = this.applySelectionLogic(hits, config);

      // Update current selection state for multi-select operations
      this.currentSelectionIds = new Set(selectedIds);

      const duration = performance.now() - startTime;
      const accuracy = hits.length > 0 ? selectedIds.length / hits.length : 1.0;

      const result: SelectionResult = {
        selectedNodeIds: selectedIds,
        accuracy,
        duration,
      };

      this.observability.tracer.end("selection.rectangle.pipeline");
      this.observability.logger.info(
        "selection.rectangle.complete",
        "Rectangle selection completed",
        {
          rect,
          config,
          accuracy,
          duration,
          selectedCount: selectedIds.length,
        }
      );
      this.observability.metrics.histogram(
        "selection_rectangle_duration_ms",
        duration
      );
      this.observability.metrics.histogram(
        "selection_rectangle_accuracy_percent",
        accuracy * 100
      );

      return result;
    } catch (error) {
      this.observability.logger.error(
        "selection.rectangle.failed",
        "Rectangle selection failed",
        {
          rect,
          config,
          error,
        }
      );
      this.observability.tracer.end("selection.rectangle.pipeline");
      throw error;
    }
  }

  /**
   * Perform lasso selection using winding rule algorithm
   */
  async performLassoSelection(
    path: Point[],
    config: SelectionModeConfig
  ): Promise<SelectionResult> {
    const startTime = performance.now();
    this.observability.logger.info(
      "selection.lasso.start",
      "Lasso selection started",
      {
        segmentCount: path.length,
        config,
        existingSelectionSize: this.currentSelectionIds.size,
      }
    );
    this.observability.tracer.start("selection.lasso.path_processing", {
      segmentCount: path.length,
    });

    try {
      if (!this.document) {
        throw new Error("No document loaded for selection");
      }

      // Get all selectable nodes
      const selectableNodes = this.getSelectableNodes();

      // Perform hit testing with winding rule
      const hits = this.hitTestLasso(path, selectableNodes);

      // Apply selection logic
      const selectedIds = this.applySelectionLogic(hits, config);

      // Update current selection state for multi-select operations
      this.currentSelectionIds = new Set(selectedIds);

      const duration = performance.now() - startTime;
      const accuracy = hits.length > 0 ? selectedIds.length / hits.length : 1.0;

      const result: SelectionResult = {
        selectedNodeIds: selectedIds,
        accuracy,
        duration,
      };

      this.observability.tracer.end("selection.lasso.path_processing");
      this.observability.logger.info(
        "selection.lasso.complete",
        "Lasso selection completed",
        {
          segmentCount: path.length,
          config,
          accuracy,
          duration,
          selectedCount: selectedIds.length,
        }
      );
      this.observability.metrics.counter(
        "selection_lasso_segments_total",
        path.length
      );
      this.observability.metrics.histogram(
        "selection_lasso_duration_ms",
        duration
      );
      this.observability.metrics.histogram(
        "selection_lasso_accuracy_percent",
        accuracy * 100
      );

      return result;
    } catch (error) {
      this.observability.logger.error(
        "selection.lasso.failed",
        "Lasso selection failed",
        {
          segmentCount: path.length,
          config,
          error,
        }
      );
      this.observability.tracer.end("selection.lasso.path_processing");
      throw error;
    }
  }

  /**
   * Get all nodes that can be selected
   */
  private getSelectableNodes(): NodeType[] {
    if (!this.document) {
      return [];
    }

    const nodes: NodeType[] = [];

    const traverse = (nodeList: NodeType[]) => {
      for (const node of nodeList) {
        // Skip locked or hidden nodes
        if (node.locked || !node.visible) {
          continue;
        }

        nodes.push(node);

        // Recurse into frame children
        if (node.type === "frame" && node.children) {
          traverse(node.children);
        }
      }
    };

    // Traverse all artboards
    for (const artboard of this.document.artboards) {
      // Include artboard itself as selectable (artboards are always visible and unlocked)
      nodes.push(artboard);

      // Include artboard children
      if (artboard.children) {
        traverse(artboard.children);
      }
    }

    return nodes;
  }

  /**
   * Hit test nodes within a rectangle
   */
  private hitTestRectangle(
    rect: Rectangle,
    nodes: NodeType[]
  ): HitTestResult[] {
    const hits: HitTestResult[] = [];

    for (const node of nodes) {
      const nodeRect = this.getNodeBounds(node);

      if (this.rectanglesIntersect(rect, nodeRect)) {
        hits.push({
          nodeId: node.id,
          bounds: nodeRect,
        });
      }
    }

    return hits;
  }

  /**
   * Hit test nodes within a lasso path using winding rule
   */
  private hitTestLasso(path: Point[], nodes: NodeType[]): HitTestResult[] {
    const hits: HitTestResult[] = [];

    for (const node of nodes) {
      const nodeRect = this.getNodeBounds(node);

      // Quick rejection: check if node bounds intersect with path bounds
      if (!this.pathBoundsIntersect(path, nodeRect)) {
        continue;
      }

      // Detailed point-in-polygon test
      if (this.isPointInLasso(nodeRect, path)) {
        hits.push({
          nodeId: node.id,
          bounds: nodeRect,
        });
      }
    }

    return hits;
  }

  /**
   * Get bounding rectangle for a node
   */
  private getNodeBounds(node: NodeType): Rectangle {
    const frame = node.frame || { x: 0, y: 0, width: 100, height: 100 };
    return {
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height,
    };
  }

  /**
   * Check if two rectangles intersect
   */
  private rectanglesIntersect(a: Rectangle, b: Rectangle): boolean {
    return !(
      a.x + a.width <= b.x ||
      b.x + b.width <= a.x ||
      a.y + a.height <= b.y ||
      b.y + b.height <= a.y
    );
  }

  /**
   * Check if path bounds intersect with rectangle
   */
  private pathBoundsIntersect(path: Point[], rect: Rectangle): boolean {
    if (path.length === 0) {
      return false;
    }

    // Calculate path bounds
    let minX = path[0].x;
    let maxX = path[0].x;
    let minY = path[0].y;
    let maxY = path[0].y;

    for (let i = 1; i < path.length; i++) {
      minX = Math.min(minX, path[i].x);
      maxX = Math.max(maxX, path[i].x);
      minY = Math.min(minY, path[i].y);
      maxY = Math.max(maxY, path[i].y);
    }

    return this.rectanglesIntersect(
      { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      rect
    );
  }

  /**
   * Check if a point is inside a lasso path using winding rule
   */
  private isPointInLasso(point: Rectangle, path: Point[]): boolean {
    // For simplicity, use the center of the rectangle as the test point
    const centerX = point.x + point.width / 2;
    const centerY = point.y + point.height / 2;

    return this.isPointInPolygon({ x: centerX, y: centerY }, path);
  }

  /**
   * Winding rule point-in-polygon test
   */
  private isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (
        polygon[i].y > point.y !== polygon[j].y > point.y &&
        point.x <
          ((polygon[j].x - polygon[i].x) * (point.y - polygon[i].y)) /
            (polygon[j].y - polygon[i].y) +
            polygon[i].x
      ) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Apply selection logic based on configuration
   */
  private applySelectionLogic(
    hits: HitTestResult[],
    config: SelectionModeConfig
  ): string[] {
    if (config.mode === "single") {
      // Single selection mode - only return the first hit
      return hits.length > 0 ? [hits[0].nodeId] : [];
    }

    // Multi-select modes
    const hitNodeIds = hits.map((hit) => hit.nodeId);

    if (!config.multiSelect) {
      return hitNodeIds;
    }

    if (config.preserveSelection) {
      // Merge hits with the existing selection set
      const mergedSelection = new Set(this.currentSelectionIds);

      if (hitNodeIds.length === 0 && mergedSelection.size > 0) {
        this.observability.logger.info(
          "selection.multi_select.preserve",
          "No new hits; preserving existing selection",
          {
            existingSelectionSize: mergedSelection.size,
          }
        );
        // Preserve previous selection even when no new hits are detected
        return Array.from(mergedSelection);
      }

      for (const nodeId of hitNodeIds) {
        mergedSelection.add(nodeId);
      }

      this.observability.logger.info(
        "selection.multi_select.merged",
        "Merged multi-select selection",
        {
          newHits: hitNodeIds.length,
          totalSelection: mergedSelection.size,
        }
      );
      this.observability.metrics.gauge(
        "selection_multi_select_count",
        mergedSelection.size
      );
      return Array.from(mergedSelection);
    }

    return hitNodeIds;
  }

  /**
   * Validate selection operation parameters
   */
  validateSelectionOperation(
    mode: SelectionMode,
    params: Rectangle | Point[]
  ): { valid: boolean; error?: string } {
    switch (mode) {
      case "rectangle":
        const rect = params as Rectangle;
        if (rect.width < 0 || rect.height < 0) {
          return {
            valid: false,
            error: "Rectangle dimensions cannot be negative",
          };
        }
        if (
          !isFinite(rect.x) ||
          !isFinite(rect.y) ||
          !isFinite(rect.width) ||
          !isFinite(rect.height)
        ) {
          return {
            valid: false,
            error: "Rectangle coordinates must be finite numbers",
          };
        }
        break;

      case "lasso":
        const path = params as Point[];
        if (path.length < 3) {
          return {
            valid: false,
            error: "Lasso path must have at least 3 points",
          };
        }
        for (const point of path) {
          if (!isFinite(point.x) || !isFinite(point.y)) {
            return {
              valid: false,
              error: "Lasso path points must have finite coordinates",
            };
          }
        }
        break;
    }

    return { valid: true };
  }
}
