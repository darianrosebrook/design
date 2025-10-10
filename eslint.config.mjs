/**
 * @fileoverview ESLint configuration for Designer project
 * @author @darianrosebrook
 *
 * This configuration uses ESLint 9+ flat config format.
 * Different rules apply to different packages based on their environment.
 */

// @ts-check
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/*.d.ts",
      "**/.ignored/**",
      "**/examples/**",
      "**/prototypes/**",
      "**/audit/**", // Legacy audit files with many linting errors
      "**/scripts/**", // Development scripts with require() imports
      "**/.next/**",
      "**/stryker-tmp/**",
      "apps/tools/caws/**", // CAWS tools have their own rules
      "docs/**", // Documentation and experiments
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/tests/**",
      "**/*.config.ts",
      "**/*.config.js",
      "**/*.config.mjs",
      "packages/design-editor/**", // TODO: Fix 115 linting errors
      "packages/old-design-editor/**", // TODO: Fix 164 linting errors
      "packages/plugin-testing/**", // TODO: Fix 7 linting errors
      "packages/properties-panel/**", // TODO: Fix 4 linting errors
      "packages/vscode-ext/**", // TODO: Fix VS Code extension linting errors
      "packages/design-system/src/composers/Popover.tsx", // TODO: Fix unused tokens
      "packages/design-system/src/composers/ToggleButton.tsx", // TODO: Fix unused tokens
    ],
  },

  // Extend recommended configs
  ...tseslint.configs.recommended,

  // Base configuration for all TypeScript files
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: [
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/*.config.ts",
      "**/tests/**",
      "**/docs/**",
      "**/.next/**",
      "**/stryker-tmp/**",
    ],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      parserOptions: {
        projectService: false,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript-specific rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],

      // Import rules
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "never",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "error",

      // General JavaScript/TypeScript rules
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      curly: ["error", "all"],
      "no-throw-literal": "error",
    },
  },

  // Next.js design editor package
  {
    files: ["packages/design-editor/**/*.{ts,tsx,js,jsx}"],
    ignores: [
      "packages/design-editor/.next/**",
      "packages/design-editor/dist/**",
      "packages/design-editor/node_modules/**",
    ],
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        Request: "readonly",
        Response: "readonly",
        Headers: "readonly",
      },
    },
    rules: {
      curly: ["error", "multi-line"],
      "import/order": "off",
      "import/no-duplicates": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-empty-object-type": "warn",
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },

  // Node.js library packages (canvas-schema, canvas-engine)
  {
    files: ["packages/canvas-schema/**/*.ts", "packages/canvas-engine/**/*.ts"],
    rules: {
      // Stricter rules for core libraries
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": "error", // No console logs in libraries
    },
  },

  // Canvas schema package - allow necessary any types for Zod schemas
  {
    files: ["packages/canvas-schema/**/*.ts"],
    rules: {
      // Zod schemas and validation functions need any types for flexibility
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Canvas engine package - allow necessary any types for traversal
  {
    files: ["packages/canvas-engine/**/*.ts"],
    rules: {
      // Traversal functions need any types for dynamic object access
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Code generation package (codegen-react)
  {
    files: ["packages/codegen-react/**/*.ts"],
    rules: {
      // Allow console in code generation
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      // Template strings may have any types
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // CLI files - allow console and necessary any types
  {
    files: ["packages/codegen-react/src/cli.ts"],
    rules: {
      // CLI needs console for user interaction
      "no-console": "off",
      // CLI needs any for dynamic JSON parsing and flexible artboard handling
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Generator files - allow necessary any types for flexibility
  {
    files: ["packages/codegen-react/src/generator.ts"],
    rules: {
      // Allow any for artboard parameter to handle various structures
      "@typescript-eslint/no-explicit-any": [
        "warn",
        {
          ignoreRestArgs: true,
          fixToUnknown: false,
        },
      ],
    },
  },

  // Test files - more lenient rules
  {
    files: ["**/*.test.ts", "**/*.spec.ts", "**/tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  // CAWS tools and scripts
  {
    files: ["apps/tools/caws/**/*.{js,ts}"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // Configuration files
  {
    files: ["*.config.{js,ts}", "*.config.*.{js,ts}"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  }
);
