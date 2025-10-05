/**
 * Keyboard shortcuts configuration for the design editor
 * Designed for intuitive and efficient design workflows
 */

export interface KeyboardShortcut {
  key: string;
  modifiers?: {
    ctrl?: boolean;
    cmd?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
  action: string;
  description: string;
  category: ShortcutCategory;
  implemented?: boolean; // Whether this shortcut is currently implemented
}

export type ShortcutCategory =
  | "essential"
  | "tools"
  | "view"
  | "zoom"
  | "text"
  | "shape"
  | "selection"
  | "cursor"
  | "edit"
  | "transform"
  | "arrange"
  | "components";

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Essential
  {
    key: "\\",
    modifiers: { ctrl: true },
    action: "toggle-ui",
    description: "Show/Hide UI",
    category: "essential",
  },
  {
    key: "c",
    modifiers: { ctrl: true },
    action: "pick-color",
    description: "Pick Color",
    category: "essential",
  },
  {
    key: "/",
    modifiers: { ctrl: true },
    action: "search-menu",
    description: "Search Menu",
    category: "essential",
  },

  // Tools
  {
    key: "v",
    action: "select-tool",
    description: "Move Tool",
    category: "tools",
    implemented: true,
  },
  {
    key: "f",
    action: "frame-tool",
    description: "Frame Tool",
    category: "tools",
    implemented: true,
  },
  {
    key: "p",
    action: "pen-tool",
    description: "Pen Tool",
    category: "tools",
    implemented: true,
  },
  {
    key: "p",
    modifiers: { shift: true },
    action: "pencil-tool",
    description: "Pencil Tool",
    category: "tools",
    implemented: true,
  },
  {
    key: "t",
    action: "text-tool",
    description: "Text Tool",
    category: "tools",
    implemented: true,
  },
  {
    key: "r",
    action: "rectangle-tool",
    description: "Rectangle Tool",
    category: "tools",
    implemented: true,
  },
  {
    key: "o",
    action: "ellipse-tool",
    description: "Ellipse Tool",
    category: "tools",
    implemented: true,
  },
  {
    key: "l",
    action: "line-tool",
    description: "Line Tool",
    category: "tools",
    implemented: true,
  },
  {
    key: "l",
    modifiers: { shift: true },
    action: "arrow-tool",
    description: "Arrow Tool",
    category: "tools",
    implemented: true,
  },
  {
    key: "c",
    action: "add-comments",
    description: "Add/Show Comments",
    category: "tools",
  },
  {
    key: "s",
    action: "slice-tool",
    description: "Slice Tool",
    category: "tools",
  },

  // View
  {
    key: "r",
    modifiers: { shift: true },
    action: "toggle-rulers",
    description: "Toggle Rulers",
    category: "view",
  },
  {
    key: "y",
    modifiers: { ctrl: true },
    action: "show-outlines",
    description: "Show Outlines",
    category: "view",
  },
  {
    key: "p",
    modifiers: { ctrl: true },
    action: "pixel-preview",
    description: "Pixel Preview",
    category: "view",
  },
  {
    key: "g",
    modifiers: { ctrl: true },
    action: "layout-grids",
    description: "Layout Grids",
    category: "view",
  },
  {
    key: "'",
    modifiers: { ctrl: true },
    action: "pixel-grid",
    description: "Pixel Grid",
    category: "view",
  },
  {
    key: "\\",
    modifiers: { ctrl: true, alt: true },
    action: "show-multiplayer-cursors",
    description: "Show Multiplayer Cursors",
    category: "view",
  },
  {
    key: "1",
    modifiers: { alt: true },
    action: "show-layers",
    description: "Show Layers",
    category: "view",
  },
  {
    key: "2",
    modifiers: { alt: true },
    action: "show-components",
    description: "Show Components",
    category: "view",
  },
  {
    key: "3",
    modifiers: { alt: true },
    action: "show-team-library",
    description: "Show Team Library",
    category: "view",
  },

