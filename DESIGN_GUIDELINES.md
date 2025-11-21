# YatraSathi Design Guidelines

## Overview
This document outlines the design principles and guidelines for the YatraSathi application to ensure a consistent, minimal, and professional user interface across all components.

## Color Palette

### Primary Colors
- **Primary Blue**: #007bff (Buttons, links, active states)
- **Primary Hover**: #0056b3 (Hover states for primary buttons)
- **Text Color**: #333 (Headings, primary text)
- **Secondary Text**: #555 (Labels, secondary information)
- **Light Text**: #666 (Descriptions, tertiary information)
- **Muted Text**: #999 (Footers, timestamps)

### Background Colors
- **Page Background**: #f5f5f5 (Root background)
- **Card Background**: #ffffff (Content cards)
- **Light Background**: #f8f9fa (Form backgrounds, table headers)
- **Header Background**: #ffffff (Header/navigation)

### Status Colors
- **Success**: #28a745 (Success messages, confirmed status)
- **Warning**: #ffc107 (Warning messages, pending status)
- **Danger**: #dc3545 (Error messages, delete actions)
- **Info**: #17a2b8 (Information messages, employee dashboard)

### Border Colors
- **Default Border**: #ddd (Form inputs, table borders)
- **Light Border**: #eee (Subtle dividers)
- **Focus Border**: #007bff (Input focus states)

## Typography

### Font Family
- Primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif

### Font Sizes
- **H1**: 2.5rem
- **H2**: 2rem
- **H3**: 1.75rem
- **H4**: 1.5rem
- **H5**: 1.25rem
- **H6**: 1rem
- **Body**: 1rem (16px)
- **Small Text**: 0.9rem

### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Semi-bold**: 600
- **Bold**: 700

## Spacing System

### Base Unit
- **Base spacing unit**: 0.25rem (4px)

### Common Spacing Values
- **XS**: 0.25rem (4px)
- **S**: 0.5rem (8px)
- **M**: 1rem (16px)
- **L**: 1.5rem (24px)
- **XL**: 2rem (32px)
- **XXL**: 3rem (48px)

## Buttons

### Primary Button
```css
.btn {
  display: inline-block;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: #0056b3;
}
```

### Secondary Button
```css
.btn-secondary {
  background-color: #6c757d;
}

.btn-secondary:hover {
  background-color: #545b62;
}
```

### Danger Button
```css
.btn-danger {
  background-color: #dc3545;
}

.btn-danger:hover {
  background-color: #bd2130;
}
```

### Small Buttons
```css
.btn-small {
  padding: 6px 12px;
  font-size: 14px;
}
```

## Forms

### Form Groups
```css
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}
```

### Form Controls
```css
.form-control {
  display: block;
  width: 100%;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  color: #495057;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}
```

## Cards and Containers

### Card Design
```css
.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
```

### Container Widths
- **Small**: 540px
- **Medium**: 720px
- **Large**: 960px
- **Extra Large**: 1140px
- **Full Width**: 1200px

## Grid System

### Responsive Grid
```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}
```

## Status Badges

### General Badge
```css
.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}
```

### Status-specific Badges
```css
.badge-public {
  background-color: #e3f2fd;
  color: #1976d2;
}
```

## Alerts and Messages

### Error Alert
```css
.alert-error {
  background-color: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
}
```

### Success Alert
```css
.alert-success {
  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
}
```

## Responsive Design

### Breakpoints
- **Mobile**: up to 768px
- **Tablet**: 768px and above
- **Desktop**: 992px and above
- **Large Desktop**: 1200px and above

### Mobile-first Approach
All components should be designed mobile-first and then enhanced for larger screens.

### Common Mobile Adjustments
- Stacked layouts instead of side-by-side
- Larger touch targets
- Simplified navigation
- Reduced padding and margins

## Accessibility

### Focus States
All interactive elements must have clear focus states:
```css
button:focus,
button:focus-visible {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}
```

### Semantic HTML
Use appropriate HTML elements for their intended purpose:
- `<button>` for buttons
- `<a>` for links
- `<form>` for forms
- Proper heading hierarchy (h1-h6)

### ARIA Attributes
Use ARIA attributes when necessary to enhance accessibility:
- `aria-label` for icon-only buttons
- `aria-hidden` for decorative elements
- `role` attributes for complex components

## Design Principles

### Minimalism
- Keep interfaces clean and uncluttered
- Use whitespace effectively
- Limit color palette to essential colors
- Focus on core functionality

### Consistency
- Maintain consistent styling across all components
- Use the same patterns for similar interactions
- Keep terminology consistent
- Follow established design patterns

### Professionalism
- Use professional color schemes
- Maintain clean typography
- Ensure proper alignment and spacing
- Avoid overly decorative elements

### Usability
- Prioritize user tasks
- Make actions discoverable
- Provide clear feedback
- Ensure responsive design

## Implementation Guidelines

### CSS Organization
- Use consistent class naming conventions
- Group related styles together
- Use comments to explain complex styles
- Keep specificity low where possible

### Component Structure
- Create reusable components
- Use consistent prop interfaces
- Separate presentational and container components
- Follow single responsibility principle

### Performance
- Minimize CSS bundle size
- Use efficient selectors
- Avoid unnecessary repaints and reflows
- Optimize images and assets

## Future Considerations

### Dark Mode
Plan for potential dark mode implementation:
- Define dark mode color palette
- Use CSS variables for easy theme switching
- Ensure proper contrast ratios

### Internationalization
Prepare for multi-language support:
- Use relative units for text sizing
- Consider text direction (LTR/RTL)
- Plan for different text lengths

This design guideline ensures that all UI components in the YatraSathi application maintain a consistent, minimal, and professional appearance that provides an excellent user experience.