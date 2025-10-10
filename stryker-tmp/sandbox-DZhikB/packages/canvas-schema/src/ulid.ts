/**
 * @fileoverview ULID (Universally Unique Lexicographically Sortable Identifier) utilities
 * @author @darianrosebrook
 *
 * ULIDs are 26-character strings that are:
 * - Lexicographically sortable (sortable by creation time)
 * - Collision-resistant (cryptographically secure)
 * - URL-safe (no special characters)
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
import { ulid as generateUlid } from "ulid";
import type { ULIDType } from "./types.js";
import { ULID } from "./types.js";

/**
 * Generate a new ULID with current timestamp
 */
export function generateNodeId(): string {
  if (stryMutAct_9fa48("462")) {
    {}
  } else {
    stryCov_9fa48("462");
    return generateUlid();
  }
}

/**
 * Validate that a string is a valid ULID
 */
export function isValidUlid(id: string): id is ULIDType {
  if (stryMutAct_9fa48("463")) {
    {}
  } else {
    stryCov_9fa48("463");
    const result = ULID.safeParse(id);
    return result.success;
  }
}

/**
 * Generate multiple ULIDs at once
 */
export function generateNodeIds(count: number): string[] {
  if (stryMutAct_9fa48("464")) {
    {}
  } else {
    stryCov_9fa48("464");
    const ids: string[] = stryMutAct_9fa48("465") ? ["Stryker was here"] : (stryCov_9fa48("465"), []);
    for (let i = 0; stryMutAct_9fa48("468") ? i >= count : stryMutAct_9fa48("467") ? i <= count : stryMutAct_9fa48("466") ? false : (stryCov_9fa48("466", "467", "468"), i < count); stryMutAct_9fa48("469") ? i-- : (stryCov_9fa48("469"), i++)) {
      if (stryMutAct_9fa48("470")) {
        {}
      } else {
        stryCov_9fa48("470");
        ids.push(generateNodeId());
      }
    }
    return ids;
  }
}

/**
 * Extract timestamp from ULID (first 10 characters as base32)
 */
export function getUlidTimestamp(ulid: string): number {
  if (stryMutAct_9fa48("471")) {
    {}
  } else {
    stryCov_9fa48("471");
    if (stryMutAct_9fa48("474") ? false : stryMutAct_9fa48("473") ? true : stryMutAct_9fa48("472") ? isValidUlid(ulid) : (stryCov_9fa48("472", "473", "474"), !isValidUlid(ulid))) {
      if (stryMutAct_9fa48("475")) {
        {}
      } else {
        stryCov_9fa48("475");
        throw new Error(stryMutAct_9fa48("476") ? `` : (stryCov_9fa48("476"), `Invalid ULID: ${ulid}`));
      }
    }

    // ULID timestamp is encoded in first 10 characters
    const timestampPart = stryMutAct_9fa48("477") ? ulid : (stryCov_9fa48("477"), ulid.substring(0, 10));

    // Decode from base32 (Crockford alphabet)
    const base32Chars = stryMutAct_9fa48("478") ? "" : (stryCov_9fa48("478"), "0123456789ABCDEFGHJKMNPQRSTVWXYZ");
    let timestamp = 0;
    for (let i = 0; stryMutAct_9fa48("481") ? i >= timestampPart.length : stryMutAct_9fa48("480") ? i <= timestampPart.length : stryMutAct_9fa48("479") ? false : (stryCov_9fa48("479", "480", "481"), i < timestampPart.length); stryMutAct_9fa48("482") ? i-- : (stryCov_9fa48("482"), i++)) {
      if (stryMutAct_9fa48("483")) {
        {}
      } else {
        stryCov_9fa48("483");
        const char = timestampPart[i];
        const value = base32Chars.indexOf(char);
        if (stryMutAct_9fa48("486") ? value !== -1 : stryMutAct_9fa48("485") ? false : stryMutAct_9fa48("484") ? true : (stryCov_9fa48("484", "485", "486"), value === (stryMutAct_9fa48("487") ? +1 : (stryCov_9fa48("487"), -1)))) {
          if (stryMutAct_9fa48("488")) {
            {}
          } else {
            stryCov_9fa48("488");
            throw new Error(stryMutAct_9fa48("489") ? `` : (stryCov_9fa48("489"), `Invalid ULID character: ${char}`));
          }
        }
        timestamp = stryMutAct_9fa48("490") ? timestamp * 32 - value : (stryCov_9fa48("490"), (stryMutAct_9fa48("491") ? timestamp / 32 : (stryCov_9fa48("491"), timestamp * 32)) + value);
      }
    }
    return timestamp;
  }
}

/**
 * Check if ULID was created within a time range
 */
export function isUlidInTimeRange(ulid: string, startTime: number, endTime: number): boolean {
  if (stryMutAct_9fa48("492")) {
    {}
  } else {
    stryCov_9fa48("492");
    const timestamp = getUlidTimestamp(ulid);
    return stryMutAct_9fa48("495") ? timestamp >= startTime || timestamp <= endTime : stryMutAct_9fa48("494") ? false : stryMutAct_9fa48("493") ? true : (stryCov_9fa48("493", "494", "495"), (stryMutAct_9fa48("498") ? timestamp < startTime : stryMutAct_9fa48("497") ? timestamp > startTime : stryMutAct_9fa48("496") ? true : (stryCov_9fa48("496", "497", "498"), timestamp >= startTime)) && (stryMutAct_9fa48("501") ? timestamp > endTime : stryMutAct_9fa48("500") ? timestamp < endTime : stryMutAct_9fa48("499") ? true : (stryCov_9fa48("499", "500", "501"), timestamp <= endTime)));
  }
}