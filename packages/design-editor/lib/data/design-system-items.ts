import { Component, LayersIcon, Page, Square } from "@/lib/components/icons";
import {
  getAvailableComponents,
  getComponentMetadata,
  type IngestedComponent,
} from "@/lib/utils/dynamic-component-registry";

export interface DesignSystemItem {
  id: string;
  name: string;
  type: "component" | "snippet" | "page" | "icon";
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  tags: string[];
  usage: number;
  lastUsed: string;
  author: string;
  version: string;
  isFavorite: boolean;
  isBookmarked: boolean;
  complexity: "simple" | "medium" | "complex";
  accessibility: "basic" | "enhanced" | "full";
}

/**
 * Convert an ingested component to a design system item
 */
function convertIngestedComponentToDesignSystemItem(
  component: IngestedComponent
): DesignSystemItem {
  // Determine complexity based on props count
  const propsCount = Object.keys(component.defaultProps || {}).length;
  const complexity: "simple" | "medium" | "complex" =
    propsCount <= 3 ? "simple" : propsCount <= 8 ? "medium" : "complex";

  // Generate tags from category and name
  const tags = [
    component.category.toLowerCase(),
    ...component.name.toLowerCase().split(/\s+/),
  ].filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicates

  return {
    id: component.id,
    name: component.name,
    type: "component" as const,
    category: component.category,
    icon: Component, // Default icon, could be customized based on category
    description: component.description || `${component.name} component`,
    tags,
    usage: 0, // Could be tracked separately
    lastUsed: "Never", // Could be tracked separately
    author: component.source || "Unknown",
    version: component.version || "1.0.0",
    isFavorite: false,
    isBookmarked: false,
    complexity,
    accessibility: "basic" as const, // Default, could be enhanced based on component analysis
  };
}

/**
 * Generate design system items from available components
 */
/**
 * Storage key for design system user preferences
 */
const DESIGN_SYSTEM_PREFERENCES_KEY = "design-editor-design-system-preferences";

interface DesignSystemPreferences {
  favorites: Set<string>;
  bookmarks: Set<string>;
  lastUsed: Record<string, string>;
  usage: Record<string, number>;
}

/**
 * Load user preferences from localStorage
 */
function loadUserPreferences(): DesignSystemPreferences {
  // Check if we're on the client side before accessing localStorage
  if (typeof window === "undefined") {
    return {
      favorites: new Set(),
      bookmarks: new Set(),
      lastUsed: {},
      usage: {},
    };
  }

  try {
    const stored = localStorage.getItem(DESIGN_SYSTEM_PREFERENCES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        favorites: new Set(parsed.favorites || []),
        bookmarks: new Set(parsed.bookmarks || []),
        lastUsed: parsed.lastUsed || {},
        usage: parsed.usage || {},
      };
    }
  } catch (error) {
    console.warn("Failed to load design system preferences:", error);
  }

  return {
    favorites: new Set(),
    bookmarks: new Set(),
    lastUsed: {},
    usage: {},
  };
}

/**
 * Save user preferences to localStorage
 */
