# Astrion

AI-assisted CRM and sales operations platform.

## Architecture baseline

This repository is being organized around a modular-monolith-first architecture, an AI Gateway, and IBM Carbon Design System governance. The current branch is an architecture skeleton and planning baseline; it is not a claim that all application features are implemented.

## Planned capabilities

- AI prospecting, research evidence, enrichment, scoring, deduplication, and human review
- Leads, companies, contacts, accounts, opportunities, activities, and tasks
- Products, pricing, quotes, sales orders, fulfillment, receivables, payments, and reconciliation
- Central settings for custom fields, AI providers/models, API access, integrations, security, and audit
- IBM Carbon foundations, themes, components, accessible patterns, and visual regression checks
- Background jobs, observability, integration tests, security tests, and deployment documentation

## Key documents

- `docs/architecture/target-directory-structure.md` — target repository layout and module boundaries
- `docs/architecture/implementation-progress.md` — staged delivery checklist
- `docs/business/workflow.md` — business flow and entity relationships
- `docs/design/carbon-governance.md` — Carbon adoption and UI governance
- `docs/security/security-baseline.md` — security baseline

## Guardrails

- Inspect and preserve existing code/configuration before restructuring.
- Never commit secrets; credentials must remain server-side.
- Validate organization isolation and Supabase Row Level Security before production.
- Keep orders, shipments, receivables, payments, and payment allocations distinct.
- Use Carbon components and tokens compatible with the actual frontend stack.
- Do not run migrations or deploy infrastructure without explicit review.
