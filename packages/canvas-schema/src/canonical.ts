/**
 * @fileoverview Canonical JSON serialization for deterministic output
 * @author @darianrosebrook
 *
 * Ensures that identical canvas documents produce identical JSON output
 * regardless of object key insertion order or platform differences.
 */

import type { CanvasDocumentType } from "./types.js";

/**
 * Canonical JSON serialization options
 */
export interface CanonicalOptions {
  /** Number of spaces for indentation (default: 2) */
  indent?: number;
  /** Whether to sort object keys (default: true) */
  sortKeys?: boolean;
  /** Whether to add newline at end (default: true) */
  addNewline?: boolean;
}

/**
 * Default options for canonical serialization
 */
const DEFAULT_OPTIONS: Required<CanonicalOptions> = {
  indent: 2,
  sortKeys: true,
  addNewline: true,
};

/**
 * Recursively sort object keys for deterministic serialization
 */
function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  const sorted: any = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    sorted[key] = sortObjectKeys(obj[key]);
  }

  return sorted;
}

/**
 * Canonical JSON serializer
 */
export class CanonicalSerializer {
  private options: Required<CanonicalOptions>;

  constructor(options: CanonicalOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Serialize a canvas document to canonical JSON
   */
  serialize(document: CanvasDocumentType): string {
    let processed = document;

    // Sort object keys if requested
    if (this.options.sortKeys) {
      processed = sortObjectKeys(document);
    }

    // Serialize with consistent formatting
    const json = JSON.stringify(processed, null, this.options.indent);

    // Add newline at end if requested
    if (this.options.addNewline) {
      return json + "\n";
    }

    return json;
  }

  /**
   * Check if two documents would serialize to the same output
   */
  wouldBeIdentical(
    doc1: CanvasDocumentType,
    doc2: CanvasDocumentType
  ): boolean {
    const serialized1 = this.serialize(doc1);
    const serialized2 = this.serialize(doc2);
    return serialized1 === serialized2;
  }
}

/**
 * Global canonical serializer instance
 */
export const canonicalSerializer = new CanonicalSerializer();

/**
 * Convenience function for canonical serialization
 */
export function serializeCanvasDocument(
  document: CanvasDocumentType,
  options?: CanonicalOptions
): string {
  const serializer = options
    ? new CanonicalSerializer(options)
    : canonicalSerializer;
  return serializer.serialize(document);
}
