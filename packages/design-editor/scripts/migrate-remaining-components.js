const fs = require("fs");
const path = require("path");

/**
 * Batch migrate remaining composer and assembly components
 * This script handles the systematic migration of the remaining complex components
 */

// Components to migrate
const COMPONENTS_TO_MIGRATE = [
  // Composers
  { path: "composers/LayoutSection/layout-section", layer: "composers" },
  {
    path: "composers/ComponentRenderer/component-renderer",
    layer: "composers",
  },
  { path: "composers/ComponentLibrary/component-library", layer: "composers" },
  { path: "composers/ResizablePanel/resizable-panel", layer: "composers" },
  { path: "composers/ZoomControls/zoom-controls", layer: "composers" },

  // Assemblies (these are more complex, so let's start with simpler ones)
  { path: "assemblies/ActionBar/action-bar", layer: "assemblies" },
  { path: "assemblies/TopNavigation/top-navigation", layer: "assemblies" },
  { path: "assemblies/PropertiesPanel/properties-panel", layer: "assemblies" },
];

// Basic Tailwind to SCSS conversions for common patterns
const TAILWIND_CONVERSIONS = {
  // Layout
  flex: "display: flex;",
  "inline-flex": "display: inline-flex;",
  grid: "display: grid;",
  block: "display: block;",
  "inline-block": "display: inline-block;",
  hidden: "display: none;",
  relative: "position: relative;",
  absolute: "position: absolute;",
  fixed: "position: fixed;",
  sticky: "position: sticky;",

  // Flexbox
  "flex-col": "flex-direction: column;",
  "flex-row": "flex-direction: row;",
  "flex-wrap": "flex-wrap: wrap;",
  "items-center": "align-items: center;",
  "items-start": "align-items: flex-start;",
  "items-end": "align-items: flex-end;",
  "justify-center": "justify-content: center;",
  "justify-between": "justify-content: space-between;",
  "justify-start": "justify-content: flex-start;",
  "justify-end": "justify-content: flex-end;",
  "flex-1": "flex: 1 1 0%;",

  // Spacing
  "gap-1": "gap: 4px;",
  "gap-2": "gap: 8px;",
  "gap-3": "gap: 12px;",
  "gap-4": "gap: 16px;",
  "space-y-1": "& > * + * { margin-top: 4px; }",
  "space-y-2": "& > * + * { margin-top: 8px; }",
  "space-y-3": "& > * + * { margin-top: 12px; }",
  "space-y-4": "& > * + * { margin-top: 16px; }",

  // Padding
  "p-1": "padding: 4px;",
  "p-2": "padding: 8px;",
  "p-3": "padding: 12px;",
  "p-4": "padding: 16px;",
  "px-1": "padding-left: 4px; padding-right: 4px;",
  "px-2": "padding-left: 8px; padding-right: 8px;",
  "px-3": "padding-left: 12px; padding-right: 12px;",
  "px-4": "padding-left: 16px; padding-right: 16px;",
  "py-1": "padding-top: 4px; padding-bottom: 4px;",
  "py-2": "padding-top: 8px; padding-bottom: 8px;",
  "py-3": "padding-top: 12px; padding-bottom: 12px;",
  "py-4": "padding-top: 16px; padding-bottom: 16px;",

  // Margins
  "m-1": "margin: 4px;",
  "m-2": "margin: 8px;",
  "m-3": "margin: 12px;",
  "m-4": "margin: 16px;",
  "mx-1": "margin-left: 4px; margin-right: 4px;",
  "mx-2": "margin-left: 8px; margin-right: 8px;",
  "my-1": "margin-top: 4px; margin-bottom: 4px;",
  "my-2": "margin-top: 8px; margin-bottom: 8px;",

  // Sizing
  "w-4": "width: 16px;",
  "w-6": "width: 24px;",
  "w-8": "width: 32px;",
  "w-12": "width: 48px;",
  "w-full": "width: 100%;",
  "h-4": "height: 16px;",
  "h-6": "height: 24px;",
  "h-8": "height: 32px;",
  "h-12": "height: 48px;",
  "h-full": "height: 100%;",

  // Typography
  "text-xs": "font-size: 12px; line-height: 1.25rem;",
  "text-sm": "font-size: 14px; line-height: 1.25rem;",
  "text-base": "font-size: 16px; line-height: 1.5rem;",
  "text-lg": "font-size: 18px; line-height: 1.75rem;",
  "font-medium": "font-weight: 500;",
  "font-semibold": "font-weight: 600;",
  "font-bold": "font-weight: 700;",

  // Colors
  "text-muted-foreground": "color: hsl(var(--muted-foreground));",
  "text-foreground": "color: hsl(var(--foreground));",
  "bg-background": "background-color: hsl(var(--background));",
  "bg-muted": "background-color: hsl(var(--muted));",
  "bg-card": "background-color: hsl(var(--card));",
  "bg-accent": "background-color: hsl(var(--accent));",

  // Borders
  border: "border: 1px solid hsl(var(--border));",
  "border-t": "border-top: 1px solid hsl(var(--border));",
  "border-b": "border-bottom: 1px solid hsl(var(--border));",
  "border-l": "border-left: 1px solid hsl(var(--border));",
  "border-r": "border-right: 1px solid hsl(var(--border));",
  rounded: "border-radius: 4px;",
  "rounded-md": "border-radius: 6px;",
  "rounded-lg": "border-radius: 8px;",
  "rounded-xl": "border-radius: 12px;",

  // Effects
  "shadow-sm":
    "box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);",
  shadow:
    "box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);",
  "shadow-lg":
    "box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);",

  // Transitions
  "transition-all": "transition: all 150ms ease-in-out;",
  "transition-colors":
    "transition: color 150ms ease-in-out, background-color 150ms ease-in-out, border-color 150ms ease-in-out;",
  "transition-transform": "transition: transform 150ms ease-in-out;",

  // Interactions
  "cursor-pointer": "cursor: pointer;",
  "cursor-not-allowed": "cursor: not-allowed;",
  "pointer-events-none": "pointer-events: none;",
  "select-none": "user-select: none;",
  "outline-none": "outline: none;",
};

