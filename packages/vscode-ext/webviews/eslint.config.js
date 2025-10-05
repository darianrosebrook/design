// ESLint configuration for webviews
// This extends the root monorepo ESLint config
import baseConfig from "../../../eslint.config.js";

export default [
  ...baseConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Webview-specific overrides can go here
    },
  },
];
