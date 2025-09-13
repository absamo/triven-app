# 🎨 Design System - Triven App

This document outlines the design system for the Triven App, built with Mantine theming while respecting your current color scheme.

## 🎯 Color Palette

### Primary Colors

#### Teal (Navigation & Actions)
Used for header, navigation, and primary actions to match your existing design.

- **teal-3** `#5eead4` - Hover states for navigation links
- **teal-4** `#2dd4bf` - Borders and subtle accents  
- **teal-6** `#0d9488` - Icons and secondary elements
- **teal-7** `#0f766e` - Header background (your current header color)
- **teal-8** `#115e59` - Primary buttons
- **teal-9** `#134e4a` - Button hover states

#### Lavender (Backgrounds & Surfaces)
Custom purple palette matching your sidebar background.

- **lavender-0** `#faf9ff` - Pure background 
- **lavender-1** `#f0edff` - Subtle backgrounds
- **lavender-2** `#e6e0ff` - **Your current sidebar background**
- **lavender-3** `#dcd3ff` - Card backgrounds
- **lavender-4** `#d1c5ff` - Hover states
- **lavender-5** `#c6b6ff` - Active states

### Usage Guidelines

```tsx
// Primary buttons use teal-8
<Button color="teal" variant="filled">Primary Action</Button>

// Sidebar uses your existing lavender background
<AppShell.Navbar bg="lavender.2">

// Navigation links use teal for consistency
<NavLink 
  color="teal"
  styles={{
    root: { '&:hover': { backgroundColor: 'var(--mantine-color-lavender-1)' } }
  }}
>
```

## 🧩 Component System

### Theme Toggle
A ready-to-use component that leverages Mantine's built-in color scheme management.

```tsx
import { ThemeToggle } from "~/app/components/ThemeToggle"

// Already integrated in your header - uses useMantineColorScheme internally
<ThemeToggle size="lg" variant="subtle" />
```

### Color Scheme Management
The app uses Mantine's built-in color scheme system:

```tsx
import { useMantineColorScheme } from "@mantine/core"

function MyComponent() {
  const { colorScheme, toggleColorScheme, setColorScheme } = useMantineColorScheme()
  
  return (
    <Button onClick={toggleColorScheme}>
      Switch to {colorScheme === 'dark' ? 'light' : 'dark'} mode
    </Button>
  )
}
```

### Design Tokens

#### Spacing Scale
- **xs**: 8px - Tight spacing
- **sm**: 12px - Small gaps  
- **md**: 16px - Default spacing
- **lg**: 24px - Section spacing
- **xl**: 32px - Large sections

#### Shadows
- **subtle**: `0 1px 3px rgba(0, 0, 0, 0.12)` - Cards, inputs
- **moderate**: `0 2px 8px rgba(0, 0, 0, 0.15)` - Modals, dropdowns  
- **strong**: `0 4px 16px rgba(0, 0, 0, 0.2)` - Overlays, important elements

#### Typography
- **Font Family**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Headings**: Font weight 600 for consistent hierarchy
- **Default Radius**: `md` (8px) for modern, friendly appearance

## 🌓 Dark Mode Support

The theme automatically adapts to dark mode while maintaining your color relationships:

- **Header**: Remains teal but with adjusted contrast
- **Backgrounds**: Converts to dark variants while preserving the purple/teal relationship
- **Text**: Auto-adjusts contrast for accessibility

## 📱 Current Implementation

### ✅ What's Already Set Up

1. **Header Navigation** - Uses your teal color scheme
2. **Theme Toggle** - Functional light/dark mode switch  
3. **Sidebar** - Maintains your lavender background (`#e6e0ff`)
4. **Design Tokens** - Spacing, shadows, and typography scales
5. **Component Overrides** - Mantine components styled to match your design

### 🎨 Consistent Design Language

Your app now has a unified design system that:
- **Respects** your existing teal navigation colors
- **Preserves** your purple sidebar background
- **Enhances** with proper dark mode support
- **Scales** with consistent spacing and shadows
- **Unifies** all components under one cohesive theme

## 🚀 Usage Examples

```tsx
// Access theme colors in components
import { useMantineTheme } from "@mantine/core"

const theme = useMantineTheme()
const sidebarBg = theme.other.sidebarBackground // "#e6e0ff"
const headerTeal = theme.other.headerTeal // "#0f766e"

// Use design tokens
<Box p={theme.other.spacing.lg} shadow={theme.other.shadows.moderate}>
  Content with consistent spacing and shadows
</Box>
```

The theme is now integrated into your app root (`app/root.tsx`) and will apply consistently across all pages and components.