// Function to add SCSS import and convert className usage
function migrateComponent(componentPath, layer) {
  const fullPath = path.join(__dirname, "..", "ui", `${componentPath}.tsx`);
  const scssPath = path.join(
    __dirname,
    "..",
    "ui",
    `${componentPath}.module.scss`
  );

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Component not found: ${fullPath}`);
    return;
  }

  console.log(`🔄 Migrating ${componentPath}...`);

  let content = fs.readFileSync(fullPath, "utf8");

  // Add SCSS import if not present
  if (!content.includes("import styles from")) {
    const importMatch = content.match(/(import .* from ['"'][^'"]*['"];?\n)+/);
    if (importMatch) {
      const insertPoint = importMatch.index + importMatch[0].length;
      const componentName = path.basename(componentPath);
      content =
        content.slice(0, insertPoint) +
        `import { cn } from "@/lib/utils";\nimport styles from "./${componentName}.module.scss";\n` +
        content.slice(insertPoint);
    }
  }

  // Comment out Tailwind classes and add SCSS class
  content = content.replace(/className=\{([^}]+)\}/g, (match, classList) => {
    // Extract the className content and add SCSS class
    const scssClass = `styles.${path
      .basename(componentPath)
      .replace(/-/g, "")}`;
    return `className={cn(${scssClass}, ${classList})}`;
  });

  // Comment out direct className strings with Tailwind classes
  content = content.replace(/className="([^"]+)"/g, (match, classes) => {
    if (
      classes.includes("flex") ||
      classes.includes("bg-") ||
      classes.includes("text-") ||
      classes.includes("p-") ||
      classes.includes("m-") ||
      classes.includes("border") ||
      classes.includes("rounded") ||
      classes.includes("shadow") ||
      classes.includes("gap-")
    ) {
      const commented = classes
        .split(" ")
        .map((cls) => `/* ${cls} */`)
        .join(" ");
      return `className="${commented}"`;
    }
    return match;
  });

  // Write back the updated component
  fs.writeFileSync(fullPath, content);

  // Generate basic SCSS file if it doesn't exist or is placeholder
  if (
    !fs.existsSync(scssPath) ||
    fs.readFileSync(scssPath, "utf8").includes("Placeholder")
  ) {
    const componentName = path.basename(componentPath);
    const baseClass = `.${componentName.replace(/-/g, "")}`;

    let scss = `// ${componentName} ${layer.slice(0, -1)} component styles
// Migrated from Tailwind to SCSS with design tokens

${baseClass} {
  // Base component styles
  // TODO: Add converted Tailwind styles here
`;

    // Add some basic conversions for common patterns
    Object.entries(TAILWIND_CONVERSIONS).forEach(([tailwind, scss]) => {
      if (content.includes(`/* ${tailwind} */`)) {
        scss += `  ${scss}\n`;
      }
    });

    scss += "}\n";

    fs.writeFileSync(scssPath, scss);
  }

  console.log(`✅ Migrated ${componentPath}`);
}

// Main migration function
function migrateRemainingComponents() {
  const uiDir = path.join(__dirname, "..", "ui");

  console.log("🚀 Starting batch migration of remaining components...\n");

  COMPONENTS_TO_MIGRATE.forEach(({ path: componentPath, layer }) => {
    migrateComponent(componentPath, layer);
  });

  console.log("\n🎉 Batch migration completed!");
  console.log("Next steps:");
  console.log("1. Review each component's SCSS file");
  console.log("2. Convert commented Tailwind classes to proper SCSS");
  console.log("3. Test components for visual consistency");
  console.log("4. Remove commented classes once verified");
}

migrateRemainingComponents();
