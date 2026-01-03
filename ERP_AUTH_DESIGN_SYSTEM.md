# ERP Authentication Design System - Style Guide

## Overview
This document outlines the comprehensive design system for all admin login modules, based on the reference ERP interface. The implementation ensures pixel-perfect consistency across all authentication components.

## Color Palette

### Primary Colors (Exact Reproduction)
```css
/* Main Backgrounds */
--erp-auth-bg-main: #f5f5f0;           /* Light beige background */
--erp-auth-bg-secondary: #e8e8e0;      /* Secondary background */
--erp-auth-bg-panel: #ffffff;          /* White panel background */
--erp-auth-bg-form: #f8f8f8;           /* Form background */

/* Blue Accent Colors */
--erp-auth-blue-primary: #4169E1;      /* Primary blue (Royal Blue) */
--erp-auth-blue-secondary: #5a7fdd;    /* Secondary blue */
--erp-auth-blue-light: #e8f4ff;        /* Light blue background */
--erp-auth-blue-dark: #2d4a9d;         /* Dark blue borders */

/* Text Colors */
--erp-auth-text-primary: #000000;      /* Primary text */
--erp-auth-text-secondary: #666666;    /* Secondary text */
--erp-auth-text-muted: #999999;        /* Muted text */
--erp-auth-text-white: #ffffff;        /* White text */

/* Border Colors */
--erp-auth-border-light: #cccccc;      /* Light borders */
--erp-auth-border-medium: #999999;     /* Medium borders */
--erp-auth-border-dark: #666666;       /* Dark borders */

/* Status Colors */
--erp-auth-success: #008000;           /* Success green */
--erp-auth-error: #cc0000;             /* Error red */
--erp-auth-warning: #ff8800;           /* Warning orange */
```

## Typography

### Font Specifications
- **Font Family**: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
- **Base Font Size**: 12px
- **Line Height**: 1.4
- **Title Font Size**: 16px (bold)
- **Label Font Size**: 11px
- **Menu Font Size**: 11px

### Text Alignment
- **Form Labels**: Left-aligned
- **Headers**: Center-aligned
- **Menu Items**: Left-aligned
- **Status Text**: Left-aligned

## Layout Structure

### Window Components (Top to Bottom)
1. **Title Bar** (28px height)
   - System icon (16x16px)
   - Title text
   - Close button (16x16px)

2. **Menu Bar** (24px height)
   - Menu items with hover effects
   - Classic ERP menu styling

3. **Main Content Area** (flexible height)
   - Logo section
   - Header section
   - Form panel

4. **Status Bar** (22px height)
   - Status items
   - Version info
   - Ready indicator

