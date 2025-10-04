# VS Code Extension - Development Workflow

## 🚀 Quick Start

### For New Development
```bash
npm run dev
```
This runs comprehensive checks (TypeScript + ESLint) and builds the webview.

### For Quick Iteration (Skip Checks)
```bash
npm run dev:quick
```
Only builds - use when you're confident in your changes.

## 🔧 Development Commands

### Type Checking
- `npm run typecheck` - Check main extension TypeScript
- `npm run typecheck:webviews` - Check webview TypeScript (catches runtime errors!)
- `npm run check` - Run all checks (types + linting)

### Linting
- `npm run lint` - Lint main extension code
- `npm run lint:webviews` - Lint webview code

### Building
- `npm run build` - Full build (includes pre-checks)
- `npm run build:webview` - Build only webviews
- `npm run watch` - Watch mode for continuous building

### Testing
- `npm run test` - Run all tests
- `npm run test:watch` - Watch mode for tests

## 🎯 Development Workflow

### 1. **Catch Errors Early** (Recommended)
```bash
npm run dev
```
- ✅ TypeScript checking catches type errors
- ✅ ESLint catches code quality issues
- ✅ Prevents runtime errors in VS Code
- ⏱️ Takes ~5-10 seconds but saves debugging time

### 2. **Quick Iteration** (When Confident)
```bash
npm run dev:quick
```
- ⚡ Fast builds when you know your changes are correct
- ❌ May miss type errors or linting issues

### 3. **Manual Checks** (For Debugging)
```bash
npm run check        # All checks without building
npm run typecheck:webviews  # Check specific webview issues
npm run lint:webviews       # Check specific linting issues
```

## 🛠️ Troubleshooting

### Common Issues

**TypeScript Errors in Webviews:**
- Missing imports or type definitions
- Incorrect prop types passed to components
- Variable shadowing (like `document` prop shadowing global `document`)

**Runtime Errors:**
- Usually caught by `typecheck:webviews`
- Check for missing null checks on DOM elements
- Verify event listener cleanup

**Build Errors:**
- Run `npm run check` first to catch issues early
- Check import paths and module resolution

### Performance Tips

1. **Use `npm run dev`** for new features or complex changes
2. **Use `npm run dev:quick`** for small, safe changes
3. **Run `npm run check`** when debugging specific issues
4. **Use `npm run test:watch`** for test-driven development

## 📋 What Gets Checked

### TypeScript (Main Code)
- ✅ Type safety for extension logic
- ✅ VS Code API usage
- ✅ Import/export consistency

### TypeScript (Webviews)
- ✅ React component prop types
- ✅ DOM API usage (catches `document` shadowing!)
- ✅ Event handler types
- ✅ State management types

### ESLint
- ✅ Code style consistency
- ✅ Potential bugs (unused variables, etc.)
- ✅ Best practices

## 🎉 Benefits

- **Faster Development**: Catch 80% of bugs before VS Code loads
- **Better Code Quality**: Consistent types and linting
- **Easier Debugging**: Clear error messages with file locations
- **Team Consistency**: Shared development standards

## 🚨 When to Skip Checks

Only skip checks (`npm run dev:quick`) when:
- Making very small, safe changes
- You're confident in the code quality
- You're in a time-sensitive debugging session

**Pro Tip**: Even small changes can introduce type errors that are hard to debug later!
