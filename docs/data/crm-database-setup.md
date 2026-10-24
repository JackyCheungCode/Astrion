# CRM database setup

The repository already has a canonical workspace-based schema. Use the existing migration chain; do not create a parallel organization schema.

## Migration sequence

1. `supabase/migrations/20261024000100_crm_core_foundation.sql` — workspaces, memberships, accounts, contacts, leads, opportunities, activities, custom field metadata/values, audit events.
2. `20261024000110_crm_core_rls.sql` — workspace membership helpers and tenant RLS for core CRM data.
3. `20261024000120_commerce_service_automation.sql` — products, quotes/lines, sales orders/lines, service cases, campaigns, workflows, runs, notifications.
4. `20261024000130_fulfillment_finance_governance.sql` — shipments, contracts, invoices, payments, service work orders, SLA policies, approvals, imports, duplicate review, and integrations.
5. `20261024000140_crm_business_transactions.sql` — atomic lead conversion and accepted-quote-to-order functions.
6. `20261024000150_crm_document_numbering.sql` — concurrency-safe workspace-scoped document numbers.
7. `20261024000160_crm_audit_capture.sql` — audit triggers and restricted audit visibility.
8. `20261024000170_crm_field_metadata_permissions.sql` — restrict custom field schema changes to authorized workspace roles.
9. `20261024000180_workspace_role_write_permissions.sql` — prevent read-only/analyst roles from mutating business data and apply module-specific write roles.
10. `20261024000190_workspace_relationship_guards.sql` — validate same-workspace core references and custom-field record scope.
11. `20261024000200_ai_acquisition_usage_limits.sql` — enforce 20 requests/user/hour and 200 requests/workspace/hour with server-side metering.
12. `20261024000210_sales_order_customer_reference.sql` — add a customer reference field to sales orders.

The migration chain through 00200 and all 55 pgTAP schema/policy/transaction/usage assertions passed before the customer-reference field was added against a disposable local Supabase project in GitHub Actions. This does not mean a production project has been provisioned.

## Apply and verify

1. Create/select the intended Supabase project and confirm its region, backups, retention, and data-processing terms.
2. Review all migrations with the project owner/security reviewer.
3. Apply the full migration sequence using the Supabase CLI from a trusted development environment, or through the SQL editor after review. Do not run against production without a backup and change approval.
4. Configure the web app from `apps/web/.env.example` as `apps/web/.env.local`. Only the project URL and publishable/anon key belong in browser variables. Never use a service-role key in browser code or any `VITE_*` variable.
5. Create a test user through Supabase Auth and provision a workspace plus an owner membership through a trusted administrator process. The migrations intentionally do not expose public workspace provisioning.
6. Sign in and confirm a user without an active workspace membership sees no CRM rows. Test cross-workspace read/write denial using two separate test workspaces before importing customer data.

## Current frontend repository adapter

`apps/web/src/services/crmRepository.js` uses the signed-in Supabase session and the canonical `workspace_memberships` table. It currently supports list/create operations for accounts, contacts, leads, opportunities, quotes, and sales orders; primary-field edits for accounts, contacts, leads, opportunities, and quote notes; atomic lead conversion and accepted-quote-to-order calls; and persisted custom-field definitions. It intentionally stops if the user belongs to multiple workspaces because a workspace switcher is not yet implemented. Acquisition requests are limited to 20 per user and 200 per workspace per rolling hour; these are initial guardrails, not a provider spend-budget system. The `acquisition-research` Edge Function calls Serper and Tavily server-side and supports an optional Works endpoint adapter; credentials and the Works API contract still need project-specific configuration.

If Supabase variables are absent, the UI remains in clearly labeled demo mode. If variables exist but authentication, workspace membership, or migrations are incomplete, the page reports the error and labels fallback rows as demo data.

## Remaining production work

- Full multi-field edit forms, restore/physical-delete flows, cursor pagination, typed custom-field value persistence, field-level authorization, and safe dynamic validation. Core lists now hydrate key account relationships and support CSV export of the currently loaded/filtered rows.
- Expand role-boundary tests with representative workspace/user fixtures and perform a security review before production.
- Business-rule tests for lead conversion, quote acceptance/expiry, order creation, and audit capture.
- Atomic pricing/tax calculations, quote versioning rules, approvals, and finance reconciliation.
- Confirm the exact Works API contract and configure server-side Serper, Tavily, and Works secrets; credentials must remain server-side.
