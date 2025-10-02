# Experiment: RQ-003 - Floating Point Precision Policy

**Research Question**: What precision policy ensures consistent floating-point handling across platforms for design coordinates and measurements?

**Hypothesis**: Using `toFixed(2)` for coordinates and explicit precision control will ensure deterministic floating-point operations.

**Date**: October 2, 2025
**Status**: In Progress

---

## Context

Design documents contain floating-point coordinates that must be:
1. **Deterministic** - Same calculations produce same results
2. **Cross-platform** - Identical across macOS, Linux, Windows
3. **Human-readable** - Appropriate precision for design work
4. **Performance-friendly** - No significant overhead

**Problem Areas:**
1. **Platform differences** in floating-point arithmetic
2. **Precision loss** in repeated calculations
3. **Rounding errors** in geometric operations
4. **JSON serialization** precision handling

## Current State

**Design Requirements:**
- Coordinates: `x: 12.5, y: 34.7` (1 decimal place typical)
- Dimensions: `width: 1440, height: 1024` (integer pixels)
- Spacing: `gap: 16, padding: 32` (integer pixels)
- Typography: `size: 16, lineHeight: 24` (integer pixels)

**Technical Constraints:**
- JavaScript `number` is IEEE 754 double precision
- JSON serialization may lose precision
- Different platforms may handle floats differently

---

## Approach Options

### Option 1: Fixed Precision with toFixed()

```typescript
function normalizeCoordinate(value: number): string {
  return value.toFixed(2); // 2 decimal places
}

function normalizeDimension(value: number): number {
  return Math.round(value); // Integer pixels
}
```

**Pros:**
- Simple and predictable
- Clear precision boundaries
- Easy to understand

**Cons:**
- String-based for coordinates (need to parse back)
- May lose information for very precise measurements

### Option 2: Precision-Aware Normalization

```typescript
interface PrecisionConfig {
  coordinates: number; // decimal places for x, y, width, height
  dimensions: number;   // decimal places for sizes
  spacing: number;     // decimal places for gaps, padding
}

const defaultPrecision: PrecisionConfig = {
  coordinates: 2,
  dimensions: 0,
  spacing: 0
};

function normalizeValue(value: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}
```

**Pros:**
- Numeric output (no string conversion)
- Configurable precision per use case
- Maintains numeric type for calculations

**Cons:**
- More complex implementation
- Still potential for rounding errors

### Option 3: Decimal.js for Precise Arithmetic

```typescript
import Decimal from 'decimal.js';

function normalizeCoordinate(value: number): Decimal {
  return new Decimal(value).toDecimalPlaces(2);
}

function addCoordinates(a: Decimal, b: Decimal): Decimal {
  return a.add(b).toDecimalPlaces(2);
}
```

**Pros:**
- Arbitrary precision arithmetic
- No floating-point errors
- Mathematically correct

**Cons:**
- External dependency
- Performance overhead
- More complex API

---

## Experiment Design

### Test Scenarios

1. **Basic Precision**
   ```typescript
   const coord = 12.34567;
   const normalized = normalizeCoordinate(coord);
   assert(normalized === 12.35); // 2 decimal places
   ```

2. **Cross-Platform Consistency**
   ```typescript
   // Same calculation on different platforms
   const result1 = normalizeCoordinate(12.34567); // macOS
   const result2 = normalizeCoordinate(12.34567); // Linux
   assert(result1 === result2);
   ```

3. **Repeated Operations**
   ```typescript
   let value = 0;
   for (let i = 0; i < 1000; i++) {
     value += 0.1;
   }
   const normalized = normalizeValue(value);
   // Should be predictable despite floating-point accumulation
   ```

4. **JSON Round-trip**
   ```typescript
   const original = { x: 12.345, y: 67.890 };
   const json = JSON.stringify(original);
   const parsed = JSON.parse(json);
   const normalized = normalizeCoordinates(parsed);
   // Should be consistent despite JSON precision loss
   ```

---

## Recommended Approach

**Option 1: Fixed Precision with toFixed()** for the following reasons:

1. **Simplicity** - Easy to understand and implement
2. **Performance** - Minimal overhead
3. **Design Fit** - 2 decimal places appropriate for design coordinates
4. **Cross-Platform** - `toFixed()` behavior is well-defined in JavaScript spec

