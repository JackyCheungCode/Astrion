# Implementation progress

This checklist tracks the architecture skeleton and subsequent implementation. A checked item means evidence has been committed; planned items are not implementation claims.

## Phase 0 — repository baseline
- [x] Confirm target repository and default branch.
- [x] Create architecture working branch.
- [x] Inspect current README and repository documentation baseline.
- [x] Probe common root package manifests; no root `package.json` was found on the inspected default branch.
- [ ] Verify complete source tree, CI/deployment configuration, and any externally managed services.
- [ ] Inspect Supabase project, existing migrations, tables, indexes, RLS policies, and consumers before selecting a physical schema.

## Phase 1 — architecture and documentation
- [x] Establish modular-monolith-first architectural direction in ADR 0001.
- [x] Draft logical entity relationships and lifecycle contracts for review.
- [x] Draft tenant isolation and authorization matrix for review.
- [ ] Finalize module boundaries and dependency rules against the verified stack.
- [ ] Finalize entity relationships, state transitions, and financial edge cases with product-owner review.
- [ ] Review tenant isolation, RLS, secrets, audit, and API security against the actual environment.
- [ ] Confirm Carbon component/version strategy against the verified frontend stack.

## Phase 2 — foundation
- [ ] Align package manager and workspace tooling with the existing stack.
- [ ] Establish lint, typecheck, test, and CI checks.
- [x] Establish Carbon-based shared app shell and route-driven modular workspace prototype.
- [ ] Establish auth, permissions, observability, and configuration validation.

## Phase 3 — CRM and AI prospecting
- [x] Frontend prototypes for companies/accounts, contacts, leads, opportunity board/list, quotes, orders, fulfillment, payments, analytics, and settings.
- [x] Add shared list/table, local draft creation, configurable field catalog prototype, workflow builder, analytics panels, and AI assistant shell.
- [ ] Connect companies, contacts, leads, deduplication, and conversion history to persistent services.
- [ ] AI Gateway, provider adapters, budgets, usage logging, and evaluations.
- [ ] Prospect research, evidence provenance, scoring, review queue, and outreach approvals.

## Phase 4 — sales and operations
- [ ] Opportunities, products, pricing, quotes, and approvals.
- [ ] Sales orders and versioned commercial terms.
- [ ] Shipments and fulfillment tracking.
- [ ] Receivables, payments, allocations, refunds, and reconciliation.

## Phase 5 — settings and integrations
- [x] Frontend prototype for custom field definitions, field types, required/unique flags, and object selector.
- [ ] Persist custom field definitions, options, values, validation, and permissions.
- [ ] AI provider/model settings and secure credential handling.
- [ ] API keys, scopes, revocation, rate limits, and webhooks.
- [ ] Automation, notifications, audit, imports/exports, and reporting.

## Phase 6 — verification and release
- [ ] Unit, integration, E2E, RLS, security, and accessibility tests.
- [ ] Visual regression and performance checks.
- [ ] Deployment, rollback, backup, and recovery runbooks.
- [ ] Review pull request before merging to main.

## Change log

- Architecture V2 skeleton: documentation and tracked directory placeholders only.
- Normalized development standards: development rules documented; runtime implementation remains unverified.
- Domain model and authorization draft: logical contracts only; no physical schema or permissions have been applied.
- No dependency installation, database migration, secret creation, or deployment is included in these phases.


## Frontend implementation note — 2026-10-24

- Expanded the Carbon-based navigation into AI acquisition, CRM, sales, orders/fulfillment, service, analytics, AI automation, data governance, and system configuration.
- Added a shared business module page for dashboards, tables, search/filter, local draft creation, sales pipeline board, analytics, custom fields, workflow steps, AI assistant, user/role previews, and integration settings.
- All records and metrics in the prototype are explicitly demo data. CRUD changes remain local to the current browser view; no database writes, external searches, authentication, or provider API calls are performed.
- Build verification remains pending because the current execution environment cannot resolve GitHub for a local clone and dependency installation.


## CRM foundation progress — 2026-10-24

- [x] Add initial tenant-scoped PostgreSQL schema for workspaces, memberships, accounts, contacts, leads, opportunities, activities, custom-field definitions/values, and audit events.
- [x] Add indexes for common workspace-scoped lookup, ownership, funnel, activity, and audit queries.
- [x] Add row-level security policies for workspace membership, CRM record access, role-gated destructive operations, and append-only audit events.
- [ ] Validate migrations against a real disposable Supabase project and run database security advisors (not yet run).
- [ ] Add automated schema/RLS tests, migration runner configuration, and seed data for local development.
- [ ] Implement server-backed repository/API layer and replace frontend-only demo state with persisted CRUD.
- [x] Add composite workspace-safe foreign keys across core CRM relationships.
- [ ] Add field-level authorization, immutable audit triggers, and reviewed record-conversion transaction.


## Commerce and service schema — 2026-10-24

- [x] Add product catalog, quote and quote-line, sales-order and order-line tables.
- [x] Add customer service cases with priority, status, SLA timestamps, and assignment.
- [x] Add marketing campaigns and campaign-member attribution.
- [x] Add workflow definitions and execution records, plus per-user notification inbox.
- [x] Add tenant-scoped indexes and RLS policies to these additional tables.
- [x] Change custom-field API names in the UI to generated read-only keys; keep field type, required, and unique choices in controls.
- [ ] Execute a full Vite build and database migration test in a network-enabled project environment; this has not been verified here.
