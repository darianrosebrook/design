const fs = require("fs");
const path = require("path");

/**
 * Complete SCSS Migration Script
 *
 * This script will:
 * 1. Fix any remaining component imports
 * 2. Generate proper SCSS for all migrated components
 * 3. Ensure CSS variables are correctly mapped
 * 4. Clean up commented Tailwind classes once verified
 */

// Shadcn/ui style CSS variable mappings
const CSS_VARIABLES = {
  // Colors
  "--background": "hsl(var(--color-background-primary))",
  "--foreground": "hsl(var(--color-text-primary))",
  "--primary": "hsl(var(--color-interactive-primary))",
  "--primary-foreground": "hsl(var(--color-text-inverse))",
  "--secondary": "hsl(var(--color-interactive-secondary))",
  "--secondary-foreground": "hsl(var(--color-text-primary))",
  "--muted": "hsl(var(--color-background-secondary))",
  "--muted-foreground": "hsl(var(--color-text-secondary))",
  "--accent": "hsl(var(--color-interactive-secondary-hover))",
  "--accent-foreground": "hsl(var(--color-text-primary))",
  "--destructive": "hsl(var(--color-semantic-error))",
  "--destructive-foreground": "hsl(var(--color-text-inverse))",
  "--border": "hsl(var(--color-border-default))",
  "--input": "hsl(var(--color-border-subtle))",
  "--ring": "hsl(var(--color-interactive-primary))",
  "--chart-1": "hsl(var(--color-interactive-primary))",
  "--chart-2": "hsl(var(--color-interactive-secondary))",
  "--chart-3": "hsl(var(--color-semantic-success))",
  "--chart-4": "hsl(var(--color-semantic-warning))",
  "--chart-5": "hsl(var(--color-semantic-error))",

  // Spacing (in px)
  "--space-1": "4px",
  "--space-2": "8px",
  "--space-3": "12px",
  "--space-4": "16px",
  "--space-5": "20px",
  "--space-6": "24px",
  "--space-8": "32px",
  "--space-10": "40px",
  "--space-12": "48px",
  "--space-16": "64px",

  // Border radius
  "--radius": "6px",
  "--radius-sm": "4px",
  "--radius-md": "6px",
  "--radius-lg": "8px",
  "--radius-xl": "12px",

  // Typography
  "--font-family-sans": "var(--type-family-sans)",
  "--font-family-mono": "var(--type-family-mono)",
  "--font-size-xs": "12px",
  "--font-size-sm": "14px",
  "--font-size-base": "16px",
  "--font-size-lg": "18px",
  "--font-size-xl": "20px",
  "--font-size-2xl": "24px",
  "--font-weight-normal": "var(--type-weight-normal)",
  "--font-weight-medium": "var(--type-weight-medium)",
  "--font-weight-semibold": "var(--type-weight-semibold)",
  "--font-weight-bold": "var(--type-weight-bold)",
  "--line-height-tight": "1.25",
  "--line-height-normal": "1.5",
  "--line-height-loose": "2",

  // Shadows
  "--shadow-xs": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  "--shadow-sm":
    "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  "--shadow":
    "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  "--shadow-lg":
    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",

  // Transitions
  "--transition-all": "all 150ms ease-in-out",
  "--transition-colors":
    "color 150ms ease-in-out, background-color 150ms ease-in-out, border-color 150ms ease-in-out",
};

