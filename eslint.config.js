/**
 * @fileoverview ESLint configuration for Designer project
 * @author @darianrosebrook
 *
 * This configuration uses ESLint 9+ flat config format.
 * Different rules apply to different packages based on their environment.
 */

// @ts-check
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

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
      "apps/tools/caws/**", // CAWS tools have their own rules
      "docs/**", // Documentation and experiments
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/tests/**",
      "**/*.config.ts",
      "**/*.config.js",
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
    ],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
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

  // Node.js library packages (canvas-schema, canvas-engine)
  {
    files: ["packages/canvas-schema/**/*.ts", "packages/canvas-engine/**/*.ts"],
    rules: {
      // Stricter rules for core libraries
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": "error", // No console logs in libraries
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
