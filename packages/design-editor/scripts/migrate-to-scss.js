const fs = require("fs");
const path = require("path");

// Components that need SCSS migration
const COMPONENTS_TO_MIGRATE = [
  // Primitives
  "primitives/Alert/alert",
  "primitives/Avatar/avatar",
  "primitives/Breadcrumb/breadcrumb",
  "primitives/Checkbox/checkbox",
  "primitives/Empty/empty",
  "primitives/Kbd/kbd",
  "primitives/Label/label",
  "primitives/NavigationMenu/navigation-menu",
  "primitives/Progress/progress",
  "primitives/RadioGroup/radio-group",
  "primitives/Separator/separator",
  "primitives/Skeleton/skeleton",
  "primitives/Switch/switch",
  "primitives/Tabs/tabs",
  "primitives/Textarea/textarea",
  "primitives/ToggleGroup/toggle-group",

  // Compounds
  "compounds/ButtonGroup/button-group",
  "compounds/Card/card",
  "compounds/FileMetadata/file-metadata",
];

// Utility function to convert Tailwind classes to SCSS
function tailwindToScss(tailwindClass) {
  const conversions = {
    // Spacing
    "gap-1": "gap: 4px;",
    "gap-2": "gap: 8px;",
    "gap-3": "gap: 12px;",
    "gap-4": "gap: 16px;",
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
    "m-1": "margin: -4px;",
    "m-2": "margin: -8px;",
    "mx-1": "margin-left: -4px; margin-right: -4px;",
    "my-1": "margin-top: -4px; margin-bottom: -4px;",

    // Sizing
    "w-4": "width: 16px;",
    "w-8": "width: 32px;",
    "w-12": "width: 48px;",
    "w-16": "width: 64px;",
    "w-full": "width: 100%;",
    "h-4": "height: 16px;",
    "h-8": "height: 32px;",
    "h-9": "height: 36px;",
    "h-10": "height: 40px;",
    "h-12": "height: 48px;",
    "h-full": "height: 100%;",
    "size-4": "width: 16px; height: 16px;",
    "size-8": "width: 32px; height: 32px;",
    "size-9": "width: 36px; height: 36px;",
    "size-10": "width: 40px; height: 40px;",
    "min-w-0": "min-width: 0;",
    "max-w-xs": "max-width: 20rem;",
    "max-w-sm": "max-width: 24rem;",
    "max-w-md": "max-width: 28rem;",
    "max-w-lg": "max-width: 32rem;",
    "max-w-xl": "max-width: 36rem;",
    "max-w-2xl": "max-width: 42rem;",

    // Border radius
    rounded: "border-radius: 4px;",
    "rounded-md": "border-radius: 6px;",
    "rounded-lg": "border-radius: 8px;",
    "rounded-xl": "border-radius: 12px;",
    "rounded-2xl": "border-radius: 16px;",
    "rounded-full": "border-radius: 9999px;",

    // Borders
    border: "border: 1px solid hsl(var(--border));",
    "border-2": "border: 2px solid hsl(var(--border));",
    "border-t": "border-top: 1px solid hsl(var(--border));",
    "border-b": "border-bottom: 1px solid hsl(var(--border));",
    "border-l": "border-left: 1px solid hsl(var(--border));",
    "border-r": "border-right: 1px solid hsl(var(--border));",

    // Colors
    "bg-background": "background-color: hsl(var(--background));",
    "bg-foreground": "color: hsl(var(--foreground));",
    "bg-primary": "background-color: hsl(var(--primary));",
    "bg-secondary": "background-color: hsl(var(--secondary));",
    "bg-destructive": "background-color: hsl(var(--destructive));",
    "bg-muted": "background-color: hsl(var(--muted));",
    "bg-accent": "background-color: hsl(var(--accent));",
    "bg-transparent": "background-color: transparent;",
    "text-foreground": "color: hsl(var(--foreground));",
    "text-primary": "color: hsl(var(--primary));",
    "text-secondary": "color: hsl(var(--secondary));",
    "text-muted-foreground": "color: hsl(var(--muted-foreground));",
    "text-destructive": "color: hsl(var(--destructive));",
    "text-accent-foreground": "color: hsl(var(--accent-foreground));",

    // Typography
    "text-xs": "font-size: 12px; line-height: 1rem;",
    "text-sm": "font-size: 14px; line-height: 1.25rem;",
    "text-base": "font-size: 16px; line-height: 1.5rem;",
    "text-lg": "font-size: 18px; line-height: 1.75rem;",
    "text-xl": "font-size: 20px; line-height: 1.75rem;",
    "text-2xl": "font-size: 24px; line-height: 2rem;",
    "font-medium": "font-weight: 500;",
    "font-semibold": "font-weight: 600;",
    "font-bold": "font-weight: 700;",

    // Layout
    flex: "display: flex;",
    "inline-flex": "display: inline-flex;",
    block: "display: block;",
    "inline-block": "display: inline-block;",
    grid: "display: grid;",
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

    // Spacing
    "space-x-1": "& > * + * { margin-left: 4px; }",
    "space-x-2": "& > * + * { margin-left: 8px; }",
    "space-y-1": "& > * + * { margin-top: 4px; }",
    "space-y-2": "& > * + * { margin-top: 8px; }",
    "space-y-4": "& > * + * { margin-top: 16px; }",

    // Effects
    "shadow-xs": "box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);",
    "shadow-sm":
      "box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);",
    shadow:
      "box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);",
    "shadow-lg":
      "box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);",

    // Interactions
    "cursor-pointer": "cursor: pointer;",
    "cursor-not-allowed": "cursor: not-allowed;",
    "pointer-events-none": "pointer-events: none;",
    "transition-all": "transition: all 150ms ease-in-out;",
    "transition-colors":
      "transition: color 150ms ease-in-out, background-color 150ms ease-in-out, border-color 150ms ease-in-out;",
    "outline-none": "outline: none;",
    "resize-none": "resize: none;",
    "select-none": "user-select: none;",

    // States
    "hover:opacity-50": "&:hover { opacity: 0.5; }",
    "hover:bg-accent": "&:hover { background-color: hsl(var(--accent)); }",
    "focus:outline-none": "&:focus { outline: none; }",
    "focus:ring-2": "&:focus { box-shadow: 0 0 0 2px hsl(var(--ring)); }",
    "focus:border-ring": "&:focus { border-color: hsl(var(--ring)); }",
    "disabled:opacity-50": "&:disabled { opacity: 0.5; }",
    "disabled:cursor-not-allowed": "&:disabled { cursor: not-allowed; }",
  };

  return conversions[tailwindClass] || `/* TODO: Convert ${tailwindClass} */`;
}

