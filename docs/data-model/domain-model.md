# Domain model and lifecycle contracts

- Status: Proposed
- Scope: CRM, AI prospecting, sales execution, and financial operations
- Owner/team: TBD
- Last reviewed: 2026-10-24

> This document defines logical concepts and invariants for review. It is not a physical database schema, API contract, or authorization to run migrations. Reconcile it with the existing Supabase project and any deployed consumers before implementation.

## 1. Modeling principles

1. Every tenant-owned business record has an explicit organization/tenant ownership path.
2. Use stable identifiers and explicit foreign-key relationships; enforce critical uniqueness and integrity rules in the database where possible.
3. Separate lifecycle state from activity history, approval state, fulfillment state, and financial settlement state.
4. Record material state transitions with actor, timestamp, reason/source, and correlation ID where available.
5. Prefer append-only evidence and financial history. Corrections should be explicit rather than silently overwriting settled or reviewed facts.
6. All money uses exact decimal/numeric storage with an explicit currency. Never use binary floating point for authoritative financial values.
7. AI-generated facts and recommendations retain source provenance, confidence, model/task metadata where permitted, and human review outcomes.

## 2. Core entity groups

### Identity and organization

- **Organization** owns tenant-scoped CRM and commercial data.
- **User** is an authenticated identity.
- **Membership** associates a user with an organization and its role assignments.
- **Role / Permission** describes allowed actions; record ownership and business policies may further restrict access.
- **Audit event** records security-sensitive and material business changes without copying secrets or unnecessary personal data.

A user may belong to multiple organizations. Authorization must resolve the active organization on the server and must not trust a client-supplied organization ID alone.

### Customer and prospecting

- **Company** represents a business entity within the tenant's customer/prospect workspace.
- **Contact** represents a person. A contact may be associated with multiple companies over time.
- **Company-contact relationship** records the relationship, role/title, validity period, and primary designation where applicable.
- **Lead** represents a prospecting/qualification record and its source, owner, status, and conversion history.
- **Lead conversion record** links a lead to the resulting company/contact/opportunity records and captures the conversion actor/time. Conversion must be idempotent.
- **Prospecting campaign/job** tracks discovery or enrichment work, status, budget, and execution metadata.
- **Evidence item** records a claim, source reference, observed time, provenance, and review status. Store only legally and operationally appropriate source content.
- **Enrichment/scoring result** stores a versioned result and explanation references; it must not silently overwrite verified user-entered facts.
- **Review decision** records accept/reject/correct/defer outcomes, reviewer, timestamp, and reason.

### Sales

- **Opportunity** tracks a potential commercial transaction, owner, stage, amount/currency estimate, and close-date estimate.
- **Activity / Task** records customer interactions and assigned work; completion history should remain auditable.
- **Product** describes a sellable item/service.
- **Price list / Price list item** defines currency, validity window, unit price, and eligibility rules.
- **Quote / Quote version / Quote item** records a proposal and its versioned commercial terms. An issued/accepted version is immutable in meaning; changes create a new version.
- **Approval request / decision** records required approvals, approver, policy, decision, and timestamps.
- **Sales order / Order item** represents the accepted commercial commitment and snapshots the agreed product description, quantity, price, discounts, taxes, currency, and terms as required for historical correctness.

### Fulfillment and finance

- **Shipment / Shipment item** records fulfillment units, carrier/reference, quantities, and delivery events. One order may have multiple shipments.
- **Receivable / installment** represents an amount owed and its due date/currency; an order may produce multiple receivables.
- **Payment** records a received or initiated monetary transaction and external references/idempotency keys as appropriate.
- **Payment allocation** links a payment amount to a receivable. One payment can be allocated to multiple receivables and a receivable can receive multiple payments.
- **Refund / reversal** records a compensating transaction linked to the original payment and, where relevant, its allocations. Do not erase the original transaction.
- **Reconciliation record** tracks matching internal records with external statements or payment-provider records.

## 3. Relationship and integrity rules

- A company can have multiple contacts, leads, opportunities, quotes, and orders.
- Contact-company links should use a relationship record rather than a single permanent company field when multi-company history is required.
- A lead conversion preserves source, evidence references, ownership, and conversion history, and must not create duplicate company/contact records on retry.
- An opportunity can have multiple quote versions; an accepted quote version should be traceable to the resulting order.
- An order can have multiple shipments and receivables; fulfillment and collection progress are independent.
- Payment allocations must not exceed the allocatable payment balance or the open receivable balance, subject to explicit rules for overpayments, credits, fees, and currencies.
- Refund/reversal amounts must be bounded by the refundable amount and must be idempotent against provider retries.
- Cross-currency allocation is prohibited unless a reviewed FX policy defines conversion rate, rate timestamp, and rounding.
- Uniqueness and deduplication rules must be organization-scoped and reviewed for false positives; AI match suggestions require explainability and a safe human-review path.

## 4. Proposed lifecycle states

These names are a starting point. Exact states, allowed transitions, and cancellation semantics require product-owner approval before API or schema implementation.

| Aggregate | Proposed states / transitions | Key invariant |
|---|---|---|
| Lead | new → researching → qualified / disqualified → converted | Conversion is idempotent; converted lead retains its history. |
| AI review | pending → accepted / rejected / needs-correction / deferred | Only authorized reviewers can finalize review; evidence and decision are auditable. |
| Opportunity | open stages → won / lost | Won/lost transitions capture actor/time; reopening follows explicit policy. |
| Quote version | draft → pending-approval (if required) → approved → issued → accepted / declined / expired / superseded | Issued versions preserve their terms; approval is tied to a specific version. |
| Sales order | draft → confirmed → in-progress → completed; cancellation where policy permits | Confirmed terms are snapshotted; cancellation does not erase fulfillment/financial history. |
| Shipment | planned → packed → dispatched → in-transit → delivered; exception / cancelled as applicable | Shipped/delivered quantities reconcile to order quantities under explicit partial-fulfillment rules. |
| Receivable | open → partially-paid → paid; overdue is derived or policy-controlled; void/write-off requires permission | Payment allocation history, not a manually edited status alone, determines settlement. |
| Payment | initiated → pending → succeeded / failed / cancelled; refund/reversal tracked separately | Provider events are signature-validated, idempotent, and auditable. |
| Refund | requested → pending → succeeded / failed / cancelled | Refunds reference the original payment and respect refundable balance. |
| Background job | queued → running → succeeded / retrying → failed / cancelled | Retry count, idempotency key, terminal failure reason, and correlation ID are retained. |

## 5. State transition contract

Every material transition should define:

- permitted source state(s) and target state;
- required actor capability and any record-level policy;
- validated preconditions and immutable-field rules;
- transactional writes and emitted domain/integration events;
- idempotency behavior and duplicate-request response;
- audit fields and user-safe error code;
- side effects, retry policy, and compensating action where applicable.

Reject invalid transitions server-side even when the UI hides the action. Use optimistic concurrency/version checks where concurrent updates could invalidate preconditions.

## 6. Implementation acceptance checklist

- [ ] Product owner approves state names, cancellation/reopen rules, and financial edge cases.
- [ ] Existing database and deployed consumers are inspected before selecting physical tables or migrations.
- [ ] Tenant ownership paths, unique constraints, indexes, and RLS policies are reviewed together.
- [ ] Domain-level transition tests cover valid and invalid paths.
- [ ] Integration tests cover duplicate delivery, concurrent updates, retries, and partial failures.
- [ ] Financial tests cover partial allocations, overpayments, refunds, reversals, rounding, and currency mismatch.
- [ ] AI provenance and review tests cover missing/weak evidence, corrections, and repeated enrichment.