### Form Panel Structure
- **Panel Header**: Blue background with white text
- **Form Fields**: Grid layout with proper spacing
- **Input Fields**: Cream background (#fffef5)
- **Buttons**: Classic gradient styling
- **Footer**: Links and additional options

## Visual Components

### Input Fields
```css
.erp-auth-form-input {
  background: #fffef5; /* Cream background */
  border: 1px solid #cccccc;
  padding: 6px 8px;
  font-size: 12px;
  min-height: 24px;
}
```

### Buttons
```css
/* Standard Button */
.erp-auth-button {
  background: linear-gradient(to bottom, #f8f8f8, #e0e0e0);
  border: 1px solid #999999;
  padding: 6px 16px;
  font-size: 11px;
  min-height: 28px;
}

/* Primary Button */
.erp-auth-button-primary {
  background: linear-gradient(to bottom, #5a7fdd, #4169E1);
  color: #ffffff;
  border-color: #2d4a9d;
  font-weight: bold;
}
```

### Form Layout
- **Grid System**: Two-column layout for labels and inputs
- **Spacing**: 15px between form groups
- **Label Width**: Auto-width with proper alignment
- **Input Width**: 100% of available space

## Responsive Behavior

### Breakpoints
- **Desktop**: > 768px (full layout)
- **Tablet**: 481px - 768px (adjusted padding)
- **Mobile**: ≤ 480px (stacked layout)

### Mobile Adaptations
- Reduced padding and margins
- Stacked form elements
- Adjusted font sizes for readability
- Maintained visual hierarchy

## Component Classes

### Container Classes
- `.erp-auth-container` - Main wrapper
- `.erp-auth-card` - Login card container
- `.erp-auth-content` - Main content area

### Layout Classes
- `.erp-auth-title-bar` - Window title bar
- `.erp-auth-menu-bar` - Menu navigation
- `.erp-auth-form-panel` - Form container
- `.erp-auth-status-bar` - Bottom status bar

### Form Classes
- `.erp-auth-form` - Form wrapper
- `.erp-auth-form-group` - Form field group
- `.erp-auth-form-label` - Field labels
- `.erp-auth-form-input` - Input fields

### Button Classes
- `.erp-auth-button` - Standard button
- `.erp-auth-button-primary` - Primary action button

### Message Classes
- `.erp-auth-message` - Base message
- `.erp-auth-error-message` - Error messages
- `.erp-auth-success-message` - Success messages
- `.erp-auth-warning-message` - Warning messages

## Implementation Guidelines

### CSS Variables Usage
All colors are defined as CSS variables for consistency:
```css
:root {
  --erp-auth-bg-main: #f5f5f0;
  --erp-auth-blue-primary: #4169E1;
  /* ... other variables */
}
```

### Reusable Components
1. **Form Fields**: Standardized input styling
2. **Buttons**: Consistent button appearance
3. **Messages**: Uniform error/success styling
4. **Layout**: Consistent window structure

### Browser Compatibility
- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **IE11**: Graceful degradation
- **Mobile Browsers**: Responsive design

## Accessibility Features

### WCAG Compliance
- **Color Contrast**: Minimum 4.5:1 ratio
- **Keyboard Navigation**: Full tab support
- **Screen Readers**: Proper ARIA labels
- **Focus Indicators**: Visible focus states

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  :root {
    --erp-auth-border-light: #000000;
    --erp-auth-text-secondary: #000000;
  }
}
```

## Testing Requirements

### Visual Regression Tests
1. **Pixel-perfect comparison** with reference image
2. **Cross-browser consistency** verification
3. **Responsive behavior** testing
4. **Accessibility compliance** validation

### Browser Testing Matrix
| Browser | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Chrome  | ✅      | ✅     | ✅     |
| Firefox | ✅      | ✅     | ✅     |
| Safari  | ✅      | ✅     | ✅     |
| Edge    | ✅      | ✅     | ✅     |

### Mobile Responsiveness
- **Portrait orientation**: Optimized layout
- **Landscape orientation**: Maintained usability
- **Touch targets**: Minimum 44px size
- **Viewport scaling**: Proper meta tags

## File Structure

### CSS Files
- `erp-auth-theme.css` - Main theme file
- Component-specific overrides (if needed)

### Component Files
- `EmployeeLogin.jsx` - Employee authentication
- `CustomerLogin.jsx` - Customer authentication
- Additional login components (as needed)

## Maintenance Guidelines

### Color Updates
- Modify CSS variables in `:root` selector
- Test across all components
- Verify accessibility compliance

### Layout Changes
- Maintain consistent spacing ratios
- Test responsive behavior
- Validate cross-browser compatibility

### Component Updates
- Follow established class naming conventions
- Maintain visual consistency
- Update documentation as needed

## Performance Considerations

### CSS Optimization
- Minimal CSS footprint
- Efficient selectors
- No unused styles

### Loading Performance
- Critical CSS inlining (if needed)
- Optimized font loading
- Minimal external dependencies

## Documentation Updates

### Change Log
- Version tracking for design updates
- Component modification history
- Breaking change notifications

### Style Guide Maintenance
- Regular review and updates
- Component library synchronization
- Design system evolution tracking

This design system ensures pixel-perfect consistency across all admin login modules while maintaining excellent usability, accessibility, and performance standards.