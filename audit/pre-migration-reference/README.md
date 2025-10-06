# Pre-Migration Reference Audit

This directory contains a snapshot of the codebase from **commit `bff5afe`** - the state right before the Tailwind to SCSS migration began.

## 📁 Directory Structure

```
audit/pre-migration-reference/
├── ui-components/          # Original Tailwind-based UI components
│   ├── ui/                # Components from packages/design-editor/components/ui/
│   └── assemblies/        # Assembly components from packages/design-editor/components/
├── design-system/         # Design system components (packages/design-system/src)
└── styles/               # Global styles (packages/design-editor/styles/globals.css)
```

## 🎯 Purpose

Use this reference to audit what each component's styling looked like **before** the migration to SCSS modules and design tokens. This will help you:

1. **Compare layouts** - See how components were originally laid out with Tailwind
2. **Identify broken styles** - Compare against current SCSS implementation
3. **Understand design intent** - Review original Tailwind classes for spacing, colors, etc.
4. **Fix migration issues** - Reference the original styling when fixing broken layouts

## 🔍 Key Files to Audit

### UI Components (`ui-components/ui/`)
These were the original components using Tailwind classes:
- `button.tsx` - Button component with Tailwind classes
- `input.tsx` - Input field styling
- `card.tsx` - Card layouts
- `badge.tsx` - Badge styling
- And many more...

### Assembly Components (`ui-components/assemblies/`)
These were the higher-level components that orchestrated the UI:
- `properties-panel.tsx` - Properties panel layout
- `library-section.tsx` - Component library UI
- `canvas-area.tsx` - Main canvas area
- `top-navigation.tsx` - Top navigation bar

### Global Styles (`styles/globals.css`)
Contains the base Tailwind setup and any global overrides.

## 📋 Audit Process

For each component that looks broken in your current migration:

1. **Find the original component** in `ui-components/ui/` or `ui-components/assemblies/`
2. **Review the Tailwind classes** used in the original component
3. **Compare with current SCSS** in `packages/design-editor/ui/`
4. **Check layout and spacing** - ensure equivalent SCSS produces same visual result
5. **Verify responsive behavior** - compare breakpoint handling
6. **Test interactive states** - hover, focus, active states

## 🔧 Common Issues to Look For

- **Spacing inconsistencies** - Tailwind spacing classes vs SCSS token spacing
- **Color mismatches** - Tailwind color classes vs design token colors
- **Layout breaks** - Flex/grid layouts not translating properly
- **Responsive issues** - Media queries not matching original breakpoints
- **Interactive states** - Hover/focus states not preserved
- **Typography** - Font sizes and weights not matching

## 📝 Notes

- **Original state**: All components were using Tailwind CSS classes directly in JSX
- **Current state**: Components use SCSS modules with design token variables
- **Migration goal**: Maintain identical visual appearance while improving maintainability

## 🆘 Getting Help

If a component's layout is completely broken, compare the original Tailwind classes with the current SCSS implementation to identify what went wrong during the migration.
