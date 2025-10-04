// ESLint configuration for webviews
// Extends the root monorepo ESLint config
module.exports = {
  root: true,
  extends: ["../../../eslint.config.js"],
  parserOptions: {
    project: "../../../tsconfig.base.json",
  },
};