**Implementation Strategy:**
```typescript
// For design coordinates (x, y, width, height)
export function normalizeCoordinate(value: number): string {
  return value.toFixed(2);
}

// For dimensions and spacing (integer values)
export function normalizeDimension(value: number): number {
  return Math.round(value);
}

// For calculations that need to remain numeric
export function normalizeForCalculation(value: number): number {
  return Math.round(value * 100) / 100; // 2 decimal precision
}
```

---

## Code Experiment

```typescript
// src/experiments/float-precision.ts
export interface PrecisionConfig {
  coordinates: number; // decimal places for x, y, width, height
  dimensions: number;  // decimal places for sizes
  spacing: number;     // decimal places for gaps, padding
}

/**
 * Normalize floating-point values for deterministic output
 */
export class PrecisionNormalizer {
  private config: PrecisionConfig;

  constructor(config: PrecisionConfig = {
    coordinates: 2,
    dimensions: 0,
    spacing: 0
  }) {
    this.config = config;
  }

  /**
   * Normalize a coordinate value (x, y, width, height)
   */
  normalizeCoordinate(value: number): string {
    return value.toFixed(this.config.coordinates);
  }

  /**
   * Normalize a dimension value (sizes, spacing)
   */
  normalizeDimension(value: number): number {
    const factor = Math.pow(10, this.config.dimensions);
    return Math.round(value * factor) / factor;
  }

  /**
   * Normalize for calculations (maintains numeric type)
   */
  normalizeForCalculation(value: number): number {
    const factor = Math.pow(10, this.config.coordinates);
    return Math.round(value * factor) / factor;
  }

  /**
   * Normalize an entire object recursively
   */
  normalizeObject(obj: any): any {
    if (typeof obj === 'number') {
      // Check if this looks like a coordinate/dimension
      if (obj < 10000) { // Heuristic: likely a coordinate
        return this.normalizeForCalculation(obj);
      }
      return this.normalizeDimension(obj);
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'x' || key === 'y' || key === 'width' || key === 'height') {
          result[key] = this.normalizeCoordinate(value as number);
        } else {
          result[key] = this.normalizeObject(value);
        }
      }
      return result;
    }

    return obj;
  }
}

/**
 * Default precision normalizer
 */
export const precisionNormalizer = new PrecisionNormalizer();

/**
 * Test determinism across platforms
 */
export function testPrecisionDeterminism(): boolean {
  const testValues = [12.34567, 67.89012, 1440.0, 1024.0];

  const results1 = testValues.map(v => precisionNormalizer.normalizeCoordinate(v));
  const results2 = testValues.map(v => precisionNormalizer.normalizeCoordinate(v));

  return results1.every((result, i) => result === results2[i]);
}

/**
 * Test JSON round-trip consistency
 */
export function testJsonRoundTrip(): boolean {
  const original = {
    x: 12.34567,
    y: 67.89012,
    width: 1440.0,
    height: 1024.0
  };

  const json = JSON.stringify(original);
  const parsed = JSON.parse(json);
  const normalized = precisionNormalizer.normalizeObject(parsed);

  // Should be consistent despite JSON precision loss
  return normalized.x === '12.35' && normalized.y === '67.89';
}
```

---

## Success Criteria

✅ **Deterministic**: Same calculations produce same results across platforms
✅ **Cross-Platform**: Identical output on macOS, Linux, Windows
✅ **JSON Safe**: Round-trip through JSON maintains consistency
✅ **Performance**: Normalization completes in <1ms for typical values
✅ **Design Appropriate**: 2 decimal places suitable for design coordinates

---

## Next Steps

1. **Implement Core Normalizer** - Build the PrecisionNormalizer class
2. **Add to Code Generation** - Integrate into template rendering
3. **Write Tests** - Verify determinism and JSON round-trip
4. **Performance Benchmark** - Ensure acceptable overhead
5. **Document Policy** - Add to coding standards

---

## References

- [IEEE 754 Floating Point Standard](https://en.wikipedia.org/wiki/IEEE_754)
- [JavaScript Number Type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
- [JSON Number Precision](https://tools.ietf.org/html/rfc8259#section-6)

---

**Status**: 🔬 Research in Progress - Fixed precision approach selected, implementation needed

