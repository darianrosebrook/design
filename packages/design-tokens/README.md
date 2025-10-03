# Design Tokens

**Local-first design tokens with reference resolution, auto-regeneration, and semantic versioning.**

## Features

- **Token References**: Reference tokens within tokens using `{token.path}` syntax
- **Automatic Resolution**: Circular dependency detection and reference validation
- **File Watching**: Auto-regenerate CSS when tokens change
- **Schema Validation**: Type-safe tokens with Zod schemas
- **Versioning & Migration**: Semantic versioning with automatic migration
- **CSS Generation**: Transform tokens to CSS custom properties
- **TypeScript Types**: Full type safety and IntelliSense support

## Installation

```bash
npm install @paths-design/design-tokens
```

## Quick Start

### 1. Define Tokens

Create `design/tokens.json`:

```json
{
  "version": "1.0.0",
  "color": {
    "brand": {
      "primary": "#4F46E5",
      "secondary": "{color.brand.primary}",
      "hover": "#4338CA"
    }
  },
  "space": {
    "sm": 8,
    "md": "{space.sm}",
    "lg": 16
  }
}
```

### 2. Generate CSS

```typescript
import { tokensToCSS } from "@paths-design/design-tokens";
import fs from "fs";

const tokens = JSON.parse(fs.readFileSync("design/tokens.json", "utf8"));
const css = tokensToCSS(tokens);

fs.writeFileSync("src/ui/tokens.css", css);
```

**Output:**

```css
:root {
  --color-brand-primary: #4F46E5;
  --color-brand-secondary: #4F46E5;
  --color-brand-hover: #4338CA;
  --space-sm: 8px;
  --space-md: 8px;
  --space-lg: 16px;
}
```

### 3. Watch for Changes

```typescript
import { watchTokensSimple } from "@paths-design/design-tokens";

const watcher = watchTokensSimple(
  "design/tokens.json",
  "src/ui/tokens.css",
  { verbose: true }
);

// Later, stop watching
watcher.stop();
```

## Token References

Reference other tokens using `{token.path}` syntax:

```json
{
  "color": {
    "background": {
      "primary": "#0B0B0B",
      "secondary": "{color.background.primary}",
      "surface": "{color.background.secondary}"
    },
    "text": {
      "inverse": "{color.background.primary}"
    }
  }
}
```

**Features:**
- Nested references (A → B → C)
- Circular dependency detection
- Max depth limiting (default: 5 levels)
- Strict/non-strict validation modes

### Reference Resolution

```typescript
import { resolveTokenReferences } from "@paths-design/design-tokens";

const resolved = resolveTokenReferences(tokens, {
  strict: true, // Throw on invalid references
  maxDepth: 10, // Max nesting depth
});
```

### Reference Validation

```typescript
import { validateTokenReferences } from "@paths-design/design-tokens";

const result = validateTokenReferences(tokens);

if (!result.valid) {
  console.error("Invalid references:", result.errors);
}
```

### Dependency Analysis

```typescript
import {
  getTokenDependents,
  getTokenDependencies,
} from "@paths-design/design-tokens";

// What depends on this token?
const dependents = getTokenDependents(tokens, "color.brand.primary");
// ["color.brand.secondary", "color.interactive.primary"]

// What does this token depend on?
const dependencies = getTokenDependencies(tokens, "color.brand.secondary");
// ["color.brand.primary"]
```

## File Watching

Auto-regenerate CSS when tokens change:

```typescript
import { watchTokens } from "@paths-design/design-tokens";

const watcher = watchTokens({
  tokensPath: "design/tokens.json",
  outputPath: "src/ui/tokens.css",
  debounceMs: 300,
  verbose: true,
  onRegenerate: (css) => {
    console.log("✅ Regenerated CSS:", css.length, "bytes");
  },
  onError: (error) => {
    console.error("❌ Error:", error.message);
  },
});

// Manual regeneration
await watcher.regenerate();

// Stop watching
watcher.stop();
```

**Features:**
- Debounced file changes (default: 300ms)
- Schema validation before regeneration
- Reference validation before regeneration
- Error callbacks for invalid JSON/schema
- Manual regeneration trigger

## Versioning & Migration

### Check Compatibility

```typescript
import { checkCompatibility } from "@paths-design/design-tokens";

const report = checkCompatibility(tokens);

console.log(report);
// {
//   version: "0.1.0",
//   isSupported: true,
//   isCurrent: false,
//   needsMigration: true,
//   canMigrate: true,
//   migrationPath: ["0.1.0->1.0.0"],
//   warnings: []
// }
```

### Auto-Migration

```typescript
import { autoMigrate } from "@paths-design/design-tokens";

const result = autoMigrate(oldTokens);

if (result.success) {
  console.log("Migrated to:", result.toVersion);
  fs.writeFileSync("design/tokens.json", JSON.stringify(result.tokens, null, 2));
} else {
  console.error("Migration failed:", result.error);
}
```

### Supported Versions

- `0.1.0`: Initial schema (legacy `schemaVersion` field)
- `1.0.0`: Current schema (with `$schema` and `version` fields)

## API Reference

### Tokens

- `DesignTokens`: Token schema type
- `DesignTokensSchema`: Zod schema for validation
- `defaultTokens`: Default token values

### Reference Resolution

- `resolveTokenReferences(tokens, options?)`: Resolve all token references
- `validateTokenReferences(tokens)`: Validate references without resolving
- `isTokenReference(value)`: Check if value is a reference
- `extractReferencePath(reference)`: Extract path from reference
- `getTokenByPath(tokens, path)`: Get token value by path
- `buildDependencyGraph(tokens)`: Build dependency graph
- `detectCircularReferences(tokens)`: Find circular dependencies
- `getTokenDependents(tokens, path)`: Get tokens that depend on path
- `getTokenDependencies(tokens, path)`: Get tokens path depends on

