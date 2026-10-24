# Data and Database Conventions

- Status: Accepted safety principles; schema design remains subject to inspection and review
- Scope: Supabase/Postgres, migrations, domain persistence, and data lifecycle
- Last reviewed: 2026-10-24

## 1. Schema design
- Logical entity lists are proposals, not approved migrations.
- Inspect current tables, constraints, indexes, RLS policies, data volume, and consumers before changing schema.
- Use explicit primary keys, foreign keys, uniqueness constraints, and check constraints where appropriate.
- Store timestamps consistently; use UTC for persisted instants and convert at presentation boundaries.
- Use exact decimal/numeric types for money; do not use floating point for financial amounts.
- Preserve historical commercial terms for accepted quotes and orders.
- Model payment allocations, refunds, reversals, shipments, and receivable installments as distinct records.

## 2. Tenant isolation and authorization
- Every tenant-owned record MUST have a clear tenant/organization ownership path.
- Enforce access through server-side authorization and database RLS where supported; frontend filtering is not security.
- Test cross-tenant reads, inserts, updates, deletes, joins, and RPC/function paths.
- Privileged service credentials MUST remain server-side and be narrowly scoped.

## 3. Migrations
- Migrations MUST be reviewed, ordered, repeatable in documented environments, and accompanied by rollback or recovery guidance.
- Prefer additive expand/migrate/contract changes for live systems.
- Never edit an already-applied migration without a deliberate repair plan.
- Do not run migrations against shared or production databases without explicit approval.
- Seed data MUST be synthetic and safe to re-run where practical.

## 4. Custom fields
- Keep field definitions/options separate from entity field values.
- Validate field type, ownership, visibility, and permissions at write and read boundaries.
- Never interpolate user-provided field names into SQL identifiers. Use a safe fixed schema or parameterized representation.

## 5. Data lifecycle
- Define retention, export, deletion, and audit behavior for sensitive data.
- Prefer explicit tombstones/archival where legal and business requirements require history.
- Do not log full personal records or credentials for debugging.

## Acceptance criteria
- [ ] Schema change has a data-impact review and RLS review.
- [ ] Constraints and indexes support the intended access patterns.
- [ ] Tenant isolation tests are included.
- [ ] Migration and recovery plans are documented.