  // Zoom
  {
    key: "=",
    modifiers: { ctrl: true },
    action: "zoom-in",
    description: "Zoom In",
    category: "zoom",
    implemented: true,
  },
  {
    key: "+",
    modifiers: { ctrl: true },
    action: "zoom-in",
    description: "Zoom In",
    category: "zoom",
    implemented: true,
  },
  {
    key: "-",
    modifiers: { ctrl: true },
    action: "zoom-out",
    description: "Zoom Out",
    category: "zoom",
    implemented: true,
  },
  {
    key: "0",
    modifiers: { shift: true },
    action: "zoom-to-100",
    description: "Zoom to 100%",
    category: "zoom",
    implemented: true,
  },
  {
    key: "1",
    modifiers: { shift: true },
    action: "zoom-to-fit",
    description: "Zoom to Fit",
    category: "zoom",
    implemented: true,
  },
  {
    key: "2",
    modifiers: { shift: true },
    action: "zoom-to-selection",
    description: "Zoom to Selection",
    category: "zoom",
    implemented: true,
  },
  {
    key: "n",
    modifiers: { shift: true },
    action: "zoom-to-previous-frame",
    description: "Zoom to Previous Frame",
    category: "zoom",
  },
  {
    key: "n",
    action: "zoom-to-next-frame",
    description: "Zoom to Next Frame",
    category: "zoom",
  },
  {
    key: "PageUp",
    action: "previous-page",
    description: "Previous Page",
    category: "zoom",
  },
  {
    key: "PageDown",
    action: "next-page",
    description: "Next Page",
    category: "zoom",
  },
  {
    key: "Home",
    action: "find-previous-frame",
    description: "Find Previous Frame",
    category: "zoom",
  },
  {
    key: "End",
    action: "find-next-frame",
    description: "Find Next Frame",
    category: "zoom",
  },

  // Text
  {
    key: "b",
    modifiers: { ctrl: true },
    action: "text-bold",
    description: "Bold",
    category: "text",
    implemented: true,
  },
  {
    key: "i",
    modifiers: { ctrl: true },
    action: "text-italic",
    description: "Italic",
    category: "text",
  },
  {
    key: "u",
    modifiers: { ctrl: true },
    action: "text-underline",
    description: "Underline",
    category: "text",
  },
  {
    key: "v",
    modifiers: { ctrl: true, shift: true },
    action: "paste-match-style",
    description: "Paste and Match Style",
    category: "text",
  },
  {
    key: "l",
    modifiers: { ctrl: true, alt: true },
    action: "text-align-left",
    description: "Text Align Left",
    category: "text",
    implemented: true,
  },
  {
    key: "t",
    modifiers: { ctrl: true, alt: true },
    action: "text-align-center",
    description: "Text Align Center",
    category: "text",
    implemented: true,
  },
  {
    key: "r",
    modifiers: { ctrl: true, alt: true },
    action: "text-align-right",
    description: "Text Align Right",
    category: "text",
    implemented: true,
  },
  {
    key: "j",
    modifiers: { ctrl: true, alt: true },
    action: "text-align-justified",
    description: "Text Align Justified",
    category: "text",
  },

  // Shape
  {
    key: "/",
    modifiers: { alt: true },
    action: "remove-fill",
    description: "Remove Fill",
    category: "shape",
    implemented: true,
  },
  {
    key: "/",
    action: "remove-stroke",
    description: "Remove Stroke",
    category: "shape",
    implemented: true,
  },
  {
    key: "x",
    modifiers: { shift: true },
    action: "swap-fill-stroke",
    description: "Swap Fill and Stroke",
    category: "shape",
  },

