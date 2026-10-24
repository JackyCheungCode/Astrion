# CRM database setup

This repository contains a reviewed starting point for the CRM schema, not a claim that a live Supabase project has been provisioned.

## Apply the migration

1. Create/select the intended Supabase project and confirm its region, backups, retention, and data-processing terms.
2. Review `supabase/migrations/20261024000100_crm_core_schema.sql` with the project owner/security reviewer.
3. Apply it using the Supabase CLI migration workflow from a trusted development environment, or through the SQL editor after review. Do not run against production without a backup and change approval.
4. Configure the web app from `apps/web/.env.example` as `apps/web/.env.local`. Only the project URL and publishable/anon key belong in browser variables. Never use the service-role key in the browser.
5. Create a test user through Supabase Auth, then provision an organization and its first owner membership through a trusted administrator process. The migration intentionally does not expose public organization/membership creation.
6. Sign in and confirm that a user without an active membership sees no CRM rows. Test cross-organization read/write denial with two separate test organizations before importing customer data.

## Current frontend repository adapter

`apps/web/src/services/crmRepository.js` uses the signed-in Supabase session and selects an active organization membership. It currently supports list/create operations for accounts, contacts, leads, opportunities, quotes, and sales orders. The adapter is intentionally limited; it does not yet implement edit/delete, pagination cursors, object relationship hydration, custom-field persistence, audit event writes, or transactional business flows.

If the Supabase variables are absent, the UI stays in clearly labeled demo mode. If variables exist but authentication/membership/schema setup is incomplete, the page reports the error and continues to label fallback rows as demo data.

## Schema scope

The migration introduces organization membership and role helpers; CRM accounts, contacts, leads, opportunities, products, quotes, sales orders, activities, field definitions, and append-only audit records. JSONB custom fields are a storage extension point, not a substitute for metadata validation, field-level authorization, or safe typed query generation.

Before production, add reviewed policies for each business action, database tests for RLS and tenant isolation, sequence-backed business numbering, atomic quote-to-order and lead-conversion transactions, approval records, and server-side integrations for external providers.