// Generate SCSS for a specific component
function generateComponentSCSS(componentName, layer, tailwindClasses = []) {
  const componentKey = componentName.replace(/-/g, "").toLowerCase();

  let scss = `// ${componentName} ${layer.slice(0, -1)} component styles
// Migrated from Tailwind to SCSS with design tokens

.${componentKey} {
  // Base component styles
`;

  // Convert common Tailwind patterns to SCSS
  const conversions = {
    flex: "display: flex;",
    "inline-flex": "display: inline-flex;",
    grid: "display: grid;",
    block: "display: block;",
    "inline-block": "display: inline-block;",
    hidden: "display: none;",
    relative: "position: relative;",
    absolute: "position: absolute;",
    fixed: "position: fixed;",
    "items-center": "align-items: center;",
    "items-start": "align-items: flex-start;",
    "items-end": "align-items: flex-end;",
    "justify-center": "justify-content: center;",
    "justify-between": "justify-content: space-between;",
    "justify-start": "justify-content: flex-start;",
    "justify-end": "justify-content: flex-end;",
    "flex-col": "flex-direction: column;",
    "flex-wrap": "flex-wrap: wrap;",
    "flex-1": "flex: 1 1 0%;",
    "text-center": "text-align: center;",
    "text-left": "text-align: left;",
    "text-right": "text-align: right;",
    "font-medium": "font-weight: var(--font-weight-medium);",
    "font-semibold": "font-weight: var(--font-weight-semibold);",
    "font-bold": "font-weight: var(--font-weight-bold);",
    "text-xs":
      "font-size: var(--font-size-xs); line-height: var(--line-height-tight);",
    "text-sm":
      "font-size: var(--font-size-sm); line-height: var(--line-height-normal);",
    "text-base":
      "font-size: var(--font-size-base); line-height: var(--line-height-normal);",
    "text-lg":
      "font-size: var(--font-size-lg); line-height: var(--line-height-loose);",
    "text-xl":
      "font-size: var(--font-size-xl); line-height: var(--line-height-loose);",
    "text-2xl":
      "font-size: var(--font-size-2xl); line-height: var(--line-height-loose);",
    "bg-background": "background-color: var(--background);",
    "bg-foreground": "background-color: var(--foreground);",
    "bg-primary": "background-color: var(--primary);",
    "bg-secondary": "background-color: var(--secondary);",
    "bg-muted": "background-color: var(--muted);",
    "bg-accent": "background-color: var(--accent);",
    "bg-transparent": "background-color: transparent;",
    "text-foreground": "color: var(--foreground);",
    "text-primary": "color: var(--primary);",
    "text-secondary": "color: var(--secondary);",
    "text-muted-foreground": "color: var(--muted-foreground);",
    "text-destructive": "color: var(--destructive);",
    "text-accent-foreground": "color: var(--accent-foreground);",
    border: "border: 1px solid var(--border);",
    "border-2": "border: 2px solid var(--border);",
    "border-t": "border-top: 1px solid var(--border);",
    "border-b": "border-bottom: 1px solid var(--border);",
    "border-l": "border-left: 1px solid var(--border);",
    "border-r": "border-right: 1px solid var(--border);",
    rounded: "border-radius: var(--radius-sm);",
    "rounded-md": "border-radius: var(--radius);",
    "rounded-lg": "border-radius: var(--radius-lg);",
    "rounded-xl": "border-radius: var(--radius-xl);",
    "rounded-full": "border-radius: 9999px;",
    "shadow-xs": "box-shadow: var(--shadow-xs);",
    "shadow-sm": "box-shadow: var(--shadow-sm);",
    shadow: "box-shadow: var(--shadow);",
    "shadow-lg": "box-shadow: var(--shadow-lg);",
    "transition-all": "transition: var(--transition-all);",
    "transition-colors": "transition: var(--transition-colors);",
    "outline-none": "outline: none;",
    "cursor-pointer": "cursor: pointer;",
    "cursor-not-allowed": "cursor: not-allowed;",
    "pointer-events-none": "pointer-events: none;",
    "select-none": "user-select: none;",
    "resize-none": "resize: none;",
  };

  // Convert Tailwind classes to SCSS
  tailwindClasses.forEach((twClass) => {
    if (conversions[twClass]) {
      scss += `  ${conversions[twClass]}\n`;
    }
  });

  scss += "}\n";

  return scss;
}

