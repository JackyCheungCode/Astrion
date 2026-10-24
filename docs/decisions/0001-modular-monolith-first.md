# ADR 0001: Modular monolith as the initial architecture

- Status: Accepted as an architectural direction; implementation pending repository/environment verification
- Date: 2026-10-24
- Decision owners: TBD

## Context

Astrion spans CRM, AI prospecting, sales, fulfillment, finance, settings, and integrations. These domains require explicit ownership and contracts, but the repository does not yet expose a verified application manifest or deployment configuration. Choosing a microservice topology or creating a new runtime before inspecting the actual environment would add avoidable operational and migration risk.

## Decision

Adopt a **modular-monolith-first** direction for initial implementation:

- Keep business domains in clearly bounded modules with intentional public exports.
- Separate domain rules, application orchestration, infrastructure adapters, API transport, and UI concerns where those layers are useful.
- Keep provider-specific AI, payment, email, and integration code behind adapters.
- Use explicit contracts/events for asynchronous or cross-module workflows; avoid circular dependencies.
- Keep worker execution as a deployable process only if the verified stack and workload justify it; do not require separate services merely to match the target directory sketch.
- Preserve the current repository's actual framework, package manager, hosting, and database constraints after inspection.

## Consequences

### Benefits

- Lower initial deployment and operational complexity.
- Easier transactional consistency for lead conversion, quote/order creation, and financial allocations.
- Clear seams for later extraction if measured scaling, isolation, or team ownership requires it.

### Trade-offs

- Module boundaries must be enforced through code review, dependency checks, and tests.
- A single deployment can couple release cadence until independent deployment is justified.
- Background jobs and long-running provider calls still need explicit retry, timeout, idempotency, and observability policies.

## Rejected alternatives

- **Immediate microservices:** rejected because no measured scaling or independent deployment requirement has been established, and runtime/deployment constraints are not yet verified.
- **Unstructured single application:** rejected because the CRM, AI, commercial, and finance domains have different invariants and security requirements.

## Revisit when

- A domain requires independent scaling or release cadence supported by evidence;
- failure isolation or regulatory boundaries require process separation;
- team ownership and service-level objectives justify the added operational cost.

## Implementation gates

Before code or infrastructure changes, record the current frontend/backend stack, package manager, CI/deployment setup, Supabase project/migrations/RLS state, and any existing data or consumers. This ADR does not authorize dependency installation, schema migration, or deployment.
