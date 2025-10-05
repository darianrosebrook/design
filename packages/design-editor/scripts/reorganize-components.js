const fs = require("fs");
const path = require("path");

// Component classification by layer
const LAYER_CLASSIFICATION = {
  // Primitives - irreducible building blocks
  primitives: [
    "button",
    "input",
    "checkbox",
    "switch",
    "slider",
    "progress",
    "skeleton",
    "spinner",
    "separator",
    "badge",
    "label",
    "kbd",
    "avatar",
    "textarea",
    "select",
    "toggle",
    "toggle-group",
    "breadcrumb",
    "calendar",
    "hover-card",
    "popover",
    "tooltip",
    "alert",
    "table",
    "navigation-menu",
    "menubar",
    "command",
    "dialog",
    "drawer",
    "sheet",
    "alert-dialog",
    "dropdown-menu",
    "context-menu",
    "resizable",
    "sidebar",
    "sonner",
    "toast",
    "toaster",
    "carousel",
    "chart",
    "pagination",
    "theme-provider",
    "scroll-area",
    "tabs",
    "collapsible",
    "accordion",
    "aspect-ratio",
    "field",
    "item",
    "input-group",
    "input-otp",
    "radio-group",
    "form",
    "empty",
  ],

  // Compounds - bundle primitives
  compounds: ["button-group", "card", "file-metadata"],

  // Composers - orchestrate state/interaction
  composers: [
    "action-bar",
    "canvas-area",
    "component-library",
    "component-renderer",
    "layers-list",
    "alignment-grid",
    "box-model-editor",
    "canvas-background-controls",
    "collapsible-panel",
    "design-system-overlay",
    "file-details-panel",
    "keyboard-shortcuts-modal",
    "layer-item",
    "layout-section",
    "library-section",
    "panel-container",
    "properties-panel-collapsed",
    "properties-panel",
    "resizable-panel",
    "top-navigation",
    "zoom-controls",
    "pagination",
    "form",
  ],

  // Assemblies - app-specific flows (most remaining are actually composers)
  assemblies: [],
};

// Function to create component files
function createComponentFiles(componentName, layer) {
  const componentDir = path.join(__dirname, "..", "ui", layer, componentName);

  // Create directory
  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
  }

  // Read original component file
  const originalFilePath = path.join(
    __dirname,
    "..",
    "ui",
    `${componentName}.tsx`
  );
  let originalContent = "";

  try {
    originalContent = fs.readFileSync(originalFilePath, "utf8");
  } catch (error) {
    console.log(`Original file not found: ${originalFilePath}`);
    return;
  }

  // Create component .tsx file
  const componentTsxPath = path.join(componentDir, `${componentName}.tsx`);
  const componentContent = originalContent
    .replace(
      /import { cn } from '@\/lib\/utils'/g,
      "import { cn } from '@/lib/utils'\nimport styles from './${componentName}.module.scss'"
    )
    .replace(/export \{/g, "// Component implementation\n\nexport {");

  fs.writeFileSync(componentTsxPath, componentContent);

  // Create SCSS module file
  const scssPath = path.join(componentDir, `${componentName}.module.scss`);
  const scssContent = `// ${componentName} ${layer.slice(
    0,
    -1
  )} component styles
// TODO: Migrate from Tailwind classes to SCSS variables and mixins

.${componentName.toLowerCase()} {
  // Placeholder for future SCSS implementation
  // Will contain ${componentName.toLowerCase()}-specific styles when migrating from Tailwind
}
`;
  fs.writeFileSync(scssPath, scssContent);

  // Create tokens file
  const tokensPath = path.join(componentDir, `${componentName}.tokens.json`);
  const tokensContent = JSON.stringify(
    {
      [componentName]: {
        // Placeholder for design tokens
        // Will contain specific design tokens for ${componentName}
      },
    },
    null,
    2
  );
  fs.writeFileSync(tokensPath, tokensContent);

  // Create index file
  const indexPath = path.join(componentDir, "index.tsx");
  const indexContent = `export * from './${componentName}'`;
  fs.writeFileSync(indexPath, indexContent);

  console.log(`Created ${layer}/${componentName}`);
}

// Function to get component name from file path
function getComponentName(filePath) {
  return path.basename(filePath, ".tsx");
}

// Main execution
function main() {
  const uiDir = path.join(__dirname, "..", "ui");

  // Get all .tsx files
  const tsxFiles = fs
    .readdirSync(uiDir)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => getComponentName(file));

  console.log(`Found ${tsxFiles.length} components to organize`);

  // Process each component
  tsxFiles.forEach((componentName) => {
    // Determine layer
    let layer = "primitives"; // default

    for (const [layerName, components] of Object.entries(
      LAYER_CLASSIFICATION
    )) {
      if (
        components.some(
          (comp) =>
            comp === componentName || comp === componentName.replace(/-/g, "")
        )
      ) {
        layer = layerName;
        break;
      }
    }

    // Skip if already organized
    const componentDir = path.join(uiDir, layer, componentName);
    if (fs.existsSync(componentDir)) {
      console.log(`Skipping ${componentName} - already exists in ${layer}`);
      return;
    }

    createComponentFiles(componentName, layer);
  });

  console.log("Component reorganization complete!");
}

main();
