/**
 * @fileoverview ULID (Universally Unique Lexicographically Sortable Identifier) utilities
 * @author @darianrosebrook
 *
 * ULIDs are 26-character strings that are:
 * - Lexicographically sortable (sortable by creation time)
 * - Collision-resistant (cryptographically secure)
 * - URL-safe (no special characters)
 */
import type { ULIDType } from "./types.js";
/**
 * Generate a new ULID with current timestamp
 */
export declare function generateNodeId(): string;
/**
 * Validate that a string is a valid ULID
 */
export declare function isValidUlid(id: string): id is ULIDType;
/**
 * Generate multiple ULIDs at once
 */
export declare function generateNodeIds(count: number): string[];
/**
 * Extract timestamp from ULID (first 10 characters as base32)
 */
export declare function getUlidTimestamp(ulid: string): number;
/**
 * Check if ULID was created within a time range
 */
export declare function isUlidInTimeRange(ulid: string, startTime: number, endTime: number): boolean;
//# sourceMappingURL=ulid.d.ts.map