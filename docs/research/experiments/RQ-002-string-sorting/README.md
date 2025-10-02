# Experiment: RQ-002 - Canonical String Sorting Algorithm

**Research Question**: What sorting algorithm guarantees cross-platform stability for object keys and ensures deterministic string output?

**Hypothesis**: Using `Intl.Collator` with consistent locale settings will provide stable, deterministic sorting across platforms.

**Date**: October 2, 2025
**Status**: In Progress

---

## Context

JavaScript object iteration order is insertion-order, but we need deterministic string output regardless of:
1. **Platform differences** (macOS vs Linux vs Windows)
2. **Node.js versions** (different V8 engines)
3. **JavaScript engines** (V8 vs SpiderMonkey vs JSC)
4. **Collation rules** (different locale behaviors)

**Problem Areas:**
1. **Object key ordering** in JSON serialization
2. **Array sorting** for consistent output
3. **String comparison** for stable sorting
4. **Unicode normalization** differences

## Approach Options

### Option 1: Intl.Collator (Recommended)

```typescript
const collator = new Intl.Collator('en-US', {
  numeric: true,
  sensitivity: 'base',
  ignorePunctuation: false
});

function canonicalSort(keys: string[]): string[] {
  return keys.sort(collator.compare);
}
```

**Pros:**
- Handles Unicode correctly
- Consistent across platforms
- Respects numeric ordering
- Standard JavaScript API

**Cons:**
- Performance overhead
- Locale dependency

### Option 2: Simple String Comparison

```typescript
function canonicalSort(keys: string[]): string[] {
  return keys.sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
}
```

**Pros:**
- Fast and simple
- No external dependencies

**Cons:**
- Unicode handling issues
- Platform differences in string comparison

### Option 3: Custom Unicode-Aware Sorting

```typescript
function canonicalSort(keys: string[]): string[] {
  return keys.sort((a, b) => {
    // Normalize Unicode
    const aNorm = a.normalize('NFD');
    const bNorm = b.normalize('NFD');

    // Compare character by character
    for (let i = 0; i < Math.max(aNorm.length, bNorm.length); i++) {
      const aChar = aNorm.charCodeAt(i) || 0;
      const bChar = bNorm.charCodeAt(i) || 0;

      if (aChar !== bChar) {
        return aChar - bChar;
      }
    }
    return 0;
  });
}
```

**Pros:**
- Full Unicode control
- Completely deterministic

**Cons:**
- Complex implementation
- Performance overhead
- Maintenance burden

---

## Experiment Design

### Test Scenarios

1. **Basic ASCII Sorting**
   ```typescript
   const keys = ['z', 'a', 'm', 'b'];
   const sorted = canonicalSort(keys);
   assert(sorted.join('') === 'abmz');
   ```

2. **Numeric Sorting**
   ```typescript
   const keys = ['item10', 'item2', 'item1'];
   const sorted = canonicalSort(keys);
   assert(sorted.join(',') === 'item1,item2,item10');
   ```

3. **Unicode Handling**
   ```typescript
   const keys = ['café', 'cafe', ' résumé', 'resume'];
   const sorted = canonicalSort(keys);
   // Should handle accents consistently
   ```

4. **Cross-Platform Consistency**
   ```typescript
   // Same keys sorted on different platforms
   const keys = ['beta', 'alpha', 'gamma'];
   const sortedMac = canonicalSort(keys); // macOS
   const sortedLinux = canonicalSort(keys); // Linux
   assert(sortedMac.join('') === sortedLinux.join(''));
   ```

---

## Implementation

```typescript
// src/experiments/string-sorting.ts
export interface SortOptions {
  locale?: string;
  numeric?: boolean;
  caseFirst?: 'upper' | 'lower' | 'false';
}

/**
 * Canonical string sorter for deterministic output
 */
export class CanonicalSorter {
  private collator: Intl.Collator;

  constructor(options: SortOptions = {}) {
    this.collator = new Intl.Collator(options.locale || 'en-US', {
      numeric: options.numeric ?? true,
      sensitivity: 'base',
      ignorePunctuation: false,
      caseFirst: options.caseFirst || 'false'
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

  /**
   * Test if sorting is deterministic across platforms
   */
  testDeterminism(items: string[]): boolean {
    const sorted1 = this.sort(items);
    const sorted2 = this.sort(items);
    return sorted1.join('') === sorted2.join('');
  }
}

/**
 * Default canonical sorter instance
 */
export const canonicalSorter = new CanonicalSorter();

/**
 * Convenience function for sorting strings
 */
export function canonicalSort(items: string[], options?: SortOptions): string[] {
  const sorter = options ? new CanonicalSorter(options) : canonicalSorter;
  return sorter.sort(items);
}

/**
 * Convenience function for sorting object keys
 */
export function canonicalSortKeys(obj: Record<string, any>, options?: SortOptions): Record<string, any> {
  const sorter = options ? new CanonicalSorter(options) : canonicalSorter;
  return sorter.sortObjectKeys(obj);
}
```

---

## Test Cases

```typescript
// Basic ASCII sorting
const asciiKeys = ['z', 'a', 'm', 'b'];
const sorted = canonicalSort(asciiKeys);
console.log('ASCII sort:', sorted); // ['a', 'b', 'm', 'z']

// Numeric sorting
const numericKeys = ['item10', 'item2', 'item1'];
const sortedNumeric = canonicalSort(numericKeys);
console.log('Numeric sort:', sortedNumeric); // ['item1', 'item2', 'item10']

// Object key sorting
const obj = { z: 1, a: 2, m: 3, b: 4 };
const sortedObj = canonicalSortKeys(obj);
console.log('Object keys:', Object.keys(sortedObj)); // ['a', 'b', 'm', 'z']
```

---

## Success Criteria

✅ **Deterministic**: Same input always produces same output
✅ **Cross-Platform**: Identical results on macOS, Linux, Windows
✅ **Unicode Safe**: Handles accents, case, and special characters correctly
✅ **Performance**: Sorts 1000 keys in <10ms
✅ **Standards Compliant**: Follows Unicode collation standards

---

## Next Steps

1. **Implement Core Algorithm** - Build the CanonicalSorter class
2. **Add to JSON Serializer** - Integrate with canonical.ts
3. **Write Comprehensive Tests** - Verify determinism across scenarios
4. **Performance Benchmark** - Ensure acceptable performance overhead
5. **Document Usage** - Add to coding standards

---

## References

- [ECMAScript Intl.Collator](https://tc39.es/ecma402/#collator-objects)
- [Unicode Collation Algorithm](https://unicode.org/reports/tr10/)
- [JavaScript String Comparison](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare)

---

**Status**: 🔬 Research in Progress - Intl.Collator approach selected, implementation needed

