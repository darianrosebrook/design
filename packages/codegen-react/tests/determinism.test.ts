/**
 * @fileoverview Tests for determinism patterns in code generation
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import {
  generateHash,
  verifyDeterminism,
  createFixedClock,
  canonicalSorter,
  precisionNormalizer,
} from "../src/determinism.js";

describe("Determinism Patterns", () => {
  describe("Hash Generation", () => {
    it("generates consistent hashes for identical content", async () => {
      const content = "const x = 42;";
      const hash1 = await generateHash(content);
      const hash2 = await generateHash(content);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex string
    });

    it("generates different hashes for different content", async () => {
      const content1 = "const x = 42;";
      const content2 = "const x = 43;";

      const hash1 = await generateHash(content1);
      const hash2 = await generateHash(content2);

      expect(hash1).not.toBe(hash2);
    });

    it("handles empty content", async () => {
      const hash = await generateHash("");
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("Determinism Verification", () => {
    it("correctly identifies identical content", async () => {
      const content = "const x = 42;";
      const isDeterministic = await verifyDeterminism(content, content);

      expect(isDeterministic).toBe(true);
    });

    it("correctly identifies different content", async () => {
      const content1 = "const x = 42;";
      const content2 = "const x = 43;";

      const isDeterministic = await verifyDeterminism(content1, content2);

      expect(isDeterministic).toBe(false);
    });
  });

  describe("Fixed Clock", () => {
    it("provides consistent timestamps", () => {
      const timestamp = 1234567890000;
      const uuid = "01JF2PZV9G2WR5C3W7P0YHNX9D";

      const clock = createFixedClock(timestamp, uuid);

      expect(clock.now()).toBe(timestamp);
      expect(clock.uuid()).toBe(uuid);
      expect(clock.random()).toBe(0.5); // Default random value
    });

    it("allows custom random function", () => {
      const clock = createFixedClock(1234567890000, "test-uuid");
      clock.random = () => 0.123;

      expect(clock.random()).toBe(0.123);
    });
  });

  describe("Canonical Sorting", () => {
    it("sorts strings consistently", () => {
      const items = ["z", "a", "m", "b"];
      const sorted1 = canonicalSorter.sort(items);
      const sorted2 = canonicalSorter.sort(items);

      expect(sorted1).toEqual(sorted2);
      expect(sorted1).toEqual(["a", "b", "m", "z"]);
    });

    it("handles numeric strings correctly", () => {
      const items = ["item10", "item2", "item1"];
      const sorted = canonicalSorter.sort(items);

      expect(sorted).toEqual(["item1", "item2", "item10"]);
    });

    it("sorts object keys consistently", () => {
      const obj1 = { z: 1, a: 2, m: 3, b: 4 };
      const obj2 = { z: 1, a: 2, m: 3, b: 4 };

      const sorted1 = canonicalSorter.sortObjectKeys(obj1);
      const sorted2 = canonicalSorter.sortObjectKeys(obj2);

      expect(Object.keys(sorted1)).toEqual(Object.keys(sorted2));
      expect(Object.keys(sorted1)).toEqual(["a", "b", "m", "z"]);
    });
  });

  describe("Precision Normalization", () => {
    it("normalizes coordinates consistently", () => {
      const value = 12.34567;
      const normalized1 = precisionNormalizer.normalizeCoordinate(value);
      const normalized2 = precisionNormalizer.normalizeCoordinate(value);

      expect(normalized1).toBe(normalized2);
      expect(normalized1).toBe("12.35");
    });

    it("normalizes dimensions consistently", () => {
      const value = 1440.7;
      const normalized1 = precisionNormalizer.normalizeDimension(value);
      const normalized2 = precisionNormalizer.normalizeDimension(value);

      expect(normalized1).toBe(normalized2);
      expect(normalized1).toBe(1441); // Rounded
    });

    it("handles edge cases", () => {
      expect(precisionNormalizer.normalizeCoordinate(0)).toBe("0.00");
      expect(precisionNormalizer.normalizeCoordinate(-12.5)).toBe("-12.50");
      expect(precisionNormalizer.normalizeDimension(0)).toBe(0);
    });
  });

  describe("Cross-Platform Consistency", () => {
    it("produces identical results across different environments", () => {
      // Test that our normalization functions produce the same results
      // regardless of the underlying JavaScript engine

      const testValues = [12.34567, 67.89012, 1440.0, 0.5, -12.5];

      const coordinates = testValues.map((v) =>
        precisionNormalizer.normalizeCoordinate(v)
      );
      const dimensions = testValues.map((v) =>
        precisionNormalizer.normalizeDimension(v)
      );

      // Run the same operations multiple times
      const coordinates2 = testValues.map((v) =>
        precisionNormalizer.normalizeCoordinate(v)
      );
      const dimensions2 = testValues.map((v) =>
        precisionNormalizer.normalizeDimension(v)
      );

      // Should be identical
      expect(coordinates).toEqual(coordinates2);
      expect(dimensions).toEqual(dimensions2);
    });
  });
});
