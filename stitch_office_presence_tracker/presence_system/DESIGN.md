---
name: Presence System
colors:
  surface: '#f9f9fe'
  surface-dim: '#d9dadf'
  surface-bright: '#f9f9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f8'
  surface-container: '#ededf3'
  surface-container-high: '#e7e8ed'
  surface-container-highest: '#e2e2e7'
  on-surface: '#191c1f'
  on-surface-variant: '#42474f'
  inverse-surface: '#2e3034'
  inverse-on-surface: '#f0f0f5'
  outline: '#727780'
  outline-variant: '#c2c7d1'
  surface-tint: '#2d6197'
  primary: '#00355f'
  on-primary: '#ffffff'
  primary-container: '#0f4c81'
  on-primary-container: '#8ebdf9'
  inverse-primary: '#a0c9ff'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#62fae3'
  on-secondary-container: '#007165'
  tertiary: '#243449'
  on-tertiary: '#ffffff'
  tertiary-container: '#3b4b60'
  on-tertiary-container: '#aabbd4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#a0c9ff'
  on-primary-fixed: '#001c37'
  on-primary-fixed-variant: '#07497d'
  secondary-fixed: '#62fae3'
  secondary-fixed-dim: '#3cddc7'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005047'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f9f9fe'
  on-background: '#191c1f'
  surface-variant: '#e2e2e7'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  touch-target-min: 48px
  margin-mobile: 1.25rem
  gutter-md: 1rem
  stack-gap: 0.75rem
  section-padding: 1.5rem
---

## Brand & Style

The design system is anchored in the concept of **Reliable Clarity**. It targets modern professionals who need to navigate hybrid work environments with zero friction. The aesthetic is **Corporate-Minimalist**, blending the structured reliability of traditional enterprise software with the approachability of modern consumer mobile apps. 

The emotional response should be one of "effortless organization." By utilizing ample whitespace, a constrained palette, and soft geometry, the interface reduces the cognitive load of office management, making the act of "checking in" or "finding a desk" feel like a secondary, seamless task rather than a chore.

## Colors

This design system utilizes a palette of **Professional Blues** to establish trust and focus. 
- **Primary Blue (#0F4C81):** Used for primary actions, active navigation states, and brand identifiers.
- **Mint Green (#2DD4BF):** Reserved exclusively for "Active Presence" or "Available" statuses, providing a fresh, high-contrast signal against the blue.
- **Slate Gray (#64748B):** Used for secondary text, icons, and inactive states to maintain a professional hierarchy.
- **Soft Background (#F8FAFC):** A cool-toned gray that reduces eye strain and distinguishes the card-based interface from the background.
- **Presence Accents:** A lighter shade of mint is used for status chips to ensure legibility and a "gentle" notification style.

## Typography

The design system relies on **Inter** for its exceptional legibility and systematic feel. The type scale is optimized for mobile-first consumption, prioritizing high x-heights and tight tracking for headlines to maintain a modern, "app-like" appearance.

- **Headlines:** Use Bold and Semi-Bold weights to clearly demarcate sections like "Floor Selection" or "Current Status."
- **Body Text:** Kept to a minimum of 14px to ensure accessibility during transit or in varied lighting conditions.
- **Labels:** Uppercase styles are used sparingly for category headers (e.g., "7TH FLOOR") to provide structural contrast without overwhelming the user.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a heavy emphasis on vertical stacking for mobile efficiency. 

1. **Safe Margins:** A consistent 20px (1.25rem) margin is applied to the left and right of the screen to prevent "content crowding."
2. **Touch Targets:** All interactive elements (Floor toggles, status switchers) must maintain a minimum height of 48px to ensure ease of use on the go.
3. **Floor Toggling:** The layout features a prominent segmented control or "Switcher" at the top level for 7th vs. 2nd floor navigation, using the full width of the screen to maximize the tap area.
4. **Information Density:** Spacing between cards is kept generous (12px to 16px) to maintain the minimalist, un-cluttered feel requested.

## Elevation & Depth

Visual hierarchy is achieved through **Ambient Shadows** and **Tonal Layering**. 

- **Level 0 (Background):** Solid soft gray (#F8FAFC).
- **Level 1 (Cards):** White surfaces with a very soft, diffused shadow (Offset: 0, 4px; Blur: 12px; Opacity: 4% Black). This creates a subtle "lift" that suggests interactability without looking heavy.
- **Level 2 (Active States/Modals):** A slightly more pronounced shadow (Offset: 0, 8px; Blur: 20px; Opacity: 8% Black) to draw focus during floor switching or status updates.
- **Outlines:** In place of heavy shadows for small elements, use a 1px soft border (#E2E8F0) to maintain crispness in the minimalist style.

## Shapes

The design system utilizes a **Rounded** shape language to evoke friendliness and modern professionalism.

- **Cards & Containers:** Use a 16px radius (`rounded-xl`) to soften the corporate data and create a cohesive "containerized" look.
- **Buttons & Inputs:** Use a 12px radius (`rounded-lg`) to provide a distinct but related geometric profile that fits comfortably within the larger card containers.
- **Status Indicators:** Small status dots or presence indicators use a full circle (pill) shape to denote a "living" status.

## Components

### Floor Switcher (Segmented Control)
A high-priority component designed for one-handed use. It spans the container width, featuring two large segments for "7th Floor" and "2nd Floor." The active floor uses the Primary Blue with white text, while the inactive floor uses a light gray background with slate text.

### Presence Cards
The primary vehicle for information. Each card features a clear Title (Person/Desk), a Mint Green "Presence Badge," and a secondary label for time or duration. Cards have a 16px corner radius and a subtle ambient shadow.

### Primary Action Button
Large, full-width buttons (minimum 52px height) in Primary Blue. Use 16px font size with Semi-Bold weight. Use 12px corner radius.

### Status Chips
Small, pill-shaped indicators. "Available" chips use a Mint Green background (#DCFCE7) with dark green text (#166534). "Away" or "In Meeting" chips use a soft blue-gray background.

### Input Fields
Clean, outlined boxes with a 1px border (#E2E8F0). On focus, the border transitions to Primary Blue with a subtle 2px outer glow. Labels are positioned above the field in `label-sm` style.

### Navigation Bar
A clean, bottom-docked navigation bar for mobile, using Primary Blue for active icons and Slate Gray for inactive icons, with no background blur to maintain the clean minimalist aesthetic.