/**
 * @fileoverview Tests for ULID utilities
 * @author @darianrosebrook
 */

import { describe, it, expect } from "vitest";
import {
  generateNodeId,
  isValidUlid,
  generateNodeIds,
  getUlidTimestamp,
} from "../src/ulid.js";

describe("ULID Utilities", () => {
  describe("generateNodeId", () => {
    it("generates valid ULIDs", () => {
      const id1 = generateNodeId();
      const id2 = generateNodeId();

      expect(isValidUlid(id1)).toBe(true);
      expect(isValidUlid(id2)).toBe(true);
      expect(id1).not.toBe(id2); // Should be unique
    });

    it("generates ULIDs of correct length", () => {
      const id = generateNodeId();
      expect(id).toHaveLength(26);
    });
  });

  describe("isValidUlid", () => {
    it("accepts valid ULIDs", () => {
      const validUlids = [
        "01JF2PZV9G2WR5C3W7P0YHNX9D",
        "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
        "00000000000000000000000000",
      ];

      for (const ulid of validUlids) {
        expect(isValidUlid(ulid)).toBe(true);
      }
    });

    it("rejects invalid ULIDs", () => {
      const invalidUlids = [
        "",
        "invalid",
        "01JF2PZV9G2WR5C3W7P0YHNX9D1", // too long
        "01JF2PZV9G2WR5C3W7P0YHNX9", // too short
        "01JF2PZV9G2WR5C3W7P0YHNX9I", // invalid character 'I' not in base32
        "01JF2PZV9G2WR5C3W7P0YHNX9D!", // invalid character '!'
      ];

      for (const ulid of invalidUlids) {
        expect(isValidUlid(ulid)).toBe(false);
      }
    });
  });

  describe("generateNodeIds", () => {
    it("generates multiple unique IDs", () => {
      const ids = generateNodeIds(5);
      expect(ids).toHaveLength(5);

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5); // All should be unique
    });

    it("generates valid ULIDs in batch", () => {
      const ids = generateNodeIds(3);
      for (const id of ids) {
        expect(isValidUlid(id)).toBe(true);
      }
    });
  });

  describe("getUlidTimestamp", () => {
    it("extracts timestamp from ULID", () => {
      const ulid = "01JF2PZV9G2WR5C3W7P0YHNX9D";
      const timestamp = getUlidTimestamp(ulid);

      expect(typeof timestamp).toBe("number");
      expect(timestamp).toBeGreaterThan(0);
    });

    it("throws for invalid ULID", () => {
      expect(() => getUlidTimestamp("invalid")).toThrow();
    });
  });
});