// Function to migrate a component
function migrateComponent(componentPath) {
  const componentDir = path.dirname(componentPath);
  const componentName = path.basename(componentPath, ".tsx");
  const scssPath = path.join(componentDir, `${componentName}.module.scss`);

  console.log(`Migrating ${componentPath}...`);

  // Read the component file
  let content = fs.readFileSync(componentPath, "utf8");

  // Add SCSS import if not present
  if (!content.includes("import styles from")) {
    // Find the import section
    const importMatch = content.match(/(import .* from ['"'][^'"]*['"];?\n)+/);
    if (importMatch) {
      const insertPoint = importMatch.index + importMatch[0].length;
      content =
        content.slice(0, insertPoint) +
        `import styles from "./${componentName}.module.scss";\n` +
        content.slice(insertPoint);
    }
  }

  // Update className usage to include styles
  content = content.replace(
    /className=\{cn\(([^}]+)\)\}/g,
    (match, classList) => {
      return `className={cn(styles.${componentName.replace(
        /-/g,
        ""
      )}, ${classList})}`;
    }
  );

  // Comment out Tailwind classes in string literals
  content = content.replace(
    /(['"`])([^'"`]*?)(\1)/g,
    (match, quote, classString) => {
      // Only process if it looks like Tailwind classes
      if (
        classString.includes("flex") ||
        classString.includes("bg-") ||
        classString.includes("text-") ||
        classString.includes("p-") ||
        classString.includes("m-") ||
        classString.includes("border") ||
        classString.includes("rounded") ||
        classString.includes("shadow")
      ) {
        const commented = classString
          .split(" ")
          .map((cls) => `/* ${cls} */`)
          .join(" ");
        return `${quote}${commented}${quote}`;
      }
      return match;
    }
  );

  // Write back the updated component
  fs.writeFileSync(componentPath, content);

  // Generate SCSS content
  let scssContent = `// ${componentName} component styles
// Migrated from Tailwind to SCSS with design tokens

.${componentName.replace(/-/g, "")} {
  // Base component styles
  // TODO: Add converted Tailwind styles here
}
`;

  // If SCSS file doesn't exist or is just placeholder, create proper content
  if (
    !fs.existsSync(scssPath) ||
    fs.readFileSync(scssPath, "utf8").includes("Placeholder")
  ) {
    fs.writeFileSync(scssPath, scssContent);
  }

  console.log(`✅ Migrated ${componentPath}`);
}

// Main migration function
function migrateAllComponents() {
  const uiDir = path.join(__dirname, "..", "ui");

  COMPONENTS_TO_MIGRATE.forEach((componentPath) => {
    const fullPath = path.join(uiDir, `${componentPath}.tsx`);
    if (fs.existsSync(fullPath)) {
      migrateComponent(fullPath);
    } else {
      console.log(`⚠️  Component not found: ${fullPath}`);
    }
  });

  console.log("\n🎉 Migration complete!");
  console.log("Next steps:");
  console.log("1. Review each component's SCSS file");
  console.log("2. Convert commented Tailwind classes to SCSS properties");
  console.log("3. Test components for visual consistency");
  console.log("4. Remove commented Tailwind classes once verified");
}

migrateAllComponents();
