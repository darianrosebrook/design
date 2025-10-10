/**
 * @fileoverview ULID (Universally Unique Lexicographically Sortable Identifier) utilities
 * @author @darianrosebrook
 *
 * ULIDs are 26-character strings that are:
 * - Lexicographically sortable (sortable by creation time)
 * - Collision-resistant (cryptographically secure)
 * - URL-safe (no special characters)
 */
import { ulid as generateUlid } from "ulid";
import { ULID } from "./types.js";
/**
 * Generate a new ULID with current timestamp
 */
export function generateNodeId() {
    return generateUlid();
}
/**
 * Validate that a string is a valid ULID
 */
export function isValidUlid(id) {
    const result = ULID.safeParse(id);
    return result.success;
}
/**
 * Generate multiple ULIDs at once
 */
export function generateNodeIds(count) {
    const ids = [];
    for (let i = 0; i < count; i++) {
        ids.push(generateNodeId());
    }
    return ids;
}
/**
 * Extract timestamp from ULID (first 10 characters as base32)
 */
export function getUlidTimestamp(ulid) {
    if (!isValidUlid(ulid)) {
        throw new Error(`Invalid ULID: ${ulid}`);
    }
    // ULID timestamp is encoded in first 10 characters
    const timestampPart = ulid.substring(0, 10);
    // Decode from base32 (Crockford alphabet)
    const base32Chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    let timestamp = 0;
    for (let i = 0; i < timestampPart.length; i++) {
        const char = timestampPart[i];
        const value = base32Chars.indexOf(char);
        if (value === -1) {
            throw new Error(`Invalid ULID character: ${char}`);
        }
        timestamp = timestamp * 32 + value;
    }
    return timestamp;
}
/**
 * Check if ULID was created within a time range
 */
export function isUlidInTimeRange(ulid, startTime, endTime) {
    const timestamp = getUlidTimestamp(ulid);
    return timestamp >= startTime && timestamp <= endTime;
}
