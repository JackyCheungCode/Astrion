# Authorization matrix and tenant-isolation baseline

- Status: Proposed
- Scope: application permissions, tenant isolation, AI actions, CRM records, commercial operations, and settings
- Owner/team: TBD
- Last reviewed: 2026-10-24

> This is a review baseline, not a claim that these roles or controls already exist. Confirm the current identity provider, Supabase configuration, deployed services, and business approval policies before implementing grants or RLS.

## 1. Authorization model

Use layered authorization:

1. **Authentication:** establish the user/service identity.
2. **Tenant membership:** resolve the active organization from trusted server-side membership data.
3. **Capability:** check a named permission for the requested action.
4. **Record policy:** apply ownership, team, assignment, and lifecycle restrictions where required.
5. **Data policy:** enforce tenant isolation and row-level access at the persistence boundary (including RLS where supported).
6. **Approval policy:** require an independent authorized decision for sensitive or high-impact actions.
7. **Audit:** record sensitive access and material decisions without logging credentials or unnecessary personal data.

Frontend route guards and hidden buttons are usability controls only. They must never be the sole authorization enforcement.

## 2. Candidate roles

Roles below are illustrative bundles of capabilities. Product owners must confirm the final role names and separation-of-duties rules.

- **Organization owner:** organization lifecycle and highest-impact administrative controls.
- **Administrator:** membership, role assignment, organization settings, and configuration, excluding restricted owner-only actions if required.
- **Sales manager:** team pipeline, assignments, forecasts, and policy-defined approvals.
- **Sales representative:** assigned leads, companies, contacts, activities, and opportunities; creates quotes within delegated limits.
- **Prospecting analyst:** prospecting jobs, research evidence, enrichment, scoring, and review queue according to assignment.
- **Finance operator:** receivables, payments, allocations, refunds, and reconciliation within explicit limits.
- **Read-only / auditor:** permitted read access and audit review, without mutation privileges.
- **Service identity:** narrow, task-specific machine permissions; no interactive login and no blanket user-equivalent access.

A person may have multiple role bundles, but sensitive actions should enforce separation of duties when required (for example, a requester should not approve their own high-value quote or refund).

## 3. Capability matrix (proposed defaults)

Legend: **Own/team** means only records allowed by assignment/team policy; **Scoped** means only explicitly granted records or settings; **Approval** means additional policy approval is required.

| Capability area | Owner | Admin | Sales manager | Sales rep | Prospecting analyst | Finance operator | Auditor |
|---|---|---|---|---|---|---|---|
| Organization and membership | Full | Scoped | No | No | No | No | Read audit only |
| Role and permission assignment | Full | Scoped | No | No | No | No | Read audit only |
| Leads / companies / contacts | Full | Scoped | Own/team | Own | Scoped | Read as needed | Read scoped |
| AI research / enrichment | Full | Scoped | Own/team | Assigned | Own/team | No by default | Read audit/evidence as granted |
| AI review decisions | Full | Scoped | Scoped | Scoped | Assigned | No by default | Read only |
| Opportunities / activities / tasks | Full | Scoped | Own/team | Own | Scoped | Read as needed | Read scoped |
| Products / pricing | Full | Scoped | Scoped | Read / delegated edit | No | Read as needed | Read only |
| Quotes / approvals | Full | Scoped | Approval within policy | Create/edit draft; submit | No | Read as needed | Read only |
| Sales orders / fulfillment | Full | Scoped | Read / scoped actions | Read / scoped actions | No | Read as needed | Read only |
| Receivables / payments / allocations | Full | No by default | Read limited | No by default | No | Scoped | Read only |
| Refunds / reversals | Approval | No by default | No by default | No | No | Request/execute by policy; high-risk approval | Read only |
| API keys / integrations / secrets metadata | Full | Scoped, never secret reveal | No | No | No | No | Audit only |
| Audit logs / exports | Full | Scoped | Scoped | Own actions where permitted | Own actions where permitted | Finance scope | Scoped read |
| Security / retention / destructive operations | Full | Scoped / approval | No | No | No | No | Read audit only |

The table is a discussion aid, not a grant template. Explicitly define each permission as a stable identifier (for example, `lead.read`, `lead.convert`, `quote.issue`, `quote.approve`, `payment.allocate`, `refund.execute`, `settings.api_keys.rotate`), and define the permitted scope separately.

## 4. Tenant isolation requirements

- Resolve tenant membership on the server; never authorize solely from a request body, query parameter, or browser state.
- Every tenant-owned row must have a provable organization ownership path. Join tables and child rows require equivalent protection.
- RLS policies should deny by default and check both membership and operation-specific conditions.
- Test select, insert, update, delete, joins, views, RPC/functions, storage access, background jobs, and service endpoints for cross-tenant access.
- Privileged service credentials must remain server-side. Service-role access must not be mistaken for end-user authorization.
- Tenant identifiers in URLs or UUIDs are not authorization.
- Background jobs and webhooks must carry a trusted tenant context and validate it against the referenced record.
- Avoid leaking record existence through error differences where the caller lacks access.

## 5. High-impact actions and separation of duties

At minimum, define explicit policy and audit requirements for:

- issuing or accepting a quote and confirming/cancelling an order;
- price/discount overrides and approval-limit changes;
- executing refunds, reversing allocations, or writing off receivables;
- rotating/revoking API keys and changing integration endpoints;
- changing roles, tenant settings, retention policies, or destructive data operations;
- enabling autonomous AI outreach or other external side effects.

Approval records should identify the requested action, target record/version, policy applied, requester, approver, decision, timestamp, and reason. Re-evaluate relevant preconditions when executing an approved action; approval of an old quote version must not authorize a newer version.

## 6. API and error behavior

- Return a stable authentication error when identity is missing/invalid and a stable authorization error when an action is forbidden.
- Validate inputs before mutation and avoid exposing internal SQL, provider responses, credentials, or cross-tenant record details.
- Use idempotency keys for sensitive create/execute endpoints and webhook processing.
- Apply rate limits and audit for API keys, authentication, exports, and sensitive mutations.
- Audit denied high-risk attempts where useful, while preventing log flooding and sensitive-data capture.

## 7. Required verification

- [ ] Permission catalogue reviewed by product/security owners.
- [ ] Default-deny behavior is tested for unauthenticated and unassigned users.
- [ ] Cross-tenant read/write tests cover direct rows and relationship joins.
- [ ] RLS policies and server-side checks agree; neither is assumed to replace the other.
- [ ] Role assignment and privilege escalation tests are included.
- [ ] Approval limits and separation-of-duties rules have positive and negative tests.
- [ ] API key rotation/revocation, webhook signatures, and service identities are tested.
- [ ] Audit events are emitted for high-impact actions without secret leakage.
