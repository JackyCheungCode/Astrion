# Implementation progress

This checklist tracks the architecture skeleton and subsequent implementation. A checked item means evidence has been committed; planned items are not implementation claims.

## Phase 0 — repository baseline
- [x] Confirm target repository and default branch.
- [x] Create architecture working branch.
- [ ] Inspect existing source files, package manifests, deployment config, and Supabase migrations.
- [ ] Record current stack and deployment constraints before choosing dependencies.

## Phase 1 — architecture and documentation
- [ ] Finalize module boundaries and dependency rules.
- [ ] Finalize entity relationships and state transitions.
- [ ] Review tenant isolation, RLS, secrets, audit, and API security.
- [ ] Confirm Carbon component/version strategy.

## Phase 2 — foundation
- [ ] Align package manager and workspace tooling with the existing stack.
- [ ] Establish lint, typecheck, test, and CI checks.
- [ ] Establish Carbon theme/tokens and shared app shell.
- [ ] Establish auth, permissions, observability, and configuration validation.

## Phase 3 — CRM and AI prospecting
- [ ] Companies, contacts, leads, deduplication, and conversion history.
- [ ] AI Gateway, provider adapters, budgets, usage logging, and evaluations.
- [ ] Prospect research, evidence provenance, scoring, review queue, and outreach approvals.

## Phase 4 — sales and operations
- [ ] Opportunities, products, pricing, quotes, and approvals.
- [ ] Sales orders and versioned commercial terms.
- [ ] Shipments and fulfillment tracking.
- [ ] Receivables, payments, allocations, refunds, and reconciliation.

## Phase 5 — settings and integrations
- [ ] Custom field definitions, options, values, validation, and permissions.
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
- No dependency installation, database migration, secret creation, or deployment is included in this phase.
