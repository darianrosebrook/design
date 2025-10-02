/**
 * @fileoverview Determinism utilities for code generation
 * @author @darianrosebrook
 *
 * Integrates all researched patterns for deterministic output:
 * - Clock injection for timestamps
 * - Canonical string sorting for object keys
 * - Floating-point precision control
 */

import { ulid } from "ulidx";

/**
 * Clock interface for deterministic time operations
 */
export interface Clock {
  now(): number;
  uuid(): string;
  random?(): number;
}

/**
 * Default clock implementation using system time
 */
export const defaultClock: Clock = {
  now: () => Date.now(),
  uuid: () => ulid(),
  random: () => Math.random(),
};

/**
 * Create a fixed clock for testing (deterministic)
 */
export const createFixedClock = (timestamp: number, uuid: string): Clock => ({
  now: () => timestamp,
  uuid: () => uuid,
  random: () => 0.5,
});

/**
 * Canonical string sorter using Intl.Collator
 */
export class CanonicalSorter {
  private collator: Intl.Collator;

  constructor(locale: string = "en-US") {
    this.collator = new Intl.Collator(locale, {
      numeric: true,
      sensitivity: "base",
      ignorePunctuation: false,
    });
  }

  /**
   * Sort array of strings deterministically
   */
  sort(items: string[]): string[] {
    return [...items].sort(this.collator.compare);
  }

  /**
   * Sort object keys deterministically
   */
  sortObjectKeys(obj: Record<string, any>): Record<string, any> {
    const sorted: Record<string, any> = {};
    const keys = Object.keys(obj).sort(this.collator.compare);

    for (const key of keys) {
      sorted[key] = obj[key];
    }

    return sorted;
  }
}

/**
 * Default canonical sorter instance
 */
export const canonicalSorter = new CanonicalSorter();

/**
 * Precision normalizer for floating-point values
 */
export class PrecisionNormalizer {
  private coordinatePrecision: number;
  private dimensionPrecision: number;

  constructor(coordinatePrecision: number = 2, dimensionPrecision: number = 0) {
    this.coordinatePrecision = coordinatePrecision;
    this.dimensionPrecision = dimensionPrecision;
  }

  /**
   * Normalize a coordinate value (x, y, width, height)
   */
  normalizeCoordinate(value: number): string {
    return value.toFixed(this.coordinatePrecision);
  }

  /**
   * Normalize a dimension value (sizes, spacing)
   */
  normalizeDimension(value: number): number {
    const factor = Math.pow(10, this.dimensionPrecision);
    return Math.round(value * factor) / factor;
  }

  /**
   * Normalize for calculations (maintains numeric type)
   */
  normalizeForCalculation(value: number): number {
    const factor = Math.pow(10, this.coordinatePrecision);
    return Math.round(value * factor) / factor;
  }
}

/**
 * Default precision normalizer instance
 */
export const precisionNormalizer = new PrecisionNormalizer();

/**
 * Code generation options with determinism controls
 */
export interface CodeGenOptions {
  clock?: Clock;
  sorter?: CanonicalSorter;
  normalizer?: PrecisionNormalizer;
  format?: "tsx" | "jsx";
  indent?: number;
  includeComments?: boolean;
}

/**
 * Default options for code generation
 */
export const defaultCodeGenOptions: Required<
  Omit<CodeGenOptions, "clock" | "sorter" | "normalizer">
> & {
  clock: Clock;
  sorter: CanonicalSorter;
  normalizer: PrecisionNormalizer;
} = {
  clock: defaultClock,
  sorter: canonicalSorter,
  normalizer: precisionNormalizer,
  format: "tsx",
  indent: 2,
  includeComments: true,
};

/**
 * Merge options with defaults
 */
export function mergeCodeGenOptions(
  options: CodeGenOptions = {}
): Required<CodeGenOptions> {
  return {
    clock: options.clock ?? defaultCodeGenOptions.clock,
    sorter: options.sorter ?? defaultCodeGenOptions.sorter,
    normalizer: options.normalizer ?? defaultCodeGenOptions.normalizer,
    format: options.format ?? defaultCodeGenOptions.format,
    indent: options.indent ?? defaultCodeGenOptions.indent,
    includeComments:
      options.includeComments ?? defaultCodeGenOptions.includeComments,
  };
}

/**
 * Generate SHA-256 hash for determinism verification
 */
export async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify that two code outputs are identical
 */
export async function verifyDeterminism(
  output1: string,
  output2: string
): Promise<boolean> {
  const hash1 = await generateHash(output1);
  const hash2 = await generateHash(output2);
  return hash1 === hash2;
}
