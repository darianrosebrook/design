import { Component, LayersIcon, Page, Square } from "@/lib/components/icons";

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
