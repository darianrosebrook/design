const fs = require("fs");
const path = require("path");

// Component classification by layer
const COMPONENT_LAYERS = {
  // Primitives
  button: "primitives",
  input: "primitives",
  checkbox: "primitives",
  switch: "primitives",
  slider: "primitives",
  progress: "primitives",
  skeleton: "primitives",
  spinner: "primitives",
  separator: "primitives",
  badge: "primitives",
  label: "primitives",
  kbd: "primitives",
  avatar: "primitives",
  textarea: "primitives",
  select: "primitives",
  toggle: "primitives",
  "toggle-group": "primitives",
  breadcrumb: "primitives",
  calendar: "primitives",
  "hover-card": "primitives",
  popover: "primitives",
  tooltip: "primitives",
  alert: "primitives",
  table: "primitives",
  "navigation-menu": "primitives",
  menubar: "primitives",
  command: "primitives",
  dialog: "primitives",
  drawer: "primitives",
  sheet: "primitives",
  "alert-dialog": "primitives",
  "dropdown-menu": "primitives",
  "context-menu": "primitives",
  resizable: "primitives",
  sidebar: "primitives",
  sonner: "primitives",
  toast: "primitives",
  toaster: "primitives",
  carousel: "primitives",
  chart: "primitives",
  pagination: "primitives",
  "theme-provider": "primitives",
  "scroll-area": "primitives",
  tabs: "primitives",
  collapsible: "primitives",
  accordion: "primitives",
  "aspect-ratio": "primitives",
  field: "primitives",
  item: "primitives",
  "input-group": "primitives",
  "input-otp": "primitives",
  "radio-group": "primitives",
  form: "primitives",
  empty: "primitives",

  // Compounds
  "button-group": "compounds",
  card: "compounds",
  "file-metadata": "compounds",

  // Composers
  "action-bar": "composers",
  "canvas-area": "composers",
  "component-library": "composers",
  "component-renderer": "composers",
  "layers-list": "composers",
  "alignment-grid": "composers",
  "box-model-editor": "composers",
  "canvas-background-controls": "composers",
  "collapsible-panel": "composers",
  "design-system-overlay": "composers",
  "file-details-panel": "composers",
  "keyboard-shortcuts-modal": "composers",
  "layer-item": "composers",
  "layout-section": "composers",
  "library-section": "composers",
  "panel-container": "composers",
  "properties-panel-collapsed": "composers",
  "properties-panel": "composers",
  "resizable-panel": "composers",
  "top-navigation": "composers",
  "zoom-controls": "composers",
};

// Function to fix relative imports in a file
function fixRelativeImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let hasChanges = false;

  // Fix relative imports that reference moved components
  Object.entries(COMPONENT_LAYERS).forEach(([component, layer]) => {
    // Match relative imports like './component-name' or '../component-name'
    const relativeImportRegex = new RegExp(
      `from ['"](\.\.?/)+${component}['"]`,
      "g"
    );
    const absoluteImport = `from '@/ui/${layer}/${component}'`;

    if (relativeImportRegex.test(content)) {
      content = content.replace(relativeImportRegex, absoluteImport);
      hasChanges = true;
    }
  });

  // Write back if changes were made
  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(
      `Fixed relative imports in: ${path.relative(process.cwd(), filePath)}`
    );
  }
}

// Main execution
function main() {
  const uiDir = path.join(__dirname, "..", "ui");

  // Find all component files in the new structure
  const componentFiles = [];
  function findComponentFiles(dir) {
    const items = fs.readdirSync(dir);
    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Check if this is a component directory (has index.tsx)
        const indexPath = path.join(fullPath, "index.tsx");
        if (fs.existsSync(indexPath)) {
          componentFiles.push(
            path.join(fullPath, path.basename(fullPath) + ".tsx")
          );
        }
        findComponentFiles(fullPath);
      }
    });
  }

  findComponentFiles(uiDir);

  console.log(`Found ${componentFiles.length} component files to check`);

  let fixedCount = 0;
  componentFiles.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8");
      // Check if file contains relative imports to moved components
      const hasRelativeImports = Object.keys(COMPONENT_LAYERS).some(
        (component) => {
          return (
            content.includes(`'./${component}'`) ||
            content.includes(`"./${component}"`) ||
            content.includes(`'../${component}'`) ||
            content.includes(`"../${component}"`)
          );
        }
      );

      if (hasRelativeImports) {
        fixRelativeImportsInFile(filePath);
        fixedCount++;
      }
    }
  });

  console.log(`Fixed relative imports in ${fixedCount} files`);
}

main();
