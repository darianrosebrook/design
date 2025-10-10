/**
 * @fileoverview SVG to Canvas node converter
 * @author @darianrosebrook
 */

import { CanvasNode, VectorNode, GroupNode, TextNode, Frame, VectorData, PathCommand, Fill, Stroke, ImportWarning } from './types.js';

/**
 * SVG to Canvas converter
 */
export class SVGConverter {
  private nodeIdCounter = 0;

  /**
   * Convert SVG document to canvas nodes
   */
  convert(document: Document): { nodes: CanvasNode[]; warnings: ImportWarning[] } {
    const warnings: ImportWarning[] = [];
    const svgElement = document.documentElement;

    if (svgElement.tagName.toLowerCase() !== 'svg') {
      throw new Error('Root element must be <svg>');
    }

    const nodes = this.convertElement(svgElement, warnings);
    return { nodes, warnings };
  }

  /**
   * Convert SVG element to canvas nodes
   */
  private convertElement(element: Element, warnings: ImportWarning[]): CanvasNode[] {
    const tagName = element.tagName.toLowerCase();
    const nodes: CanvasNode[] = [];

    switch (tagName) {
      case 'svg':
        // Root SVG element - convert children
        nodes.push(...this.convertChildren(element, warnings));
        break;

      case 'g':
        // Group element
        const groupNode: GroupNode = {
          id: this.generateId(),
          type: 'group',
          name: element.getAttribute('id') || 'Group',
          frame: this.calculateBoundingBox(element),
          children: this.convertChildren(element, warnings),
        };
        nodes.push(groupNode);
        break;

      case 'path':
        // Path element
        const pathNode = this.convertPath(element, warnings);
        if (pathNode) {
          nodes.push(pathNode);
        }
        break;

      case 'rect':
        // Rectangle element
        const rectNode = this.convertRect(element, warnings);
        if (rectNode) {
          nodes.push(rectNode);
        }
        break;

      case 'circle':
        // Circle element
        const circleNode = this.convertCircle(element, warnings);
        if (circleNode) {
          nodes.push(circleNode);
        }
        break;

      case 'text':
        // Text element
        const textNode = this.convertText(element, warnings);
        if (textNode) {
          nodes.push(textNode);
        }
        break;

      default:
        // Unsupported element
        warnings.push({
          type: 'unsupported_feature',
          message: `Unsupported SVG element: ${tagName}`,
          element: tagName,
          suggestion: 'Element will be skipped in conversion'
        });
    }

    return nodes;
  }

  /**
   * Convert child elements
   */
  private convertChildren(parent: Element, warnings: ImportWarning[]): CanvasNode[] {
    const nodes: CanvasNode[] = [];
    const children = parent.children;

    for (let i = 0; i < children.length; i++) {
      nodes.push(...this.convertElement(children[i], warnings));
    }

    return nodes;
  }

  /**
   * Convert path element to vector node
   */
  private convertPath(element: Element, warnings: ImportWarning[]): VectorNode | null {
    const d = element.getAttribute('d');
    if (!d) {
      warnings.push({
        type: 'unsupported_feature',
        message: 'Path element missing d attribute',
        element: 'path'
      });
      return null;
    }

    const pathCommands = this.parsePathData(d, warnings);
    if (pathCommands.length === 0) {
      return null;
    }

    const fills = this.extractFills(element);
    const strokes = this.extractStrokes(element);

    return {
      id: this.generateId(),
      type: 'vector',
      name: element.getAttribute('id') || 'Path',
      frame: this.calculateBoundingBox(element),
      vectorData: {
        paths: pathCommands,
        windingRule: 'nonzero'
      },
      fills,
      strokes
    };
  }

