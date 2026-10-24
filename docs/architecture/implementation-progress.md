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
- [x] Add GitHub Actions web build, Edge Function type-check, and path-scoped Supabase database-test workflows.
- [ ] Add lint/typecheck gates and validate the full workflow to green.
- [x] Establish Carbon-based shared app shell and route-driven modular workspace prototype.
- [ ] Establish auth, permissions, observability, and configuration validation.

## Phase 3 — CRM and AI prospecting
- [x] Frontend prototypes for companies/accounts, contacts, leads, opportunity board/list, quotes, orders, fulfillment, payments, analytics, and settings.
- [x] Add shared list/table, local draft creation, configurable field catalog prototype, workflow builder, analytics panels, and AI assistant shell.
- [x] Connect account/contact/lead/opportunity/quote/order list and create paths to workspace-scoped persistence; add lead conversion and quote-to-order RPCs.
- [ ] Connect duplicate detection/review, full edit/delete flows, and complete conversion history UI.
- [ ] AI Gateway, provider adapters, budgets, usage logging, and evaluations.
- [ ] Prospect research, evidence provenance, scoring, review queue, and outreach approvals.

## Phase 4 — sales and operations
- [ ] Opportunities, products, pricing, quotes, and approvals.
- [ ] Sales orders and versioned commercial terms.
- [ ] Shipments and fulfillment tracking.
- [ ] Receivables, payments, allocations, refunds, and reconciliation.

## Phase 5 — settings and integrations
- [x] Frontend prototype for custom field definitions, field types, required/unique flags, and object selector.
- [x] Persist custom field definitions and options metadata with role-restricted schema mutations.
- [ ] Persist custom-field values and enforce typed validation, uniqueness, and field-level access.
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
- No production database migration, secret creation, or deployment has been run. Dependency installation/build and local Supabase migration tests are now defined in GitHub Actions.


## Frontend implementation note — 2026-10-24

- Expanded Carbon-based navigation into AI acquisition, CRM, sales, orders/fulfillment, service, analytics, AI automation, data governance, and system configuration.
- Added shared business module views for lists, search/filter, local demo drafts, opportunity board, analytics, custom-field configuration, workflow editor, AI assistant, user/role previews, and integrations.
- Added a Supabase sign-in gate when environment variables are configured; without those variables the app remains in clearly labeled demo mode.
- Added a workspace-scoped repository adapter for list/create operations on accounts, contacts, leads, opportunities, quotes, and sales orders. Lead conversion and accepted-quote-to-order actions call atomic database functions. Multi-workspace users are blocked until a workspace switcher exists.
- Custom-field definitions can be listed/created/deleted through the workspace metadata API when the signed-in role is authorized. Field value persistence, dynamic validation, edit/delete for ordinary records, pagination, and relationship hydration remain incomplete.
- [x] GitHub Actions web build and Deno Edge Function type-check passed; migrations 00100–00190 and the original 52 pgTAP assertions passed before adding acquisition metering.


## CRM foundation progress — 2026-10-24

- [x] Add initial tenant-scoped PostgreSQL schema for workspaces, memberships, accounts, contacts, leads, opportunities, activities, custom-field definitions/values, and audit events.
- [x] Add indexes for common workspace-scoped lookup, ownership, funnel, activity, and audit queries.
- [x] Add row-level security policies for workspace membership, CRM record access, role-gated destructive operations, and append-only audit events.
- [ ] Validate migrations against a real disposable Supabase project and run database security advisors (not yet run).
- [x] Add Supabase local configuration and 56 schema/RLS/transaction/usage smoke assertions.
- [x] Migrations 00200–00210 and all 56 assertions passed in GitHub Actions.
- [ ] Add representative tenant seed data and deeper role-boundary tests.
- [ ] Implement server-backed repository/API layer and replace frontend-only demo state with persisted CRUD.
- [x] Add composite workspace-safe foreign keys across core CRM relationships.
- [x] Add append-only audit triggers and atomic lead-conversion / quote-to-order transactions.
- [ ] Complete field-level authorization and run security review against a live project.


## Commerce and service schema — 2026-10-24

- [x] Add product catalog, quote and quote-line, sales-order and order-line tables.
- [x] Add customer service cases with priority, status, SLA timestamps, and assignment.
- [x] Add marketing campaigns and campaign-member attribution.
- [x] Add workflow definitions and execution records, plus per-user notification inbox.
- [x] Add tenant-scoped indexes and RLS policies to these additional tables.
- [x] Change custom-field API names in the UI to generated read-only keys; keep field type, required, and unique choices in controls.
- [ ] Execute a full Vite build and database migration test in a network-enabled project environment; this has not been verified here.


## Finance, fulfillment, governance — 2026-10-24

- [x] Add shipment and shipment-line records.
- [x] Add contracts, invoices, and payment records.
- [x] Add service work orders and SLA policy definitions.
- [x] Add approval requests, import jobs, duplicate rules/review queue, and integration connection/sync records.
- [x] Extend schema smoke tests to assert the presence of 34 CRM tables and RLS on representative core tables.
- [ ] Expand automated tests to cover role boundaries, cross-tenant relationship rejection, and audit immutability.
- [ ] Run all migrations and pgTAP tests in a disposable Supabase environment before production use.


## Workspace persistence and transaction progress — 2026-10-24

- [x] Align new work with the existing canonical `workspaces` / `workspace_memberships` schema and the existing 34-table CRM, commerce, service, finance, and governance model. No parallel organization schema is retained.
- [x] Add concurrency-safe workspace-scoped document numbering for ACC, CON, LEA, OPP, QUO, and SO prefixes.
- [x] Restrict custom-field definition mutations to owner/admin/sales-manager roles and restrict audit-log reads to owner/admin/sales-manager/analyst roles.
- [x] Apply migrations 00140–00190 to a disposable local Supabase project in CI.
- [x] Migration 00210 and the expanded 56-assertion suite are verified in CI. A production Supabase project has not been provisioned or migrated.

- [x] Add role-aware write policies so analyst/read-only roles cannot mutate core business data.
- [x] Add same-workspace relationship guards for core CRM links and polymorphic custom-field values.

- [x] Add server-side acquisition search for Serper and Tavily with optional Works endpoint adapter, workspace authorization, evidence normalization, explicit lead persistence, and audit logging.
- [ ] Confirm the exact Works API contract and configure production provider secrets; no live provider credentials have been added.

- [x] Add initial per-user/per-workspace acquisition request limits (20/user/hour, 200/workspace/hour) with atomic reservation and usage status tracking.

- [x] Add CRM record detail views and primary-field edit operations for accounts, contacts, leads, opportunities, and quote notes; complete field-by-field editing and archive/delete flows remain pending.

- [x] Route AI acquisition review, scoring, research, and contact pages to workspace-scoped CRM records instead of the generic task view.
- [x] Add lead qualification/disqualification actions; conversion is surfaced only after a lead is marked qualified.