### CSS Generation

- `tokensToCSS(tokens, selector?, options?)`: Generate CSS custom properties
- `flattenTokens(tokens, prefix?, options?)`: Flatten tokens to flat object

### File Watching

- `watchTokens(options)`: Watch tokens file and auto-regenerate CSS
- `watchTokensSimple(tokensPath, outputPath, options?)`: Simpler watch API

### Versioning

- `detectVersion(tokens)`: Detect token schema version
- `needsMigration(tokens)`: Check if migration is needed
- `migrateTokens(tokens, targetVersion?)`: Migrate to specific version
- `autoMigrate(tokens)`: Auto-migrate to latest version
- `isSupportedVersion(version)`: Check if version is supported
- `getSupportedVersions()`: Get all supported versions
- `checkCompatibility(tokens)`: Get compatibility report

## Schema

### Token Types

```typescript
interface DesignTokens {
  $schema?: string;
  version?: string; // or schemaVersion for 0.1.0
  color: {
    background: { primary: string; secondary: string; /* ... */ };
    text: { primary: string; secondary: string; /* ... */ };
    border: { subtle: string; default: string; /* ... */ };
    interactive: { primary: string; primaryHover: string; /* ... */ };
    semantic: { success: string; warning: string; /* ... */ };
  };
  space: {
    xs: number; sm: number; md: number; lg: number; xl: number;
    "2xl": number; "3xl": number;
  };
  type: {
    family: { sans: string; mono: string };
    size: { xs: number; sm: number; /* ... */ };
    weight: { normal: string; medium: string; /* ... */ };
    lineHeight: { tight: number; normal: number; loose: number };
  };
  radius: { none: number; sm: number; /* ... */ };
  shadow: { sm: string; md: string; /* ... */ };
  borderWidth: { none: number; sm: number; /* ... */ };
  zIndex: { dropdown: number; sticky: number; /* ... */ };
}
```

### Token References

Token values can be:
- **Literal values**: `"#4F46E5"`, `16`, `"Inter, sans-serif"`
- **References**: `"{color.brand.primary}"`, `"{space.md}"`

References are resolved before CSS generation.

## Migration Guide

### 0.1.0 → 1.0.0

**Changes:**
- Renamed `schemaVersion` → `version`
- Added `$schema` field

**Migration:**

```typescript
import { migrateTokens } from "@paths-design/design-tokens";

const oldTokens = {
  schemaVersion: "0.1.0",
  color: { /* ... */ }
};

const result = migrateTokens(oldTokens, "1.0.0");

if (result.success) {
  // Save migrated tokens
  fs.writeFileSync(
    "design/tokens.json",
    JSON.stringify(result.tokens, null, 2)
  );
}
```

**Result:**

```json
{
  "$schema": "https://paths.design/schemas/design-tokens/1.0.0.json",
  "version": "1.0.0",
  "color": { /* ... */ }
}
```

## Best Practices

### 1. Use Semantic Token Names

```json
{
  "color": {
    "brand": { "primary": "#4F46E5" },
    "interactive": { "primary": "{color.brand.primary}" }
  }
}
```

### 2. Avoid Deep Nesting

```json
// ❌ Too deep
"hover": "{color.interactive.primary}" // → {color.brand.primary} → ...

// ✅ Better
"hover": "#4338CA"
```

### 3. Validate References

```typescript
const validation = validateTokenReferences(tokens);
if (!validation.valid) {
  throw new Error(validation.errors.join(", "));
}
```

### 4. Use File Watcher in Development

```typescript
if (process.env.NODE_ENV === "development") {
  watchTokensSimple("design/tokens.json", "src/ui/tokens.css");
}
```

### 5. Version Your Tokens

```json
{
  "$schema": "https://paths.design/schemas/design-tokens/1.0.0.json",
  "version": "1.0.0",
  "color": { /* ... */ }
}
```

## Examples

### Basic Usage

```typescript
import {
  tokensToCSS,
  resolveTokenReferences,
} from "@paths-design/design-tokens";

const tokens = {
  version: "1.0.0",
  color: {
    brand: { primary: "#4F46E5" },
    interactive: { primary: "{color.brand.primary}" }
  }
};

// Resolve references
const resolved = resolveTokenReferences(tokens);
// { color: { brand: { primary: "#4F46E5" }, interactive: { primary: "#4F46E5" } } }

// Generate CSS
const css = tokensToCSS(tokens);
// :root { --color-brand-primary: #4F46E5; --color-interactive-primary: #4F46E5; }
```

### Watch & Auto-Regenerate

```typescript
import { watchTokens } from "@paths-design/design-tokens";

const watcher = watchTokens({
  tokensPath: "design/tokens.json",
  outputPath: "src/ui/tokens.css",
  onRegenerate: () => console.log("✅ CSS updated"),
  onError: (err) => console.error("❌ Error:", err),
});
```

### Version Check & Migration

```typescript
import { checkCompatibility, autoMigrate } from "@paths-design/design-tokens";

const report = checkCompatibility(tokens);

if (report.needsMigration && report.canMigrate) {
  const result = autoMigrate(tokens);
  if (result.success) {
    console.log("✅ Migrated to:", result.toVersion);
  }
}
```

## Testing

```bash
npm test              # Run all tests
npm run build         # Build TypeScript
npm run test:coverage # Generate coverage report
```

## License

MIT

## Author

@darianrosebrook

