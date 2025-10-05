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

// Function to update imports in a file
function updateImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let hasChanges = false;

  // Update import statements
  Object.entries(COMPONENT_LAYERS).forEach(([component, layer]) => {
    const regex = new RegExp(`from ['"]@/ui/${component}['"]`, "g");
    const replacement = `from '@/ui/${layer}/${component}'`;

    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      hasChanges = true;
    }
  });

  // Write back if changes were made
  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(
      `Updated imports in: ${path.relative(process.cwd(), filePath)}`
    );
  }
}

// Main execution
function main() {
  const projectRoot = path.join(__dirname, "..");

  // Find all TypeScript files
  const files = [];
  function findFiles(dir) {
    const items = fs.readdirSync(dir);
    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (
        stat.isDirectory() &&
        !item.startsWith(".") &&
        item !== "node_modules"
      ) {
        findFiles(fullPath);
      } else if (
        stat.isFile() &&
        (item.endsWith(".ts") || item.endsWith(".tsx"))
      ) {
        files.push(fullPath);
      }
    });
  }

  findFiles(projectRoot);

  console.log(`Found ${files.length} TypeScript files to check`);

  let updatedCount = 0;
  files.forEach((filePath) => {
    const content = fs.readFileSync(filePath, "utf8");
    if (content.includes("@/ui/")) {
      updateImportsInFile(filePath);
      updatedCount++;
    }
  });

  console.log(`Updated imports in ${updatedCount} files`);
}

main();
