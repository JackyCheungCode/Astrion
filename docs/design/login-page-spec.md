# Login page design specification

- Status: Implemented as a static interaction prototype; production authentication not implemented
- Owner/team: TBD
- Last reviewed: 2026-10-24

## Goal

Create a calm, high-trust entry point for Astrion that feels appropriate for an enterprise CRM and aligns with the Carbon Design System direction.

## Visual direction

- Split layout on desktop: charcoal brand/story panel and white account form panel.
- Carbon-inspired blue primary action, neutral gray surfaces, compact typography, square controls, and clear hierarchy.
- Mobile layout collapses to one column and retains brand identity above the form.
- Avoid decorative imagery that competes with the sign-in task; use a small geometric brand mark and restrained data/insight motif.

## Included interactions

- Email and password fields with appropriate autocomplete attributes.
- Password visibility toggle with an accessible pressed state.
- Remember-me checkbox.
- Sign-in form and single sign-on entry point.
- Password-recovery view that pre-fills the email field and provides a return path.
- Status messages that explicitly state authentication, SSO, recovery, support, and policy links are not connected yet.
- Keyboard-visible focus, semantic labels, live status regions, responsive layout, and reduced-motion support.

## Security and integration boundary

This is a self-contained HTML/CSS/JavaScript design prototype at `apps/web/login-preview.html`. It is not wired to an identity provider and does not send credentials or emails. Do not treat its client-side form validation or UI states as authentication or authorization.

Before production integration:
1. Confirm the application framework, package manager, routing, and deployment target.
2. Confirm the identity provider and authentication flow (including MFA, recovery, session renewal, logout, and SSO requirements).
3. Use provider-supported SDKs and server-side authorization; never place service-role keys or provider secrets in browser code.
4. Configure secure session/cookie behavior, CSRF protections where applicable, rate limiting, and generic responses for account recovery.
5. Test keyboard and screen-reader flows, contrast, responsive behavior, error states, and unauthorized-route handling.
6. Replace prototype-only messages and placeholder destinations with real routes and backend outcomes; never imply a successful login before the provider confirms it.

## Acceptance checklist

- [x] Desktop split layout and mobile single-column layout.
- [x] Labels, autocomplete, visible keyboard focus, and live status messaging.
- [x] Password visibility toggle.
- [x] Recovery view and return navigation.
- [x] Prototype explicitly avoids fake authentication success.
- [ ] Confirm final product copy and supported sign-in methods.
- [ ] Integrate verified authentication provider.
- [ ] Add automated accessibility and browser tests.
- [ ] Verify deployment routing and production error handling.
