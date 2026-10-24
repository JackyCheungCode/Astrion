# IBM Carbon design governance

## Baseline

- Prefer official Carbon React components, Carbon Icons, design tokens, grid, typography, and theme mechanisms compatible with the chosen frontend stack.
- Confirm installed framework and versions before selecting package versions.
- Treat Carbon's official component catalogue as the source of truth; do not claim a hand-maintained list is exhaustive.
- Use Astrion-specific controls only when no appropriate official control exists, and document the rationale.

## Required checks

- Keyboard access, visible focus, labels, validation/error announcements, and semantic structure.
- Consistent tokens for color, type, spacing, density, motion, and theme.
- Responsive behavior and data-dense table patterns.
- Visual regression for critical pages and accessibility checks in CI.
- Review Carbon and optional IBM product-extension package compatibility and licensing before adoption.

## References

- https://carbondesignsystem.com/
- https://react.carbondesignsystem.com/
- https://github.com/carbon-design-system/carbon
- https://github.com/carbon-design-system/ibm-products
- https://www.ibm.com/design/language/resources/
