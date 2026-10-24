# UI Engineering Standards

- Status: Accepted direction; exact packages and versions depend on repository inspection
- Scope: web UI, shared UI packages, and design system extensions
- Last reviewed: 2026-10-24

## 1. Carbon-first
- Use IBM Carbon Design System components, icons, tokens, themes, and established patterns wherever a suitable component exists.
- Treat official Carbon documentation and packages as the source of truth; do not hand-maintain a purportedly exhaustive component catalogue.
- Confirm framework, Carbon package versions, peer dependencies, and license compatibility before changing dependencies.
- Build an Astrion-specific component only when Carbon lacks a suitable control or a documented product requirement justifies an extension.

## 2. Interaction and accessibility
- Every interactive control MUST be keyboard operable and expose an accessible name and state.
- Preserve visible focus and logical focus order; announce validation errors and asynchronous status changes appropriately.
- Use semantic HTML and Carbon patterns instead of recreating common controls from raw elements.
- Provide loading, empty, success, error, disabled, and permission-denied states where applicable.
- Avoid color as the sole carrier of meaning.

## 3. Design consistency
- Use approved tokens for color, typography, spacing, density, grid, motion, and themes.
- Avoid ad hoc hex colors, one-off spacing values, and duplicated primitives.
- Data-dense CRM screens SHOULD prioritize readable tables, clear filtering, predictable keyboard behavior, and responsive layouts.
- Keep business logic out of visual components; use explicit hooks/services/contracts where the established stack supports them.

## 4. Verification
- Add accessibility checks and visual regression coverage for critical flows where supported.
- Review keyboard navigation, focus restoration, zoom/responsiveness, contrast, and form error states.
- Document rationale and tests for custom controls.

## Acceptance criteria
- [ ] Existing stack and Carbon compatibility were verified before dependency changes.
- [ ] Official components/tokens are used where suitable.
- [ ] Keyboard, focus, labels, error states, and responsive behavior are checked.
- [ ] Custom component rationale and tests are documented.