function saveUserPreferences(preferences: DesignSystemPreferences): void {
  // Check if we're on the client side before accessing localStorage
  if (typeof window === "undefined") {
    return;
  }

  try {
    const data = {
      favorites: Array.from(preferences.favorites),
      bookmarks: Array.from(preferences.bookmarks),
      lastUsed: preferences.lastUsed,
      usage: preferences.usage,
    };
    localStorage.setItem(DESIGN_SYSTEM_PREFERENCES_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save design system preferences:", error);
  }
}

/**
 * Update user preferences for a specific item
 */
export function updateDesignSystemItemPreferences(
  itemId: string,
  updates: {
    isFavorite?: boolean;
    isBookmarked?: boolean;
    incrementUsage?: boolean;
  }
): void {
  const preferences = loadUserPreferences();

  if (updates.isFavorite !== undefined) {
    if (updates.isFavorite) {
      preferences.favorites.add(itemId);
    } else {
      preferences.favorites.delete(itemId);
    }
  }

  if (updates.isBookmarked !== undefined) {
    if (updates.isBookmarked) {
      preferences.bookmarks.add(itemId);
    } else {
      preferences.bookmarks.delete(itemId);
    }
  }

  if (updates.incrementUsage) {
    preferences.usage[itemId] = (preferences.usage[itemId] || 0) + 1;
    preferences.lastUsed[itemId] = new Date().toISOString();
  }

  saveUserPreferences(preferences);
}

/**
 * Get design system usage statistics
 */
export function getDesignSystemStats(): {
  totalItems: number;
  favoriteCount: number;
  bookmarkCount: number;
  totalUsage: number;
  recentlyUsed: DesignSystemItem[];
  mostUsed: DesignSystemItem[];
} {
  const items = getDesignSystemItems();
  const preferences = loadUserPreferences();

  const favoriteCount = Array.from(preferences.favorites).length;
  const bookmarkCount = Array.from(preferences.bookmarks).length;
  const totalUsage = Object.values(preferences.usage).reduce(
    (sum, count) => sum + count,
    0
  );

  // Get recently used items (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentlyUsed = items
    .filter((item) => {
      const lastUsed = preferences.lastUsed[item.id];
      return lastUsed && new Date(lastUsed) > sevenDaysAgo;
    })
    .sort((a, b) => {
      const aTime = new Date(preferences.lastUsed[a.id] || 0).getTime();
      const bTime = new Date(preferences.lastUsed[b.id] || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 10);

  // Get most used items
  const mostUsed = items
    .filter((item) => (preferences.usage[item.id] || 0) > 0)
    .sort(
      (a, b) => (preferences.usage[b.id] || 0) - (preferences.usage[a.id] || 0)
    )
    .slice(0, 10);

  return {
    totalItems: items.length,
    favoriteCount,
    bookmarkCount,
    totalUsage,
    recentlyUsed,
    mostUsed,
  };
}

/**
 * Clear all user preferences (for testing/reset)
 */
export function clearDesignSystemPreferences(): void {
  // Check if we're on the client side before accessing localStorage
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(DESIGN_SYSTEM_PREFERENCES_KEY);
  } catch (error) {
    console.warn("Failed to clear design system preferences:", error);
  }
}

/**
 * Export user preferences for backup
 */
export function exportDesignSystemPreferences(): string | null {
  try {
    const preferences = loadUserPreferences();
    return JSON.stringify(
      {
        favorites: Array.from(preferences.favorites),
        bookmarks: Array.from(preferences.bookmarks),
        lastUsed: preferences.lastUsed,
        usage: preferences.usage,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  } catch (error) {
    console.warn("Failed to export design system preferences:", error);
    return null;
  }
}

/**
 * Import user preferences from backup
 */
export function importDesignSystemPreferences(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);

    if (!data.favorites || !data.bookmarks || !data.lastUsed || !data.usage) {
      throw new Error("Invalid preferences format");
    }

    const preferences: DesignSystemPreferences = {
      favorites: new Set(data.favorites),
      bookmarks: new Set(data.bookmarks),
      lastUsed: data.lastUsed,
      usage: data.usage,
    };

    saveUserPreferences(preferences);
    return true;
  } catch (error) {
    console.warn("Failed to import design system preferences:", error);
    return false;
  }
}

export function getDesignSystemItems(): DesignSystemItem[] {
  const componentNames = getAvailableComponents();
  const designSystemItems: DesignSystemItem[] = [];
  const preferences = loadUserPreferences();

  for (const componentName of componentNames) {
    const metadata = getComponentMetadata(componentName);
    if (metadata) {
      // Convert ComponentMetadata to IngestedComponent format for conversion
      const ingestedComponent: IngestedComponent = {
        id: componentName,
        name: metadata.name,
        description: metadata.description,
        category: metadata.category,
        icon: metadata.icon,
        defaultProps: metadata.defaultProps,
        component: metadata.component,
        source: "component-registry",
        lastUpdated: new Date().toISOString(),
      };

      const item =
        convertIngestedComponentToDesignSystemItem(ingestedComponent);

      // Apply user preferences
      item.isFavorite = preferences.favorites.has(item.id);
      item.isBookmarked = preferences.bookmarks.has(item.id);
      item.usage = preferences.usage[item.id] || 0;
      item.lastUsed = preferences.lastUsed[item.id] || item.lastUsed;

      designSystemItems.push(item);
    }
  }

  // Add some default items for pages, snippets, and icons if no components are available
  if (designSystemItems.length === 0) {
    const fallbackItems = getFallbackDesignSystemItems();
    // Apply preferences to fallback items too
    return fallbackItems.map((item) => ({
      ...item,
      isFavorite: preferences.favorites.has(item.id),
      isBookmarked: preferences.bookmarks.has(item.id),
      usage: preferences.usage[item.id] || item.usage,
      lastUsed: preferences.lastUsed[item.id] || item.lastUsed,
    }));
  }

  return designSystemItems;
}

/**
 * Fallback design system items when no real components are available
 */
function getFallbackDesignSystemItems(): DesignSystemItem[] {
  return [
    {
      id: "page-blank",
      name: "Blank Page",
      type: "page" as const,
      category: "pages",
      icon: Page,
      description: "Empty page template",
      tags: ["page", "blank", "template"],
      usage: 10,
      lastUsed: "1 hour ago",
      author: "System",
      version: "1.0.0",
      isFavorite: false,
      isBookmarked: false,
      complexity: "simple",
      accessibility: "basic",
    },
    {
      id: "icon-placeholder",
      name: "Placeholder Icon",
      type: "icon" as const,
      category: "icons",
      icon: Square,
      description: "Generic placeholder icon",
      tags: ["icon", "placeholder", "generic"],
      usage: 5,
      lastUsed: "2 hours ago",
      author: "System",
      version: "1.0.0",
      isFavorite: false,
      isBookmarked: false,
      complexity: "simple",
      accessibility: "basic",
    },
  ];
}

// LEGACY: Keep mock data for backward compatibility during transition
// TODO: Remove this once real implementation is fully working
// MOCK DATA: Placeholder design system items for demonstration purposes
export const mockDesignSystemItems: DesignSystemItem[] = [
  // MOCK DATA: Components showcase
  {
    id: "button-primary",
    name: "Primary Button",
    type: "component",
    category: "buttons",
    icon: Component,
    description:
      "Main call-to-action button with hover states and loading support",
    tags: ["button", "primary", "cta", "interactive"],
    usage: 45,
    lastUsed: "2 hours ago",
    author: "Design Team",
    version: "2.1.0",
    isFavorite: true,
    isBookmarked: false,
    complexity: "simple",
    accessibility: "enhanced",
  },
  {
    id: "card-product",
    name: "Product Card",
    type: "component",
    category: "cards",
    icon: Component,
    description:
      "Product display card with image, title, price, and action buttons",
    tags: ["card", "product", "ecommerce", "image"],
    usage: 23,
    lastUsed: "1 day ago",
    author: "UX Team",
    version: "1.8.2",
    isFavorite: false,
    isBookmarked: true,
    complexity: "medium",
    accessibility: "enhanced",
  },
  {
    id: "navigation-header",
    name: "Navigation Header",
    type: "component",
    category: "navigation",
    icon: Component,
    description:
      "Responsive navigation header with logo, menu, and user actions",
    tags: ["navigation", "header", "responsive", "menu"],
    usage: 12,
    lastUsed: "3 days ago",
    author: "Frontend Team",
    version: "3.0.1",
    isFavorite: false,
    isBookmarked: false,
    complexity: "complex",
    accessibility: "full",
  },
  {
    id: "form-input",
    name: "Input Field",
    type: "component",
    category: "forms",
    icon: Component,
    description:
      "Standard form input with validation states and error messages",
    tags: ["form", "input", "validation", "field"],
    usage: 67,
    lastUsed: "1 hour ago",
    author: "Design System",
    version: "2.5.0",
    isFavorite: true,
    isBookmarked: false,
    complexity: "simple",
    accessibility: "full",
  },
  {
    id: "modal-dialog",
    name: "Modal Dialog",
    type: "component",
    category: "overlays",
    icon: Component,
    description:
      "Accessible modal dialog with backdrop and keyboard navigation",
    tags: ["modal", "dialog", "overlay", "accessibility"],
    usage: 18,
    lastUsed: "2 days ago",
    author: "Accessibility Team",
    version: "1.9.3",
    isFavorite: false,
    isBookmarked: true,
    complexity: "complex",
    accessibility: "full",
  },

  // MOCK DATA: Snippets showcase
  {
    id: "color-palette",
    name: "Color Palette",
    type: "snippet",
    category: "tokens",
    icon: LayersIcon,
    description:
      "Complete color palette with primary, secondary, and neutral colors",
    tags: ["color", "palette", "tokens", "design-system"],
    usage: 34,
    lastUsed: "5 hours ago",
    author: "Design Team",
    version: "1.2.0",
    isFavorite: true,
    isBookmarked: false,
    complexity: "simple",
    accessibility: "basic",
  },
  {
    id: "typography-scale",
    name: "Typography Scale",
    type: "snippet",
    category: "tokens",
    icon: LayersIcon,
    description: "Complete typography scale with font families and sizes",
    tags: ["typography", "fonts", "scale", "text"],
    usage: 28,
    lastUsed: "1 day ago",
    author: "Design System",
    version: "2.0.1",
    isFavorite: false,
    isBookmarked: true,
    complexity: "simple",
    accessibility: "enhanced",
  },
  {
    id: "spacing-system",
    name: "Spacing System",
    type: "snippet",
    category: "tokens",
    icon: LayersIcon,
    description: "Consistent spacing tokens for margins, padding, and layout",
    tags: ["spacing", "layout", "tokens", "consistency"],
    usage: 41,
    lastUsed: "3 hours ago",
    author: "UX Team",
    version: "1.5.2",
    isFavorite: true,
    isBookmarked: false,
    complexity: "simple",
    accessibility: "basic",
  },

  // MOCK DATA: Pages showcase
  {
    id: "landing-page",
    name: "Landing Page",
    type: "page",
    category: "marketing",
    icon: Page,
    description: "Hero section, features, testimonials, and CTA layout",
    tags: ["landing", "hero", "marketing", "conversion"],
    usage: 15,
    lastUsed: "1 week ago",
    author: "Marketing Team",
    version: "3.2.1",
    isFavorite: false,
    isBookmarked: false,
    complexity: "complex",
    accessibility: "full",
  },
  {
    id: "dashboard-layout",
    name: "Dashboard Layout",
    type: "page",
    category: "application",
    icon: Page,
    description: "Sidebar navigation, header, and main content area",
    tags: ["dashboard", "layout", "navigation", "sidebar"],
    usage: 22,
    lastUsed: "2 days ago",
    author: "Product Team",
    version: "2.8.0",
    isFavorite: false,
    isBookmarked: true,
    complexity: "complex",
    accessibility: "enhanced",
  },

  // MOCK DATA: Icons showcase
  {
    id: "icon-set-basic",
    name: "Basic Icons",
    type: "icon",
    category: "ui-icons",
    icon: Square,
    description: "Essential UI icons for common actions and states",
    tags: ["icons", "ui", "basic", "actions"],
    usage: 89,
    lastUsed: "30 minutes ago",
    author: "Design System",
    version: "4.1.0",
    isFavorite: true,
    isBookmarked: true,
    complexity: "simple",
    accessibility: "basic",
  },
  {
    id: "icon-set-social",
    name: "Social Icons",
    type: "icon",
    category: "social",
    icon: Square,
    description: "Social media platform icons and brand logos",
    tags: ["icons", "social", "brands", "platforms"],
    usage: 45,
    lastUsed: "4 hours ago",
    author: "Brand Team",
    version: "2.3.1",
    isFavorite: false,
    isBookmarked: false,
    complexity: "simple",
    accessibility: "basic",
  },
];