  /**
   * Convert rect element to vector node
   */
  private convertRect(element: Element, warnings: ImportWarning[]): VectorNode | null {
    const x = parseFloat(element.getAttribute('x') || '0');
    const y = parseFloat(element.getAttribute('y') || '0');
    const width = parseFloat(element.getAttribute('width') || '0');
    const height = parseFloat(element.getAttribute('height') || '0');

    if (width <= 0 || height <= 0) {
      warnings.push({
        type: 'unsupported_feature',
        message: 'Invalid rect dimensions',
        element: 'rect'
      });
      return null;
    }

    // Convert rect to path
    const pathData = `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
    const pathCommands = this.parsePathData(pathData, warnings);

    const fills = this.extractFills(element);
    const strokes = this.extractStrokes(element);

    return {
      id: this.generateId(),
      type: 'vector',
      name: element.getAttribute('id') || 'Rectangle',
      frame: { x, y, width, height },
      vectorData: {
        paths: pathCommands,
        windingRule: 'nonzero'
      },
      fills,
      strokes
    };
  }

  /**
   * Convert circle element to vector node
   */
  private convertCircle(element: Element, warnings: ImportWarning[]): VectorNode | null {
    const cx = parseFloat(element.getAttribute('cx') || '0');
    const cy = parseFloat(element.getAttribute('cy') || '0');
    const r = parseFloat(element.getAttribute('r') || '0');

    if (r <= 0) {
      warnings.push({
        type: 'unsupported_feature',
        message: 'Invalid circle radius',
        element: 'circle'
      });
      return null;
    }

    // Approximate circle with cubic bezier curves
    const pathCommands = this.approximateCircle(cx, cy, r);

    const fills = this.extractFills(element);
    const strokes = this.extractStrokes(element);

    const diameter = r * 2;
    return {
      id: this.generateId(),
      type: 'vector',
      name: element.getAttribute('id') || 'Circle',
      frame: { x: cx - r, y: cy - r, width: diameter, height: diameter },
      vectorData: {
        paths: pathCommands,
        windingRule: 'nonzero'
      },
      fills,
      strokes
    };
  }

  /**
   * Convert text element to text node
   */
  private convertText(element: Element, warnings: ImportWarning[]): TextNode | null {
    const textContent = element.textContent?.trim();
    if (!textContent) {
      warnings.push({
        type: 'unsupported_feature',
        message: 'Text element has no content',
        element: 'text'
      });
      return null;
    }

    const x = parseFloat(element.getAttribute('x') || '0');
    const y = parseFloat(element.getAttribute('y') || '0');
    const fontSize = parseFloat(element.getAttribute('font-size') || '16');
    const fontFamily = element.getAttribute('font-family') || 'sans-serif';

    const fills = this.extractFills(element);

    return {
      id: this.generateId(),
      type: 'text',
      name: element.getAttribute('id') || 'Text',
      frame: { x, y: y - fontSize, width: textContent.length * fontSize * 0.6, height: fontSize },
      text: textContent,
      fontSize,
      fontFamily,
      fills
    };
  }

  /**
   * Parse SVG path data string into path commands
   */
  private parsePathData(d: string, warnings: ImportWarning[]): PathCommand[] {
    // Basic SVG path parser - simplified implementation
    const commands: PathCommand[] = [];
    const tokens = d.match(/[MLHVCSQTAZmlhvcsqtaz]|-?\d*\.?\d+/g) || [];

    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      const command = token.toUpperCase();

      if (['M', 'L', 'C', 'Q', 'A', 'Z'].includes(command)) {
        const points: number[] = [];
        i++; // Move to first coordinate

        // Collect coordinates based on command type
        const coordCount = this.getCoordinateCount(command);
        for (let j = 0; j < coordCount && i < tokens.length; j++) {
          const coord = parseFloat(tokens[i]);
          if (!isNaN(coord)) {
            points.push(coord);
          }
          i++;
        }

        commands.push({
          type: command as PathCommand['type'],
          points
        });
      } else {
        i++; // Skip invalid tokens
      }
    }

    if (commands.length === 0) {
      warnings.push({
        type: 'unsupported_feature',
        message: 'Failed to parse path data',
        suggestion: 'Check path syntax'
      });
    }

    return commands;
  }

  /**
   * Get number of coordinates expected for a path command
   */
  private getCoordinateCount(command: string): number {
    switch (command) {
      case 'M': case 'L': case 'T': return 2; // x,y
      case 'H': return 1; // x
      case 'V': return 1; // y
      case 'C': return 6; // x1,y1,x2,y2,x,y
      case 'S': case 'Q': return 4; // x1,y1,x,y
      case 'A': return 7; // rx,ry,angle,large-arc-flag,sweep-flag,x,y
      default: return 0;
    }
  }

  /**
   * Approximate circle with cubic bezier curves
   */
  private approximateCircle(cx: number, cy: number, r: number): PathCommand[] {
    // Use 4 cubic bezier curves to approximate a circle
    const c = 0.551915024494; // Control point constant
    const cr = c * r;

    return [
      { type: 'M', points: [cx + r, cy] },
      { type: 'C', points: [cx + r, cy - cr, cx + cr, cy - r, cx, cy - r] },
      { type: 'C', points: [cx - cr, cy - r, cx - r, cy - cr, cx - r, cy] },
      { type: 'C', points: [cx - r, cy + cr, cx - cr, cy + r, cx, cy + r] },
      { type: 'C', points: [cx + cr, cy + r, cx + r, cy + cr, cx + r, cy] },
      { type: 'Z', points: [] }
    ];
  }

  /**
   * Extract fill properties from element
   */
  private extractFills(element: Element): Fill[] {
    const fills: Fill[] = [];
    const fill = element.getAttribute('fill');

    if (fill && fill !== 'none') {
      const opacity = parseFloat(element.getAttribute('fill-opacity') || '1');
      fills.push({
        type: 'solid',
        color: fill,
        opacity: opacity < 1 ? opacity : undefined
      });
    }

    return fills;
  }

  /**
   * Extract stroke properties from element
   */
  private extractStrokes(element: Element): Stroke[] {
    const strokes: Stroke[] = [];
    const stroke = element.getAttribute('stroke');

    if (stroke && stroke !== 'none') {
      const strokeWidth = parseFloat(element.getAttribute('stroke-width') || '1');
      const opacity = parseFloat(element.getAttribute('stroke-opacity') || '1');

      strokes.push({
        color: stroke,
        width: strokeWidth,
        opacity: opacity < 1 ? opacity : undefined,
        lineCap: element.getAttribute('stroke-linecap') as 'butt' | 'round' | 'square' || undefined,
        lineJoin: element.getAttribute('stroke-linejoin') as 'miter' | 'round' | 'bevel' || undefined
      });
    }

    return strokes;
  }

  /**
   * Calculate bounding box for an element
   */
  private calculateBoundingBox(element: Element): Frame {
    // Simplified - in a real implementation, this would calculate actual bounds
    // For now, return a default frame
    return { x: 0, y: 0, width: 100, height: 100 };
  }

  /**
   * Generate unique node ID
   */
  private generateId(): string {
    return `svg-node-${++this.nodeIdCounter}`;
  }
}
