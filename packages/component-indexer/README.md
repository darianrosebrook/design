# @paths-design/component-indexer

TypeScript Compiler API-based component scanner for automatic React component discovery and metadata extraction.

## Features

- ✅ Automatic React component discovery (function, arrow, class components)
- ✅ Full TypeScript type extraction (generics, unions, intersections)
- ✅ JSDoc metadata parsing for categories and tags
- ✅ Stable ULID-based component IDs
- ✅ JSON schema validation with Zod
- ✅ **Watch mode for real-time updates**
- ✅ Include/exclude pattern filtering
- ✅ CLI tool and programmatic API

## Installation

```bash
pnpm add @paths-design/component-indexer
```

## CLI Usage

### One-Time Build

```bash
# Generate component index
designer-index src/components

# With custom output path
designer-index src/components --output dist/components.json

# With tsconfig
designer-index src --tsconfig tsconfig.json

# With include/exclude patterns
designer-index src --include 'ui/**,forms/**' --exclude '**/*.test.tsx'
```

### Watch Mode

```bash
# Watch for changes and rebuild automatically
designer-index src/components --watch

# With custom debounce delay (default: 500ms)
designer-index src/components --watch --debounce 1000
```

## Programmatic API

### One-Time Build

```typescript
import { buildComponentIndex } from '@paths-design/component-indexer';

const index = await buildComponentIndex(
  'src/components',
  'design/component-index.json',
  {
    tsconfigPath: 'tsconfig.json',
    include: ['ui/**', 'forms/**'],
    exclude: ['**/*.test.tsx'],
  }
);
```

### Watch Mode

```typescript
import { watchComponents } from '@paths-design/component-indexer';

const watcher = await watchComponents({
  rootDir: 'src/components',
  outputPath: 'design/component-index.json',
  debounceMs: 500,
  onChange: (filePath) => {
    console.log(`Changed: ${filePath}`);
  },
  onRebuild: (index) => {
    console.log(`Rebuilt index with ${index.components.length} components`);
  },
  onError: (error) => {
    console.error(`Error: ${error.message}`);
  },
});

// Stop watching
process.on('SIGINT', () => {
  watcher.stop();
  process.exit(0);
});
```

### Component Discovery Only

```typescript
import { discoverComponents } from '@paths-design/component-indexer';

const result = await discoverComponents({
  rootDir: 'src/components',
  tsconfigPath: 'tsconfig.json',
});

console.log(`Found ${result.stats.componentsFound} components`);
console.log(`Scanned ${result.stats.filesScanned} files`);
console.log(`Duration: ${result.stats.duration}ms`);
```

## Component Index Schema

```json
{
  "version": "1.0.0",
  "generatedAt": "2025-10-02T12:00:00.000Z",
  "source": {
    "root": "src/components",
    "resolver": "tsconfig",
    "include": ["ui/**", "forms/**"],
    "exclude": ["**/*.test.tsx"]
  },
  "components": [
    {
      "id": "01jaby1c2d3e4f5g6h",
      "name": "Button",
      "modulePath": "src/components/ui/Button.tsx",
      "export": "Button",
      "category": "ui",
      "tags": ["interactive", "form"],
      "props": [
        {
          "name": "variant",
          "type": "\"primary\" | \"secondary\" | \"danger\"",
          "required": false,
          "defaultValue": "primary",
          "description": "Visual style variant",
          "design": {
            "control": "select",
            "options": ["primary", "secondary", "danger"]
          }
        }
      ]
    }
  ]
}
```

## Watch Mode Features

### Automatic Rebuilds

- Watches all `.ts` and `.tsx` files in the root directory
- Debounces multiple rapid changes (configurable delay)
- Rebuilds the index automatically when files change
- Skips test files (`.test.`, `.spec.`, `__tests__`)
- Skips declaration files (`.d.ts`)
- Respects include/exclude patterns

### Callbacks

- `onChange`: Called when a file change is detected
- `onRebuild`: Called after index is successfully rebuilt
- `onError`: Called when an error occurs during rebuild

### Graceful Shutdown

The watcher handles `SIGINT` and `SIGTERM` signals for graceful shutdown:

```typescript
const watcher = await watchComponents({ ... });

process.on('SIGINT', () => {
  watcher.stop();
  process.exit(0);
});
```

## Performance

- **Small project (10 components)**: ~500ms
- **Medium project (50 components)**: ~1.5s
- **Large project (200+ components)**: ~5s
- **Watch mode debounce**: 500ms (default, configurable)

## Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## License

MIT

