/**
 * @fileoverview Canonical JSON serialization for deterministic output
 * @author @darianrosebrook
 *
 * Ensures that identical canvas documents produce identical JSON output
 * regardless of object key insertion order or platform differences.
 */function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
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
const DEFAULT_OPTIONS: Required<CanonicalOptions> = stryMutAct_9fa48("0") ? {} : (stryCov_9fa48("0"), {
  indent: 2,
  sortKeys: stryMutAct_9fa48("1") ? false : (stryCov_9fa48("1"), true),
  addNewline: stryMutAct_9fa48("2") ? false : (stryCov_9fa48("2"), true)
});

/**
 * Recursively sort object keys for deterministic serialization
 */
function sortObjectKeys(obj: any): any {
  if (stryMutAct_9fa48("3")) {
    {}
  } else {
    stryCov_9fa48("3");
    if (stryMutAct_9fa48("6") ? obj === null && typeof obj !== "object" : stryMutAct_9fa48("5") ? false : stryMutAct_9fa48("4") ? true : (stryCov_9fa48("4", "5", "6"), (stryMutAct_9fa48("8") ? obj !== null : stryMutAct_9fa48("7") ? false : (stryCov_9fa48("7", "8"), obj === null)) || (stryMutAct_9fa48("10") ? typeof obj === "object" : stryMutAct_9fa48("9") ? false : (stryCov_9fa48("9", "10"), typeof obj !== (stryMutAct_9fa48("11") ? "" : (stryCov_9fa48("11"), "object")))))) {
      if (stryMutAct_9fa48("12")) {
        {}
      } else {
        stryCov_9fa48("12");
        return obj;
      }
    }
    if (stryMutAct_9fa48("14") ? false : stryMutAct_9fa48("13") ? true : (stryCov_9fa48("13", "14"), Array.isArray(obj))) {
      if (stryMutAct_9fa48("15")) {
        {}
      } else {
        stryCov_9fa48("15");
        return obj.map(sortObjectKeys);
      }
    }
    const sorted: any = {};
    const keys = stryMutAct_9fa48("16") ? Object.keys(obj) : (stryCov_9fa48("16"), Object.keys(obj).sort());
    for (const key of keys) {
      if (stryMutAct_9fa48("17")) {
        {}
      } else {
        stryCov_9fa48("17");
        sorted[key] = sortObjectKeys(obj[key]);
      }
    }
    return sorted;
  }
}

/**
 * Canonical JSON serializer
 */
export class CanonicalSerializer {
  private options: Required<CanonicalOptions>;
  constructor(options: CanonicalOptions = {}) {
    if (stryMutAct_9fa48("18")) {
      {}
    } else {
      stryCov_9fa48("18");
      this.options = stryMutAct_9fa48("19") ? {} : (stryCov_9fa48("19"), {
        ...DEFAULT_OPTIONS,
        ...options
      });
    }
  }

  /**
   * Serialize a canvas document to canonical JSON
   */
  serialize(document: CanvasDocumentType): string {
    if (stryMutAct_9fa48("20")) {
      {}
    } else {
      stryCov_9fa48("20");
      let processed = document;

      // Sort object keys if requested
      if (stryMutAct_9fa48("22") ? false : stryMutAct_9fa48("21") ? true : (stryCov_9fa48("21", "22"), this.options.sortKeys)) {
        if (stryMutAct_9fa48("23")) {
          {}
        } else {
          stryCov_9fa48("23");
          processed = sortObjectKeys(document);
        }
      }

      // Serialize with consistent formatting
      const json = JSON.stringify(processed, null, this.options.indent);

      // Add newline at end if requested
      if (stryMutAct_9fa48("25") ? false : stryMutAct_9fa48("24") ? true : (stryCov_9fa48("24", "25"), this.options.addNewline)) {
        if (stryMutAct_9fa48("26")) {
          {}
        } else {
          stryCov_9fa48("26");
          return json + (stryMutAct_9fa48("27") ? "" : (stryCov_9fa48("27"), "\n"));
        }
      }
      return json;
    }
  }

  /**
   * Check if two documents would serialize to the same output
   */
  wouldBeIdentical(doc1: CanvasDocumentType, doc2: CanvasDocumentType): boolean {
    if (stryMutAct_9fa48("28")) {
      {}
    } else {
      stryCov_9fa48("28");
      const serialized1 = this.serialize(doc1);
      const serialized2 = this.serialize(doc2);
      return stryMutAct_9fa48("31") ? serialized1 !== serialized2 : stryMutAct_9fa48("30") ? false : stryMutAct_9fa48("29") ? true : (stryCov_9fa48("29", "30", "31"), serialized1 === serialized2);
    }
  }
}

/**
 * Global canonical serializer instance
 */
export const canonicalSerializer = new CanonicalSerializer();

/**
 * Convenience function for canonical serialization
 */
export function serializeCanvasDocument(document: CanvasDocumentType, options?: CanonicalOptions): string {
  if (stryMutAct_9fa48("32")) {
    {}
  } else {
    stryCov_9fa48("32");
    const serializer = options ? new CanonicalSerializer(options) : canonicalSerializer;
    return serializer.serialize(document);
  }
}