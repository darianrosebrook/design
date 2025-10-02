# Experiment: RQ-001 - Clock Injection Pattern

**Research Question**: How do we inject a deterministic clock into the code generation system to ensure identical output across runs and machines?

**Hypothesis**: A dependency injection pattern with optional Clock interface will provide deterministic timestamps while maintaining flexibility for testing.

**Date**: October 2, 2025
**Status**: In Progress

---

## Context

Code generation must be deterministic - identical input should produce identical output bytes. However, generated code often includes timestamps, random IDs, or other non-deterministic elements.

**Problem Areas:**
1. **Timestamps** in generated files (creation dates, version stamps)
2. **Random IDs** for elements that need uniqueness
3. **Build metadata** that varies between environments
4. **Date.now()** calls in template rendering

## Approach Options

### Option 1: Dependency Injection Pattern

```typescript
interface Clock {
  now(): number;
  uuid(): string;
  random(): number;
}

function generateCode(doc: CanvasDocument, options: { clock?: Clock } = {}) {
  const clock = options.clock ?? {
    now: () => Date.now(),
    uuid: () => generateUlid(),
    random: () => Math.random()
  };

  // Use clock.now() instead of Date.now()
}
```

**Pros:**
- Clean separation of concerns
- Easy to test with fixed clock
- Minimal performance overhead
- Flexible for different use cases

**Cons:**
- Requires passing clock through call chain
- API surface increases slightly

### Option 2: Context/Ambient Pattern

```typescript
// Global context (careful with this approach)
const ClockContext = createContext<Clock | null>(null);

function useClock() {
  const clock = useContext(ClockContext);
  if (!clock) throw new Error('Clock not provided');
  return clock;
}

function generateCode() {
  const clock = useClock();
  // Use clock.now()
}
```

**Pros:**
- No parameter passing required
- Familiar React-like pattern

**Cons:**
- Global state makes testing harder
- Context provider overhead
- Less explicit dependencies

### Option 3: Builder Pattern

```typescript
class CodeGenerator {
  private clock: Clock;

  constructor(clock?: Clock) {
    this.clock = clock ?? { now: () => Date.now() };
  }

  generate(doc: CanvasDocument): GeneratedCode {
    // Use this.clock.now()
  }
}

const generator = new CodeGenerator(fixedClock);
const code = generator.generate(document);
```

**Pros:**
- Encapsulated state
- Clear ownership
- Easy to test

**Cons:**
- More object-oriented approach
- Slightly more verbose

---

## Experiment Design

### Test Scenarios

1. **Basic Determinism**
   ```typescript
   // Same input should produce same output
   const output1 = generate(document, { clock: fixedClock });
   const output2 = generate(document, { clock: fixedClock });
   assert(hash(output1) === hash(output2));
   ```

2. **Cross-Platform Consistency**
   ```typescript
   // Different machines/OS should produce same output
   const outputMac = generate(document, { clock: fixedClock });
   const outputLinux = generate(document, { clock: fixedClock });
   assert(hash(outputMac) === hash(outputLinux));
   ```

3. **Test Flexibility**
   ```typescript
   // Tests can use controlled time
   const testClock = { now: () => 1234567890000 };
   const output = generate(document, { clock: testClock });
   // Verify timestamps are as expected
   ```

### Implementation Approach

We'll implement **Option 1 (Dependency Injection)** as it provides the best balance of:
- **Testability** - Easy to inject fixed clocks in tests
- **Performance** - No global state or context overhead
- **Explicitness** - Dependencies are clear in function signatures
- **Flexibility** - Can use different clocks for different scenarios

---

## Code Experiment

```typescript
// src/experiments/clock-injection.ts
import { CanvasDocument } from '@paths-design/canvas-schema';

interface Clock {
  now(): number;
  uuid(): string;
}

interface CodeGenOptions {
  clock?: Clock;
  format?: 'tsx' | 'jsx';
  indent?: number;
}

export function generateReactComponent(
  doc: CanvasDocument,
  options: CodeGenOptions = {}
): string {
  const clock = options.clock ?? {
    now: () => Date.now(),
    uuid: () => generateUlid()
  };

  const timestamp = clock.now();
  const componentId = clock.uuid();

  return `// Generated at ${timestamp}
// Component ID: ${componentId}
import React from 'react';

export default function GeneratedComponent() {
  return (
    <div>
      {/* Generated content */}
    </div>
  );
}`;
}

// Test with fixed clock
const fixedClock: Clock = {
  now: () => 1234567890000,
  uuid: () => '01JF2PZV9G2WR5C3W7P0YHNX9D'
};

const output1 = generateReactComponent(document, { clock: fixedClock });
const output2 = generateReactComponent(document, { clock: fixedClock });

// Should be identical
assert(output1 === output2);
```

---

## Success Criteria

✅ **Determinism Verified**: Same input + same clock → identical output
✅ **Testability**: Tests can use fixed clocks for predictable behavior
✅ **Performance**: No significant overhead from clock injection
✅ **Cross-Platform**: Output identical across macOS, Linux, Windows
✅ **Error Handling**: Clear errors when clock operations fail

---

## Next Steps

1. **Implement Basic Pattern** - Build the dependency injection approach
2. **Add to Code Generator** - Integrate into actual code generation pipeline
3. **Write Tests** - Verify determinism across scenarios
4. **Document Pattern** - Add to coding standards and examples

---

## References

- [Deterministic Builds in Software Engineering](https://martinfowler.com/bliki/DeterministicBuild.html)
- [Reproducible Builds](https://reproducible-builds.org/)
- [Clock Injection in Testing](https://martinfowler.com/articles/mocksArentStubs.html#Clock)

---

**Status**: 🔬 Research in Progress - Basic pattern implemented, testing needed