  // Selection
  {
    key: "a",
    modifiers: { ctrl: true },
    action: "select-all",
    description: "Select All",
    category: "selection",
    implemented: true,
  },
  {
    key: "a",
    modifiers: { ctrl: true, shift: true },
    action: "select-inverse",
    description: "Select Inverse",
    category: "selection",
  },
  {
    key: "Escape",
    action: "select-none",
    description: "Select None",
    category: "selection",
    implemented: true,
  },
  {
    key: "Delete",
    action: "delete",
    description: "Delete Selection",
    category: "selection",
    implemented: true,
  },
  {
    key: "Backspace",
    action: "delete",
    description: "Delete Selection",
    category: "selection",
    implemented: true,
  },
  {
    key: "Enter",
    action: "select-child",
    description: "Select Child",
    category: "selection",
  },
  {
    key: "Enter",
    modifiers: { shift: true },
    action: "select-parent",
    description: "Select Parent",
    category: "selection",
  },
  {
    key: "Tab",
    action: "select-next-sibling",
    description: "Select Next Sibling",
    category: "selection",
  },
  {
    key: "Tab",
    modifiers: { shift: true },
    action: "select-previous-sibling",
    description: "Select Previous Sibling",
    category: "selection",
  },
  {
    key: "g",
    modifiers: { ctrl: true },
    action: "group-selection",
    description: "Group Selection",
    category: "selection",
  },
  {
    key: "g",
    modifiers: { ctrl: true, shift: true },
    action: "ungroup-selection",
    description: "Ungroup Selection",
    category: "selection",
  },
  {
    key: "g",
    modifiers: { ctrl: true, alt: true },
    action: "frame-selection",
    description: "Frame Selection",
    category: "selection",
  },
  {
    key: "h",
    modifiers: { ctrl: true, shift: true },
    action: "show-hide-selection",
    description: "Show/Hide Selection",
    category: "selection",
    implemented: true,
  },
  {
    key: "l",
    modifiers: { ctrl: true, shift: true },
    action: "lock-unlock-selection",
    description: "Lock/Unlock Selection",
    category: "selection",
    implemented: true,
  },

  // Edit
  {
    key: "c",
    modifiers: { ctrl: true },
    action: "copy",
    description: "Copy",
    category: "edit",
  },
  {
    key: "x",
    modifiers: { ctrl: true },
    action: "cut",
    description: "Cut",
    category: "edit",
  },
  {
    key: "v",
    modifiers: { ctrl: true },
    action: "paste",
    description: "Paste",
    category: "edit",
  },
  {
    key: "v",
    modifiers: { ctrl: true, shift: true },
    action: "paste-over-selection",
    description: "Paste Over Selection",
    category: "edit",
  },
  {
    key: "d",
    modifiers: { ctrl: true },
    action: "duplicate",
    description: "Duplicate Selection in Place",
    category: "edit",
    implemented: true,
  },
  {
    key: "r",
    modifiers: { ctrl: true },
    action: "rename",
    description: "Rename Selection",
    category: "edit",
  },
  {
    key: "e",
    modifiers: { ctrl: true, shift: true },
    action: "export",
    description: "Export",
    category: "edit",
  },
  {
    key: "c",
    modifiers: { ctrl: true, alt: true },
    action: "copy-properties",
    description: "Copy Properties",
    category: "edit",
  },
  {
    key: "v",
    modifiers: { ctrl: true, alt: true },
    action: "paste-properties",
    description: "Paste Properties",
    category: "edit",
  },

  // Transform
  {
    key: "h",
    modifiers: { shift: true },
    action: "flip-horizontal",
    description: "Flip Horizontal",
    category: "transform",
  },
  {
    key: "v",
    modifiers: { shift: true },
    action: "flip-vertical",
    description: "Flip Vertical",
    category: "transform",
  },
  {
    key: "m",
    modifiers: { ctrl: true },
    action: "use-as-mask",
    description: "Use as Mask",
    category: "transform",
  },
  {
    key: "Enter",
    action: "edit-shape-or-image",
    description: "Edit Shape or Image",
    category: "transform",
  },
  {
    key: "1",
    action: "opacity-10",
    description: "Set Opacity to 10%",
    category: "transform",
    implemented: true,
  },
  {
    key: "5",
    action: "opacity-50",
    description: "Set Opacity to 50%",
    category: "transform",
    implemented: true,
  },
  {
    key: "0",
    action: "opacity-100",
    description: "Set Opacity to 100%",
    category: "transform",
    implemented: true,
  },

