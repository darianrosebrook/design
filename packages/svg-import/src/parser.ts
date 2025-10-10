/**
 * @fileoverview SVG parser with security validation
 * @author @darianrosebrook
 */

import { DOMParser } from '@xmldom/xmldom';
import { SecurityPolicy, DEFAULT_SECURITY_POLICY, ImportWarning } from './types.js';

/**
 * SVG parser with security validation
 */
export class SVGParser {
  private policy: SecurityPolicy;

  constructor(policy: SecurityPolicy = DEFAULT_SECURITY_POLICY) {
    this.policy = policy;
  }

  /**
   * Parse SVG content with security validation
   */
  parse(svgContent: string): { document: Document; warnings: ImportWarning[] } {
    const warnings: ImportWarning[] = [];

    // Check file size
    if (svgContent.length > this.policy.maxFileSize) {
      warnings.push({
        type: 'security_issue',
        message: `SVG file size (${svgContent.length} bytes) exceeds maximum allowed size (${this.policy.maxFileSize} bytes)`,
        suggestion: 'Reduce file size or increase limit if trusted source'
      });
    }

    // Parse XML
    let document: Document;
    try {
      const parser = new DOMParser({
        errorHandler: (level: string, msg: string) => {
          warnings.push({
            type: 'security_issue',
            message: `XML parsing ${level}: ${msg}`,
          });
        }
      });
      document = parser.parseFromString(svgContent, 'image/svg+xml');
    } catch (error) {
      throw new Error(`Failed to parse SVG: ${error}`);
    }

    // Validate security policy
    this.validateSecurityPolicy(document, warnings);

    return { document, warnings };
  }

  /**
   * Validate document against security policy
   */
  private validateSecurityPolicy(document: Document, warnings: ImportWarning[]): void {
    const elements = document.getElementsByTagName('*');
    const elementCount = elements.length;

    if (elementCount > this.policy.maxElements) {
      warnings.push({
        type: 'performance_issue',
        message: `SVG contains ${elementCount} elements, exceeding limit of ${this.policy.maxElements}`,
        suggestion: 'Simplify SVG or increase element limit'
      });
    }

    // Check for forbidden elements
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const tagName = element.tagName.toLowerCase();

      if (this.policy.forbiddenElements.includes(tagName)) {
        warnings.push({
          type: 'security_issue',
          message: `Forbidden element found: ${tagName}`,
          element: tagName,
          suggestion: 'Remove or replace forbidden elements'
        });
      }

      // Check for forbidden attributes
      const attributes = element.attributes;
      for (let j = 0; j < attributes.length; j++) {
        const attr = attributes[j];
        if (this.policy.forbiddenAttributes.includes(attr.name)) {
          warnings.push({
            type: 'security_issue',
            message: `Forbidden attribute found: ${attr.name} on ${tagName}`,
            element: tagName,
            suggestion: 'Remove forbidden attributes'
          });
        }
      }
    }

    // Check nesting depth
    this.validateNestingDepth(document.documentElement, 0, warnings);
  }

  /**
   * Validate element nesting depth
   */
  private validateNestingDepth(element: Element, depth: number, warnings: ImportWarning[]): void {
    if (depth > this.policy.maxDepth) {
      warnings.push({
        type: 'performance_issue',
        message: `Element nesting depth ${depth} exceeds limit of ${this.policy.maxDepth}`,
        element: element.tagName,
        suggestion: 'Flatten nested structure'
      });
      return;
    }

    const children = element.children;
    for (let i = 0; i < children.length; i++) {
      this.validateNestingDepth(children[i], depth + 1, warnings);
    }
  }

  /**
   * Extract SVG dimensions from viewBox or width/height attributes
   */
  extractDimensions(svgElement: Element): { width: number; height: number } {
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/\s+/);
      if (parts.length >= 4) {
        const width = parseFloat(parts[2]);
        const height = parseFloat(parts[3]);
        if (!isNaN(width) && !isNaN(height)) {
          return { width, height };
        }
      }
    }

    // Fallback to width/height attributes
    const width = parseFloat(svgElement.getAttribute('width') || '0');
    const height = parseFloat(svgElement.getAttribute('height') || '0');

    return { width: width || 300, height: height || 150 }; // Default fallback
  }
}
