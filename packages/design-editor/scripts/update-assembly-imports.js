const fs = require("fs");
const path = require("path");

// Components that moved from composers to assemblies
const MOVED_COMPONENTS = {
  "action-bar": "assemblies",
  ActionBar: "assemblies",
  "canvas-area": "assemblies",
  "design-system-overlay": "assemblies",
  "file-details-panel": "assemblies",
  "layers-list": "assemblies",
  "layer-item": "assemblies",
  "library-section": "assemblies",
  "panel-container": "assemblies",
  "properties-panel": "assemblies",
  "properties-panel-collapsed": "assemblies",
  "top-navigation": "assemblies",
};

// Function to update imports in a file
function updateImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let hasChanges = false;

  // Update import statements for moved components
  Object.entries(MOVED_COMPONENTS).forEach(([component, newLayer]) => {
    const regex = new RegExp(`from ['"]@/ui/composers/${component}['"]`, "g");
    const replacement = `from '@/ui/${newLayer}/${component}'`;

    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      hasChanges = true;
    }
  });

  // Write back if changes were made
  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(
      `Updated assembly imports in: ${path.relative(process.cwd(), filePath)}`
    );
  }
}

// Main execution
function main() {
  const projectRoot = path.join(__dirname, "..");

  // Files that need updating
  const filesToUpdate = [
    path.join(
      projectRoot,
      "ui",
      "assemblies",
      "file-details-panel",
      "file-details-panel.tsx"
    ),
    path.join(
      projectRoot,
      "ui",
      "assemblies",
      "layers-list",
      "layers-list.tsx"
    ),
    path.join(
      projectRoot,
      "ui",
      "assemblies",
      "panel-container",
      "panel-container.tsx"
    ),
    path.join(projectRoot, "app", "page.tsx"),
  ];

  filesToUpdate.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      updateImportsInFile(filePath);
    }
  });

  console.log("Assembly import updates complete!");
}

main();