  // Arrange
  {
    key: "]",
    modifiers: { ctrl: true },
    action: "bring-forward",
    description: "Bring Forward",
    category: "arrange",
    implemented: true,
  },
  {
    key: "[",
    modifiers: { ctrl: true },
    action: "send-backward",
    description: "Send Backward",
    category: "arrange",
    implemented: true,
  },
  {
    key: "]",
    modifiers: { ctrl: true, alt: true },
    action: "bring-to-front",
    description: "Bring to Front",
    category: "arrange",
  },
  {
    key: "[",
    modifiers: { ctrl: true, alt: true },
    action: "send-to-back",
    description: "Send to Back",
    category: "arrange",
  },
  {
    key: "a",
    modifiers: { alt: true },
    action: "align-left",
    description: "Align Left",
    category: "arrange",
  },
  {
    key: "d",
    modifiers: { alt: true },
    action: "align-right",
    description: "Align Right",
    category: "arrange",
  },
  {
    key: "w",
    modifiers: { alt: true },
    action: "align-top",
    description: "Align Top",
    category: "arrange",
  },
  {
    key: "s",
    modifiers: { alt: true },
    action: "align-bottom",
    description: "Align Bottom",
    category: "arrange",
  },
  {
    key: "h",
    modifiers: { alt: true },
    action: "align-horizontal-centers",
    description: "Align Horizontal Centers",
    category: "arrange",
  },
  {
    key: "v",
    modifiers: { alt: true },
    action: "align-vertical-centers",
    description: "Align Vertical Centers",
    category: "arrange",
  },
  {
    key: "t",
    modifiers: { ctrl: true, alt: true },
    action: "tidy-up",
    description: "Tidy Up",
    category: "arrange",
  },

  // Components
  {
    key: "k",
    modifiers: { ctrl: true, shift: true },
    action: "create-component",
    description: "Create Component",
    category: "components",
  },
  {
    key: "b",
    modifiers: { ctrl: true, shift: true },
    action: "detach-instance",
    description: "Detach Instance",
    category: "components",
  },
];

/**
 * Get shortcuts by category
 */
export function getShortcutsByCategory(
  category: ShortcutCategory
): KeyboardShortcut[] {
  return KEYBOARD_SHORTCUTS.filter(
    (shortcut) => shortcut.category === category
  );
}

/**
 * Get all shortcuts as a flat array
 */
export function getAllShortcuts(): KeyboardShortcut[] {
  return KEYBOARD_SHORTCUTS;
}

/**
 * Find shortcut by key combination
 */
export function findShortcut(
  key: string,
  modifiers: { ctrl?: boolean; cmd?: boolean; shift?: boolean; alt?: boolean }
): KeyboardShortcut | undefined {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const cmdOrCtrl = isMac ? modifiers.cmd : modifiers.ctrl;

  console.log(`[findShortcut] Looking for: key="${key}", modifiers=`, modifiers, `isMac=${isMac}, cmdOrCtrl=${cmdOrCtrl}`);

  return KEYBOARD_SHORTCUTS.find((shortcut) => {
    const shortcutModifiers = { ...shortcut.modifiers };
    if (isMac && shortcutModifiers.ctrl) {
      shortcutModifiers.cmd = shortcutModifiers.ctrl;
      delete shortcutModifiers.ctrl;
    }

    const matches = (
      shortcut.key.toLowerCase() === key.toLowerCase() &&
      (isMac ? shortcutModifiers.cmd === cmdOrCtrl : shortcutModifiers.ctrl === cmdOrCtrl) &&
      shortcutModifiers.shift === modifiers.shift &&
      shortcutModifiers.alt === modifiers.alt
    );

    if (shortcut.key.toLowerCase() === key.toLowerCase()) {
      console.log(`[findShortcut] Checking shortcut:`, shortcut, `shortcutModifiers=`, shortcutModifiers, `matches=${matches}`);
    }

    return matches;
  });
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.modifiers?.cmd) {
    parts.push("⌘");
  }
  if (shortcut.modifiers?.ctrl) {
    parts.push("Ctrl");
  }
  if (shortcut.modifiers?.shift) {
    parts.push("⇧");
  }
  if (shortcut.modifiers?.alt) {
    parts.push("⌥");
  }

  parts.push(shortcut.key.toUpperCase());

  return parts.join(" + ");
}
