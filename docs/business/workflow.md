# Business workflow

## Main lifecycle

AI prospecting → research/evidence review → lead qualification → company/contact matching → lead conversion → opportunity → product/pricing → quote → approval (when required) → sales order → fulfillment and receivables in parallel → payments and allocation → reconciliation/reporting.

## Entity relationships

- A company can have multiple contacts, leads, opportunities, quotes, and orders.
- A contact may relate to more than one company over time; use an explicit relationship record when needed.
- A lead conversion must preserve source, evidence, owner, and conversion history; avoid creating duplicate companies/contacts.
- An opportunity can have multiple quote versions.
- A sales order can have multiple shipments and multiple receivable installments.
- A payment can be allocated across one or more receivables; allocation is distinct from the payment itself.
- Refunds and reversals should be explicit records, not destructive edits to settled payment history.

## State and audit rules

- Use explicit state transitions and server-side policy checks.
- Keep order, shipment, receivable, payment, and approval states separate.
- Confirmed commercial terms should be versioned; preserve historical quote/order terms.
- Enforce idempotency for critical writes and async jobs.
- Store timestamps, actor, source, and audit details for material changes.