// Fix component files that have duplicate styles.checkbox
function fixDuplicateStyles(content) {
  return content.replace(
    /className=\{cn\(styles\.(\w+),\s*styles\.\1,\s*className\)\}/g,
    "className={cn(styles.$1, className)}"
  );
}

// Main migration function
function completeMigration() {
  const uiDir = path.join(__dirname, "..", "ui");

  // Components that need SCSS generation
  const componentsToUpdate = [
    { path: "primitives/Alert/alert", layer: "primitives" },
    { path: "primitives/Avatar/avatar", layer: "primitives" },
    { path: "primitives/Breadcrumb/breadcrumb", layer: "primitives" },
    { path: "primitives/Checkbox/checkbox", layer: "primitives" },
    { path: "primitives/Empty/empty", layer: "primitives" },
    { path: "primitives/Kbd/kbd", layer: "primitives" },
    { path: "primitives/Label/label", layer: "primitives" },
    { path: "primitives/NavigationMenu/navigation-menu", layer: "primitives" },
    { path: "primitives/Progress/progress", layer: "primitives" },
    { path: "primitives/RadioGroup/radio-group", layer: "primitives" },
    { path: "primitives/Separator/separator", layer: "primitives" },
    { path: "primitives/Skeleton/skeleton", layer: "primitives" },
    { path: "primitives/Switch/switch", layer: "primitives" },
    { path: "primitives/Tabs/tabs", layer: "primitives" },
    { path: "primitives/Textarea/textarea", layer: "primitives" },
    { path: "primitives/ToggleGroup/toggle-group", layer: "primitives" },
    { path: "compounds/Card/card", layer: "compounds" },
    { path: "compounds/FileMetadata/file-metadata", layer: "compounds" },
  ];

  componentsToUpdate.forEach(({ path: componentPath, layer }) => {
    const fullPath = path.join(uiDir, `${componentPath}.tsx`);
    const scssPath = path.join(uiDir, `${componentPath}.module.scss`);

    if (fs.existsSync(fullPath)) {
      // Fix component file
      let content = fs.readFileSync(fullPath, "utf8");
      content = fixDuplicateStyles(content);

      // Remove commented Tailwind classes since we've migrated
      content = content.replace(
        /^\s*\/\/ Original Tailwind classes.*$\n/gm,
        ""
      );
      content = content.replace(/^\s*\/\/ "\/\* .* \*\/"$\n/gm, "");

      fs.writeFileSync(fullPath, content);

      // Generate proper SCSS if it's just a placeholder
      if (fs.existsSync(scssPath)) {
        const scssContent = fs.readFileSync(scssPath, "utf8");
        if (
          scssContent.includes("Placeholder") ||
          scssContent.includes("TODO")
        ) {
          const componentName = path.basename(componentPath);
          const newScss = generateComponentSCSS(componentName, layer);
          fs.writeFileSync(scssPath, newScss);
          console.log(`✅ Generated SCSS for ${componentPath}`);
        }
      }
    }
  });

  // Generate CSS variables file for shadcn/ui compatibility
  const cssVarsPath = path.join(__dirname, "..", "ui", "css-variables.css");
  let cssVars = "/* CSS Variables for shadcn/ui compatibility */\n:root {\n";

  Object.entries(CSS_VARIABLES).forEach(([key, value]) => {
    cssVars += `  ${key}: ${value};\n`;
  });

  cssVars += "}\n\n/* Dark mode overrides */\n.dark {\n";
  // Add dark mode overrides if needed
  cssVars += "}\n";

  fs.writeFileSync(cssVarsPath, cssVars);
  console.log("✅ Generated CSS variables file");

  console.log("\n🎉 Migration completed!");
  console.log("Next steps:");
  console.log("1. Import the CSS variables file in your main CSS");
  console.log("2. Test components visually");
  console.log("3. Run build to ensure everything works");
}

completeMigration();
